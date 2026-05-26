const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { parseEmailWithAI } = require('./geminiParser');
const { sendUnifiedDriveEmail } = require('./utils/mailer');
const pool = require('./db');
const dns = require('dns');
const fs = require('fs'); 
const path = require('path'); 
require('dotenv').config();

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}
dns.setServers(['8.8.8.8', '1.1.1.1']);

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const imapConfig = {
    host: process.env.EMAIL_HOST,
    port: 993,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    logger: false,
    connectionTimeout: 30000,
    greetingTimeout: 30000
};

let client;
let idleInterval;

const startEmailListener = async () => {
    if (client) {
        try { await client.logout(); } catch (e) {}
        client = null;
    }
    if (idleInterval) clearInterval(idleInterval);

    client = new ImapFlow(imapConfig);

    client.on('error', err => {
        if (!['ECONNRESET', 'ETIMEDOUT', 'EPIPE'].includes(err.code)) {
            console.error('IMAP Error:', err.message);
        }
    });

    client.on('close', () => {
        console.warn('🔌 Connection lost. Reconnecting in 10s...');
        if (idleInterval) clearInterval(idleInterval);
        setTimeout(startEmailListener, 10000);
    });

    try {
        await client.connect();
        await client.mailboxOpen('INBOX');
        console.log('🚀 Email Bot: Monitoring INBOX for TPO automation...');

        client.on('exists', async (data) => {
            let lock = await client.getMailboxLock('INBOX');
            try {
                const message = await client.fetchOne(data.count, { source: true });
                const parsed = await simpleParser(message.source);
                
                // --- NEW: EXTRACT SENDER EMAIL ---
                const companyEmail = parsed.from && parsed.from.value[0] ? parsed.from.value[0].address : null;
                const subject = (parsed.subject || "").toLowerCase();
                const body = parsed.text || "";

                const keywords = ['hiring', 'drive', 'recruitment', 'placement', 'job', 'opening', 'shortlist', 'schedule'];
                if (!keywords.some(word => subject.includes(word))) return;

                console.log(`📩 Processing: ${parsed.subject} from ${companyEmail}`);
                
                // 1. Extract and STORE Attachments locally
                const storedAttachments = [];
                if (parsed.attachments && parsed.attachments.length > 0) {
                    for (const att of parsed.attachments) {
                        const uniqueFilename = `${Date.now()}_${att.filename}`; // Added timestamp to avoid overwrite
                        const filePath = path.join(UPLOAD_DIR, uniqueFilename);
                        fs.writeFileSync(filePath, att.content);
                        
                        storedAttachments.push({
                            filename: att.filename,
                            path: filePath, 
                            contentType: att.contentType
                        });
                    }
                }

                const driveData = await parseEmailWithAI(body);

                if (driveData && driveData.drive) {
                    const dbClient = await pool.connect();
                    try {
                        await dbClient.query('BEGIN');

                        const existingRes = await dbClient.query(
                            `SELECT drive_id FROM placement_drives 
                             WHERE company_name ILIKE $1 AND placement_year = $2 LIMIT 1`,
                            [driveData.drive.company_name, driveData.drive.drive_year]
                        );

                        let driveId;
                        if (existingRes.rows.length > 0) {
                            driveId = existingRes.rows[0].drive_id;
                            // Update existing drive with latest company email if it changed
                            await dbClient.query(
                                `UPDATE placement_drives SET company_email = $1 WHERE drive_id = $2`,
                                [companyEmail, driveId]
                            );
                            console.log(`📍 Updated existing drive: ${driveId} with email ${companyEmail}`);
                        } else {
                            // --- ADDED company_email TO INSERT ---
                            const driveRes = await dbClient.query(
                                `INSERT INTO placement_drives (company_name, location, drive_date, min_cgpa, max_backlogs, post_type, placement_year, company_email) 
                                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING drive_id`,
                                [
                                    driveData.drive.company_name, 
                                    driveData.drive.location, 
                                    driveData.drive.drive_date, 
                                    driveData.drive.min_cgpa, 
                                    driveData.drive.max_backlogs, 
                                    "automation", 
                                    driveData.drive.drive_year,
                                    companyEmail // Storing the extracted email
                                ]
                            );
                            driveId = driveRes.rows[0].drive_id;
                            
                            for (let branch of [...new Set(driveData.eligible_branches || [])]) {
                                await dbClient.query(`INSERT INTO eligible_branches (drive_id, branch_name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [driveId, branch]);
                            }
                            for (let role of (driveData.roles || [])) {
                                await dbClient.query(`INSERT INTO drive_roles (drive_id, role_title, job_type, salary_package, skills_required) VALUES ($1, $2, $3, $4, $5)`, [driveId, role.role_title, role.job_type, role.salary_package, role.skills_required]);
                            }
                        }
                        await dbClient.query('COMMIT');

                        // 3. Automated Dispatch
                        if (existingRes.rows.length > 0) {
                            const applicants = await dbClient.query(
                                `SELECT ss.email FROM placement_applications pa 
                                 JOIN student_profiles sp ON pa.student_id = sp.student_id
                                 JOIN student_signup ss ON ss.id = sp.user_id
                                 WHERE pa.drive_id = $1`, [driveId]
                            );
                            const emails = applicants.rows.map(r => r.email);
                            
                            if (emails.length > 0) {
                                await sendUnifiedDriveEmail(driveId, {
                                    to: emails,
                                    subject: `Update: ${parsed.subject}`,
                                    attachments: storedAttachments 
                                });
                            }
                        } else {
                            await sendUnifiedDriveEmail(driveId, { attachments: storedAttachments });
                        }

                    } catch (dbErr) {
                        await dbClient.query('ROLLBACK');
                        console.error("❌ DB Error:", dbErr.message);
                    } finally {
                        dbClient.release();
                    }
                }
            } catch (err) {
                console.error("Fetch Error:", err.message);
            } finally {
                lock.release();
            }
        });

        const enterIdle = async () => {
            while (client && client.authenticated) {
                try { await client.idle(); } catch (e) { break; }
            }
        };
        enterIdle();
        idleInterval = setInterval(() => {
            if (client && client.authenticated) client.noop().catch(() => {});
        }, 15 * 60 * 1000);

    } catch (err) {
        console.error('Startup Failed:', err.message);
        setTimeout(startEmailListener, 5000);
    }
};

module.exports = { startEmailListener };