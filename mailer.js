const nodemailer = require('nodemailer');
const pool = require('../db'); 
const dns = require('dns'); 
const { path } = require('d3-path');
require('dotenv').config();

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

let transporter;

const initMailer = async () => {
    try {
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            pool: true, 
            maxConnections: 5,
            connectionTimeout: 20000,
            greetingTimeout: 20000,
            tls: {
                rejectUnauthorized: false 
            }
        });

        await transporter.verify();
        console.log(" Mailer is ONLINE via IPv4.");
        return transporter;
    } catch (error) {
        console.error(" Mailer Initialization Failed:", error.message);
    }
};

initMailer();

const sendApprovalEmail = async (email, name) => {
  if (!transporter) await initMailer();

  const mailOptions = {
    from: `"Placement Cell" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Account Approved - Placement Portal',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #2e7d32;">Hello, ${name}!</h1>
        <p>Your account has been approved by the administrator.</p>
        <p>You can now log in and complete your profile to apply for upcoming placement drives.</p>
        <br>
        <p>Best Regards,<br><b>Placement Team</b></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Approval Email Error for ${email}:`, error.message);
  }
};

const sendUnifiedDriveEmail = async (driveId, options = null) => {
  if (!transporter) await initMailer();

  try {

    // console.log("hiiii",options);
    // --- MODE: BROADCAST (Automation Flow with Stored Attachments) ---
    if (options && options.to) {
      console.log(`📧 Broadcaster: Dispatching update with ${options.attachments?.length || 0} stored attachments to ${options.to.length} students.`);
      
      const broadcastMailOptions = {
        from: `"TPO Placement Cell" <${process.env.EMAIL_USER}>`,
        bcc: options.to, // Using BCC is safer for bulk automated updates
        subject: options.subject || "Placement Drive Update",
        text: options.text || "Please find the attached document regarding the placement drive.",
        // UPDATED: Now uses 'path' to pull files stored in the system
        attachments: (options.attachments || []).map(att => ({
            filename: att.filename,
            path: att.path, // This tells Nodemailer to read the file from the disk
            contentType: att.contentType
        }))
      };

      try {
        await transporter.sendMail(broadcastMailOptions);
        console.log(`✅ Automated broadcast with stored attachments sent successfully.`);
      } catch (err) {
        console.error(`❌ Broadcast Mailing Error:`, err.message);
      }
      return; 
    }

    // --- MODE: STANDARD (New Drive Notification) ---
    const reportQuery = `
     SELECT 
    sp.full_name AS name, 
    ss.email, 
    ss.department,
    sp.cgpa, 
    sp.backlogs,
    d.company_name, 
    d.drive_date,
    d.location, 
    d.min_cgpa,
    d.max_backlogs,
    -- Check if student meets academic criteria (since branch is already filtered in WHERE)
    (sp.cgpa >= d.min_cgpa AND sp.backlogs <= d.max_backlogs) AS is_eligible,
    -- Reasons for academic rejection
    ARRAY_REMOVE(ARRAY[
        CASE WHEN sp.cgpa < d.min_cgpa 
             THEN 'Low CGPA (' || sp.cgpa || ' < ' || d.min_cgpa || ')' ELSE NULL END,
        CASE WHEN sp.backlogs > d.max_backlogs 
             THEN 'Backlogs exceed limit (' || sp.backlogs || ' > ' || d.max_backlogs || ')' ELSE NULL END
    ], NULL) AS detailed_reasons
    FROM student_signup ss
    JOIN student_profiles sp ON ss.id = sp.user_id
    CROSS JOIN (SELECT * FROM placement_drives WHERE drive_id = $1) d
    WHERE ss.is_approved = true
    -- ONLY students from the invited branches receive this mail
    AND ss.department IN (
    SELECT branch_name FROM eligible_branches WHERE drive_id = d.drive_id
   )`;

    const result = await pool.query(reportQuery, [driveId]);
    const studentReports = result.rows;

    const roleRes = await pool.query(
      'SELECT role_title, salary_package FROM drive_roles WHERE drive_id = $1', 
      [driveId]
    );
    const rolesList = roleRes.rows.map(r => `${r.role_title} @ ${r.salary_package} LPA`).join(', ');

    for (let report of studentReports) {
      const { is_eligible, detailed_reasons, name, email, company_name } = report;
      const reasonsHtml = detailed_reasons.length > 0 
        ? `<ul style="margin: 5px 0; padding-left: 20px;">${detailed_reasons.map(reason => `<li>${reason}</li>`).join('')}</ul>`
        : `<p>You meet all academic requirements.</p>`;

      const mailOptions = {
        from: `"TPO Placement Cell" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: is_eligible ? `✅ Eligible: New Opportunity at ${company_name}` : `📢 New Drive Posted: ${company_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: ${is_eligible ? '#059669' : '#1e293b'}; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Placement Drive Notification</h1>
            </div>
            <div style="padding: 25px;">
              <p>Hello <b>${name}</b>,</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                <h3 style="color: #4f46e5;">${company_name}</h3>
                <p><b>💼 Roles:</b> ${rolesList}</p>
                <p><b>📍 Location:</b> ${report.location}</p>
              </div>
              <div style="margin-top: 20px; padding: 15px; border: 2px solid ${is_eligible ? '#10b981' : '#f59e0b'}; background-color: ${is_eligible ? '#f0fdf4' : '#fffbeb'};">
                <h4>Status: ${is_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</h4>
                ${reasonsHtml}
              </div>
            </div>
          </div>
        `,

        attachments: (options?.attachments || []).map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
      })),
      };

      await transporter.sendMail(mailOptions);
      await new Promise(res => setTimeout(res, 500)); // Throttling
    }
  } catch (error) {
    console.error('Unified Mailing Error:', error);
  }
};

module.exports = { sendApprovalEmail, sendUnifiedDriveEmail };