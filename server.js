const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();
const multer = require('multer');
const jwt = require("jsonwebtoken");
const {startEmailListener} = require('./emailListener');
const pool = require("./db");
const authorize = require("./middleware/auth");
const isAdmin = require("./middleware/admin");
const fs = require('fs');
const app = express();
const port = process.env.PORT;
const path = require('path');
const auth = require("./middleware/auth");
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const otpStore = new Map();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(cors());
app.use(express.json());
const storage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'upload');
  },
  filename:(req,file,cb)=>{
    cb(null,file.originalname);
  }
});
const upload = multer({storage:storage});

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const uploadDisk = multer({ storage: diskStorage }); 


const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});




app.post("/api/auth/student-signup",async (req, res) => {
  const {   full_name, course, department,roll_number, email, password } = req.body;

  try {
   
    const adminCheck = await pool.query("SELECT email FROM admin_signup WHERE email = $1", [email]);
    const studentCheck = await pool.query(
      "SELECT email, roll_number FROM student_signup WHERE email = $1 OR roll_number = $2", 
      [email, roll_number]
    );

    if (adminCheck.rowCount > 0 || studentCheck.rowCount > 0) {
      return res.status(400).json({ msg: "Email or Roll Number already exists in the system." });
    }

   
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   
    await pool.query(
      `INSERT INTO student_signup 
      ( full_name, course, department,roll_number, email, password) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [ full_name, course, department,roll_number, email, hashedPassword]
    );

    res.status(201).json({ msg: "Student registered! Awaiting Admin approval." });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error during student signup." });
  }
});


app.post("/api/auth/signup", async (req, res) => {
  const { email, password, college_name } = req.body;
  
  try {
   
    const adminCountRes = await pool.query("SELECT COUNT(*) FROM admin_signup");
    const adminCount = parseInt(adminCountRes.rows[0].count);

    if (adminCount >= 1) {
      return res.status(403).json({ 
        msg: "An Admin account already exists. Only one TPO/Admin is allowed." 
      });
    }

    
    const studentCheck = await pool.query("SELECT email FROM student_signup WHERE email = $1", [email]);
    if (studentCheck.rowCount > 0) {
      return res.status(400).json({ msg: "This email is already registered as a student." });
    }

   
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    
    await pool.query(
      `INSERT INTO admin_signup (email, password, college_name, is_approved) 
       VALUES ($1, $2, $3, $4)`,
      [email, hashedPassword, college_name, true] 
    );

    res.status(201).json({ msg: "Admin account created successfully!" });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server error during admin signup." });
  }
});

app.post("/api/auth/login",  async (req, res) => {
  const { email, password } = req.body;

  try {
   
    let userRes = await pool.query("SELECT * FROM admin_signup WHERE email = $1", [email]);
    let user = userRes.rows[0];
    let role = 'admin';

    
    if (!user) {
      userRes = await pool.query("SELECT * FROM student_signup WHERE email = $1", [email]);
      user = userRes.rows[0];
      role = 'student';
    }

   
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

   
    if (role === 'student' && !user.is_approved) {
      return res.status(403).json({ msg: "Access denied. Your account is pending TPO approval." });
    }

  
    const token = jwt.sign(
      { id: user.id, role: role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    
     
    res.json({ token, role, email: user.email });

  } catch (err) {
    res.status(500).send("Server Error");
  }
});



app.get("/api/profile/full-details", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const profileRes = await pool.query("SELECT * FROM student_profiles WHERE user_id = $1", [userId]);
    
    if (profileRes.rows.length === 0) return res.status(200).json(null);

    const profile = profileRes.rows[0];
    const sId = profile.student_id;

   
    const [internships, projects, skills, certifications, resume] = await Promise.all([
      pool.query("SELECT * FROM student_experience WHERE student_id = $1", [sId]),
      pool.query("SELECT * FROM student_projects WHERE student_id = $1", [sId]),
      pool.query("SELECT * FROM student_skills WHERE student_id = $1", [sId]),
      pool.query("SELECT * FROM student_certifications WHERE student_id = $1", [sId]),
      pool.query("SELECT * FROM student_resumes WHERE student_id = $1", [sId]), 
  
    res.json({
      ...profile,
      internships: internships.rows,
      projects: projects.rows,
      skills: skills.rows,
      certifications: certifications.rows,
      resume: resume.rows[0] || null 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching profile" });
  }
});


app.post("/api/profile/save-all", auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userId = req.user.id;

    const cleanNumeric = (val) => {
      if (val === null || val === undefined || val === "") return null;
      const cleaned = parseFloat(val.toString().replace('%', ''));
      return isNaN(cleaned) ? null : cleaned;
    };

    const {
      full_name, dob, gender, adhar_number, phone_number, roll_number,
      course, branch, college_email, x_percentage, xii_diploma_percentage,
      cgpa, backlogs, github, linkedin, portfolio,
      internships, projects, skills, certifications
    } = req.body;
    
    const x_percentage_clean = cleanNumeric(x_percentage);
    const xii_diploma_percentage_clean = cleanNumeric(xii_diploma_percentage);
    const cgpa_clean = cleanNumeric(cgpa);
    const finalBacklogs = (backlogs === null || backlogs === undefined || backlogs === '') 
    ? 0 
    : parseInt(backlogs);

    const formatToPostgresDate = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      const parts = dateStr.split(/[–-]/); 
      const firstPart = new Date(parts[0].trim());
      if (!isNaN(firstPart.getTime())) {
        return firstPart.toISOString().split('T')[0];
      }
      return null;
    };

 
    const sanitizedInternships = (internships || []).map(item => ({
      ...item,
     
      company_name: item.company || item.company_name, 
      duration: formatToPostgresDate(item.duration)
    }));

    const sanitizedCertifications = (certifications || []).map(item => ({
      ...item,
      issue_date: formatToPostgresDate(item.issue_date)
    }));
   

    const generateUniqueSlug = (name) => {
      if (!name) return "";
      const cleanName = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
      const randomStr = Math.random().toString(36).substring(2, 7);
      return `${cleanName}-${randomStr}`;
    };
   
    const profileRes = await client.query(
      `INSERT INTO student_profiles (user_id, full_name, dob, gender, adhar_number, phone_number, roll_number, course, branch, college_email, x_percentage, xii_diploma_percentage, cgpa, backlogs, github, linkedin, portfolio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (user_id) DO UPDATE SET 
       full_name=EXCLUDED.full_name, 
       dob=EXCLUDED.dob, 
       gender=EXCLUDED.gender, 
       adhar_number=EXCLUDED.adhar_number, 
       phone_number=EXCLUDED.phone_number, 
       roll_number=EXCLUDED.roll_number, 
       course = EXCLUDED.course, 
       branch = EXCLUDED.branch, 
       college_email=EXCLUDED.college_email,
       x_percentage=EXCLUDED.x_percentage,
       xii_diploma_percentage=EXCLUDED.xii_diploma_percentage,
       cgpa=EXCLUDED.cgpa, 
       backlogs=EXCLUDED.backlogs, 
       github=EXCLUDED.github, 
       linkedin=EXCLUDED.linkedin, 
       portfolio=EXCLUDED.portfolio,
       updated_at = NOW()
       RETURNING student_id`,
      [userId, full_name, dob, gender, adhar_number, phone_number, roll_number, course, branch, college_email, x_percentage_clean, xii_diploma_percentage_clean, cgpa_clean, finalBacklogs, github, linkedin, portfolio]
    );

    const existingProfile = await client.query(
      "SELECT portfolio_slug FROM student_profiles WHERE user_id=$1",
      [userId]
    );
    
    let portfolio_slug = null;
    if (existingProfile.rows.length > 0 && existingProfile.rows[0].portfolio_slug){
      portfolio_slug = existingProfile.rows[0].portfolio_slug; 
    } else {
      portfolio_slug = generateUniqueSlug(full_name);
      await client.query(
        "UPDATE student_profiles SET portfolio_slug = $1 WHERE user_id = $2",
        [portfolio_slug, userId]
      );
    }
    const sId = profileRes.rows[0].student_id;

    const syncTable = async (tableName, data, columns, placeholders) => {
      await client.query(`DELETE FROM ${tableName} WHERE student_id = $1`, [sId]);
      for (const item of (data || [])) {
        const values = columns.map(col => item[col]);
        await client.query(`INSERT INTO ${tableName} (student_id, ${columns.join(", ")}) VALUES ($1, ${placeholders})`, [sId, ...values]);
      }
    };

   
    await syncTable("student_experience", sanitizedInternships, ["company_name", "role", "duration", "description"], "$2, $3, $4, $5");
    await syncTable("student_projects", projects, ["title", "description", "tech_stack", "project_link"], "$2, $3, $4, $5");
    await syncTable("student_skills", skills, ["skill_name", "proficiency"], "$2, $3");
    await syncTable("student_certifications", sanitizedCertifications, ["title", "issuing_organization", "issue_date", "file_url"], "$2, $3, $4, $5");

    await client.query("COMMIT");
    res.status(200).json({ message: "Profile saved successfully", slug: portfolio_slug });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post("/api/profile/upload-image", auth, upload.single("profile_picture"), async (req, res) => {
  try {
    const filePath = req.file.path;
    await pool.query("UPDATE student_profiles SET profile_picture = $1 WHERE user_id = $2", [filePath, req.user.id]);
    res.json({ file_path: filePath });
  } 
  catch (err) { 
    res.status(500).send(err.message); 
  }
});

app.post("/api/profile/upload-resume", auth, upload.single("resume"), async (req, res) => {
  const client = await pool.connect();
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const userId = req.user.id; 
    const filePath = req.file.path;
   

    await client.query("BEGIN");

   
    const profileRes = await client.query(
      "SELECT student_id FROM student_profiles WHERE user_id = $1",
      [userId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: "Please save your profile details first before uploading a resume." });
    }

    const actualStudentId = profileRes.rows[0].student_id;

   
    const resumeUpdate = await client.query(`
      INSERT INTO student_resumes (student_id, file_path)
      VALUES ($1, $2)
      ON CONFLICT (student_id) 
      DO UPDATE SET 
        file_path = EXCLUDED.file_path, 
        uploaded_at = CURRENT_TIMESTAMP
      RETURNING *`, 
      [actualStudentId, filePath]
    );

    await client.query("COMMIT");

    console.log("Resume Synced for Profile ID:", actualStudentId);
    res.json({ 
      success: true, 
      file_path: filePath, 
      
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Database update failed", details: err.message });
  } finally {
    client.release();
  }
});


app.delete("/api/profile/clear-all", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM student_profiles WHERE user_id = $1", [req.user.id]);
    res.json({ message: "Profile deleted" });
  } catch (err) { res.status(500).send(err.message); }
});




app.post("/api/auth/change-password",authorize,async(req,res)=>{
      
        const {currentPassword,newPassword} = req.body;
        const userId = req.user.id;
        const hashed  = await bcrypt.hash(newPassword,10);
        const r = await pool.query("select password from users where id = $1",[userId]);
        if(r.rowCount==0) return res.status(400).json({msg:'user not found'})
        const oldPwd=  r.rows[0].password;
        
        const a = await bcrypt.compare(currentPassword,oldPwd);
        if(a){
          const rs= await pool.query('update users set password = $1 where id = $2',[hashed,userId]);
          return res.status(200).json({msg:"Password is changed .."});
        }
       
})




app.get("/api/admin/students/approvals", authorize, isAdmin, async (req, res) => {
  try {
    
    const result = await pool.query(
      `SELECT id, full_name,course, department, roll_number,email, is_approved 
       FROM student_signup`
    );
 
    res.json(result.rows); 
  } catch (err) {
    console.error("Approval Fetch Error:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/api/admin/analytics-complex", authorize,isAdmin, async (req, res) => {
  try {
    const { year, branch } = req.query;
    const selectedYear = parseInt(year);
    const branchFilter = branch === "Overall" ? null : branch;

 
    let totalPlacedQuery = `SELECT COUNT(*) FROM placements p 
                            JOIN student_profiles s ON p.student_id = s.student_id 
                            WHERE p.placement_year = $1`;
    let totalParams = [selectedYear];
    
    if (branchFilter) {
      totalPlacedQuery += ` AND s.branch = $2`;
      totalParams.push(branchFilter);
    }
    const totalRes = await pool.query(totalPlacedQuery, totalParams);


    let branchQuery = `SELECT s.branch, COUNT(*) as count FROM placements p 
    JOIN student_profiles s ON p.student_id = s.student_id 
    WHERE p.placement_year = $1`;
     let branchParams = [selectedYear];

    if (branchFilter) {
    branchQuery += ` AND s.branch = $2`;
      branchParams.push(branchFilter);
     }
    branchQuery += ` GROUP BY s.branch`;
    const branchDistRes = await pool.query(branchQuery, branchParams);

 
    let companyQuery = `SELECT p.company_name as company, COUNT(*) as count 
                        FROM placements p 
                        JOIN student_profiles s ON p.student_id = s.student_id 
                        WHERE p.placement_year = $1`;
    let companyParams = [selectedYear];

    if (branchFilter) {
      companyQuery += ` AND s.branch = $2`;
      companyParams.push(branchFilter);
    }
    companyQuery += ` GROUP BY p.company_name ORDER BY count DESC LIMIT 8`;
    const companyDistRes = await pool.query(companyQuery, companyParams);

 
    let historyQuery = `SELECT p.placement_year as year, COUNT(*) as count 
                        FROM placements p 
                        JOIN student_profiles s ON p.student_id = s.student_id 
                        WHERE p.placement_year BETWEEN $1 AND $2`;
    let historyParams = [selectedYear - 2, selectedYear];

    if (branchFilter) {
      historyQuery += ` AND s.branch = $3`;
      historyParams.push(branchFilter);
    }
    historyQuery += ` GROUP BY p.placement_year ORDER BY p.placement_year ASC`;
    const historyRes = await pool.query(historyQuery, historyParams);

   
    res.json({
      totalPlaced: parseInt(totalRes.rows[0].count),
      byBranch: branchDistRes.rows,
      byCompany: companyDistRes.rows,
      history: historyRes.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics synchronization failed" });
  }
});





app.get("/api/admin/profile/me", authorize,isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM admin_profiles WHERE user_id = $1", [req.user.id]);
   
    res.json(result.rows[0]);
    
  } catch (err) { res.status(500).send("Server Error"); }
});

const { sendApprovalEmail } = require("./utils/mailer");

app.put("/api/admin/students/approve/:id", authorize, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_approved } = req.body;

  try {
   
    const result = await pool.query(
      "UPDATE student_signup SET is_approved = $1 WHERE id = $2 RETURNING id ,full_name, email, is_approved",
      [is_approved, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Student not found" });
    }

    if (result.rows.length > 0) {
      const { email,full_name } = result.rows[0];
      console.log(result.rows[0]);
      await sendApprovalEmail(email, full_name);
      console.log(`Approval email sent to ${email}`);  
    }
    res.json({ 
      msg: `Student status updated to ${is_approved ? "Approved" : "Pending"}.`,
      updatedUser: result.rows[0] 
    });
   
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});



app.put("/api/admin/profile/update", authorize, isAdmin, upload.single('profile_picture'), async (req, res) => {
  const userId = req.user.id;
  
 
  const { 
    name = "", 
    college_email = "", 
    alternate_email = "", 
    designation = "", 
    college_location = "", 
    phone_number = "", 
    email_sync_enabled = "false" 
  } = req.body;

  try {
  
    const currentProfile = await pool.query(
      "SELECT profile_picture FROM admin_profiles WHERE user_id = $1", 
      [userId]
    );

  
    let picPath = req.file ? req.file.path : req.body.profile_picture;

   
    if (req.file && currentProfile.rows.length > 0) {
      const oldPathFromDb = currentProfile.rows[0].profile_picture;
      
      if (oldPathFromDb && oldPathFromDb !== req.file.path) {
        try {
          const absolutePath = path.resolve(oldPathFromDb);
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log("Old file deleted:", absolutePath);
          }
        } catch (fsErr) {
          console.error("FileSystem Error (Ignored):", fsErr.message);
         
        }
      }
    }

  
    const result = await pool.query(
      `INSERT INTO admin_profiles (
        user_id, name, college_email, alternate_email, designation, 
        college_location, phone_number, profile_picture, email_sync_enabled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        name = EXCLUDED.name, 
        college_email = EXCLUDED.college_email,
        alternate_email = EXCLUDED.alternate_email,
        designation = EXCLUDED.designation,
        college_location = EXCLUDED.college_location,
        phone_number = EXCLUDED.phone_number,
        profile_picture = EXCLUDED.profile_picture,
        email_sync_enabled = EXCLUDED.email_sync_enabled,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId, name, college_email, alternate_email, designation, 
        college_location, phone_number, picPath, email_sync_enabled === 'true'
      ]
    );

    res.json({ msg: "Profile updated successfully!", updatedProfile: result.rows[0] });

  } catch (err) {
    console.error("FULL DATABASE ERROR:", err);
    
  
    if (err.code === '42703') {
        return res.status(500).json({ error: "Database schema mismatch. Check if all columns exist in admin_profiles table." });
    }
    
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

app.get("/api/admin/branches", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM branches ORDER BY branch_name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Error fetching branches");
  }
});



app.post('/api/admin/branches', authorize, isAdmin, async (req, res) => {
  const { branch_name } = req.body;
  const adminUserId = req.user.id;

  if (!branch_name) return res.status(400).json({ msg: "Please select a branch." });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

   
    const result = await client.query(
      "INSERT INTO branches (branch_name) VALUES ($1) ON CONFLICT (branch_name) DO NOTHING RETURNING *",
      [branch_name]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ msg: "This branch is already in your directory." });
    }

    
    await client.query(
      `UPDATE admin_profiles 
       SET managed_branches = array_append(COALESCE(managed_branches, ARRAY[]::TEXT[]), $1) 
       WHERE user_id = $2`,
      [branch_name, adminUserId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Server error during branch addition." });
  } finally {
    client.release();
  }
});

app.delete('/api/admin/branches/:id', authorize, isAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const findBranch = await client.query(
      'SELECT branch_name FROM branches WHERE id=$1',
      [id]
    );

    if(findBranch.rows.length===0){
      await client.query('ROLLBACK');
      return res.status(404).json({msg:'Branch not found'});
    }
   const branchName = findBranch.rows[0].branchName;
   await client.query("DELETE FROM branches WHERE id = $1", [id]);

   await client.query(
    `UPDATE admin_profiles
    SET managed_branches = array_remove(managed_branches,$1)`,
    [branchName]
   );

   await client.query('COMMIT');
   res.json({msg:'Branch deleted successfully'})
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Delete Transaction Error:", err);
    res.status(500).json({ error: "Failed to delete branch and update profiles" });
  } finally {
    client.release();
  }
});
app.get("/api/admin/settings/active-year", authorize, isAdmin, async (req, res) => {
  try {
      const result = await pool.query("SELECT value FROM system_settings WHERE key = 'active_year'");
      if (result.rows.length === 0) {
          return res.json({ year: "2025" }); // Default if not in DB
      }
      res.json({ year: result.rows[0].value });
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
  }
});
app.put("/api/admin/settings/active-year", authorize, isAdmin, async (req, res) => {
  try {
      const { year } = req.body;
      await pool.query(
          "INSERT INTO system_settings (key, value) VALUES ('active_year', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
          [year]
      );
      res.json({ msg: "Settings updated" });
  } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
  }
});


const { sendUnifiedDriveEmail } = require('./utils/mailer'); 


app.post('/api/create-drive', auth, isAdmin, async (req, res) => {
  const { company_name,company_email, location, drive_date, min_cgpa, max_backlogs, roles, branches } = req.body;
  const client = await pool.connect();
  // console.log(company_email);
  try {
    await client.query('BEGIN');

  
    const driveRes = await client.query(
      'INSERT INTO placement_drives (company_name,company_email, location, drive_date, min_cgpa, max_backlogs, post_type) VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING drive_id',
      [company_name,company_email, location, drive_date, min_cgpa, max_backlogs,"manual"]
    );
    const driveId = driveRes.rows[0].drive_id;

    
    for (let role of roles) {
      await client.query(
        'INSERT INTO drive_roles (drive_id, role_title, job_type, salary_package, skills_required) VALUES ($1, $2, $3, $4, $5)',
        [driveId, role.title, role.type, role.salary, role.skills]
      );
    }

   
    for (let branch of branches) {
      await client.query('INSERT INTO eligible_branches (drive_id, branch_name) VALUES ($1, $2)', [driveId, branch]);
    }

    
    await client.query('COMMIT');

    
    sendUnifiedDriveEmail(driveId).catch(err => console.error("Mailer Background Error:", err));

    res.status(200).send({ 
      message: "Drive created successfully and personalized eligibility emails are being sent!" 
    });

  } catch (err) {
    
    await client.query('ROLLBACK');
    console.error("Database Error:", err);
    res.status(500).send(err.message);
  }
  finally{
    client.release();
  }
});

app.get('/api/student/placements/eligible', auth, async (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT 
      d.drive_id,
      d.company_name, 
      d.min_cgpa, 
      d.max_backlogs, 
      r.role_id,
      r.role_title,
      r.job_type,
      r.salary_package,
      -- Check if student meets criteria
      (
        sp.cgpa >= d.min_cgpa AND 
        sp.backlogs <= d.max_backlogs AND 
        ss.department = ANY(SELECT branch_name FROM eligible_branches WHERE drive_id = d.drive_id)
      ) AS is_eligible,
      -- Status from placement_applications
      pa.status AS application_status,
      CASE WHEN pa.application_id IS NOT NULL THEN TRUE ELSE FALSE END AS has_applied,
      -- Ineligibility Reason
      CASE 
        WHEN ss.department NOT IN (SELECT branch_name FROM eligible_branches WHERE drive_id = d.drive_id) 
          THEN 'Branch (' || ss.department || ') is not eligible'
        WHEN sp.cgpa < d.min_cgpa THEN 'CGPA below ' || d.min_cgpa
        WHEN sp.backlogs > d.max_backlogs THEN 'Backlogs exceed ' || d.max_backlogs
        ELSE 'Criteria Met'
      END AS ineligibility_reason
    FROM placement_drives d
    JOIN drive_roles r ON d.drive_id = r.drive_id
    CROSS JOIN student_profiles sp 
    JOIN student_signup ss ON ss.id = sp.user_id
    -- Link applications based on student_id and specific role_id
    LEFT JOIN placement_applications pa ON pa.student_id = sp.student_id AND pa.role_id = r.role_id
    WHERE sp.user_id = $1
    ORDER BY d.drive_date DESC;
  `;

  try {
    const result = await pool.query(query, [userId]);
    
    // If no rows, check if it's because the profile is missing
    if (result.rowCount === 0) {
      const profileCheck = await pool.query("SELECT 1 FROM student_profiles WHERE user_id = $1", [userId]);
      if (profileCheck.rowCount === 0) {
        return res.status(400).json({ error: "Please complete your profile first." });
      }
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Backend Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});



app.get('/api/admin/drives', auth, isAdmin, async (req, res) => {
  const { year } = req.query;
  
  if (!year) return res.status(400).json({ error: "Year is required" });

  try {
    const query = `
      SELECT 
        pd.drive_id as id, 
        pd.company_name as name, 
        pd.location, 
        pd.drive_date, 
        pd.min_cgpa, 
        pd.max_backlogs,
        pd.post_type,
        COALESCE(
          json_agg(
            json_build_object(
              'role_id', dr.role_id,
              'role_title', dr.role_title,
              'job_type', dr.job_type,
              'salary_package', dr.salary_package
            )
          ) FILTER (WHERE dr.role_id IS NOT NULL), 
          '[]'
        ) as roles
      FROM placement_drives pd
      LEFT JOIN drive_roles dr ON pd.drive_id = dr.drive_id
      WHERE EXTRACT(YEAR FROM pd.drive_date) = $1
      GROUP BY pd.drive_id
      ORDER BY pd.drive_date DESC`;

    const result = await pool.query(query, [year]);

    
    const formattedData = result.rows.map(drive => ({
      ...drive,
      status: new Date(drive.drive_date) >= new Date().setHours(0,0,0,0) ? 'Live' : 'Closed'
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.delete('/api/admin/drives/:id', auth, async (req, res) => {
  const driveId = req.params.id;
  const client = await pool.connect();

  try {
      await client.query('BEGIN');

     
      const result=  await client.query('DELETE FROM placement_drives WHERE drive_id = $1', [driveId]);

    
      if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ msg: "Drive not found" });
      }

      await client.query('COMMIT');
      res.status(200).json({ msg: "Drive and all associated data deleted successfully" });

  } catch (err) {
      await client.query('ROLLBACK');
      console.error("Delete Error:", err.message);
      res.status(500).json({ msg: "Internal Server Error" });
  } finally {
      client.release();
  }
});






app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);

  startEmailListener().catch(err => {
    console.error("Failed to start email bot:", err.message);
});
});



app.get("/api/public/portfolio/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT sp.*, 
        (SELECT json_agg(s) FROM student_skills s WHERE s.student_id = sp.student_id) as skills,
        (SELECT json_agg(p) FROM student_projects p WHERE p.student_id = sp.student_id) as projects,
        (SELECT json_agg(i) FROM student_experience i WHERE i.student_id = sp.student_id) as internships,
        (SELECT json_agg(c) FROM student_certifications c WHERE c.student_id=sp.student_id)as certification,
        (SELECT json_agg(r) FROM student_resumes r WHERE r.student_id=sp.student_id)as resume
       FROM student_profiles sp 
       WHERE sp.portfolio_slug = $1`, 
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Portfolio Fetch Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const extractText = async (buffer) => {
  try {
    console.log(buffer);
   
    if (!buffer) throw new Error("File buffer is empty. Check Multer configuration.");   
    const data = await pdf(buffer);
    console.log(data);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF contains no readable text (it might be an image/scan).");
    }
    return data.text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error("Internal PDF Logic Error:", error.message);
    throw new Error("PDF parsing failed");
  }
};

app.post('/api/resume/parse', uploadMemory.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

   
    const rawText = await extractText(req.file.buffer);

    if (!rawText || rawText.length < 20) {
      return res.status(400).json({ error: "PDF seems empty or is a scanned image." });
    }
     
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  
    const prompt = `
     Extract student information from the following resume text. 

STRICT COURSE & BRANCH MAPPING RULES:

1. COURSE MAPPING:
   Map mentioned degrees to these EXACT codes: [B.Tech, B.C.A, B.B.A, M.Tech, M.B.A, M.C.A, Diploma-ECE(VMC), Diploma-ME(VAS), Diploma-CSE(VCS)].
   - "Bachelor of Technology", "BTech", "BE" -> "B.Tech"
   - "Bachelor of Computer Applications", "BCA" -> "B.C.A"
   - "Bachelor of Business Administration", "BBA" -> "B.B.A"
   - "Master of Technology", "MTech" -> "M.Tech"
   - "Master of Business Administration", "MBA" -> "M.B.A"
   - "Master of Computer Applications", "MCA" -> "M.C.A"
   - "Diploma" + "Electronics/Mobile" -> "Diploma-ECE(VMC)"
   - "Diploma" + "Mechanical/Automobile" -> "Diploma-ME(VAS)"
   - "Diploma" + "Computer Science" -> "Diploma-CSE(VCS)"

2. BRANCH MAPPING:
   Map branches to these EXACT codes: [CSE, AI&DS, ECE, EEE, MECH, CIVIL, Computer Applications, Business Administration, Computer Science, Mobile Communication, Automobile Servicing].
   
   Logic for B.Tech Branches:
   - "IT", "Computer Science", "CSE", "CS" -> "CSE"
   - "AI", "Data Science", "Artificial Intelligence", "AI&DS" -> "AI&DS"
   - "Electronics", "Communication", "ECE" -> "ECE"
   - "Electrical", "EEE" -> "EEE"
   - "Mechanical", "MECH" -> "MECH"
   - "Civil" -> "CIVIL"

   Logic for Other Degrees:
   - If Course is B.C.A or M.C.A -> Branch is "Computer Applications"
   - If Course is B.B.A or M.B.A -> Branch is "Business Administration"
   - If Course is M.Tech or Diploma-CSE(VCS) -> Branch is "Computer Science"
   - If Course is Diploma-ECE(VMC) -> Branch is "Mobile Communication"
   - If Course is Diploma-ME(VAS) -> Branch is "Automobile Servicing"
   
   3. CGPA & PERCENTAGE LOGIC (JNTU-GV Standard):
   - If the value found for B.Tech or Diploma is a percentage (value > 10 or followed by '%'), CONVERT it to CGPA using this formula: CGPA = (Percentage / 10) + 0.75.
   - Example: "85%" -> (85/10) + 0.75 = 9.25.
   - Example: "72.5%" -> (72.5/10) + 0.75 = 8.00.
   - If the value is already <= 10, keep it as is.
   - Final cgpa field must ALWAYS be a decimal between 0 and 10.

   4. EMAIL EXTRACTION LOGIC:
   - Look for any email address in the text.
   - If the email ends in "@gmail.com", "@sitam.co.in", or any other valid domain, map it to the "college_email" field. 
   - Ensure you capture the full address (e.g., studentname@gmail.com).
   - If multiple emails are found, prioritize the one that contains the college domain (e.g., "@sitam.co.in") for "college_email". If none match the college domain, use the first validal email found.
   - Map it for college_email . 
   
   
   5.ROLL NUMBER EXTRACTION:
   - Look for patterns like "Roll No: 22B61A0510 " or "Roll Number - 22B61A0510" or "22B61A0510" (where the format is typically 2 digits + 1 uppercase letter + 2 digits + 1 uppercase letter + 4 digits).
   - Extract and map this to the "roll_number" field.
   
   6. Gender Identification:
   - Map branches to these EXACT codes: [Male, Female, Other].
   -"male", "M" -> "Male"
   -"female","F" ->"Female"
   -"other","non-binary","non binary","N/A","transgender",->"Other"

   7.Date Of Birth Extraction :
   - Look for patterns like "DOB: 01/01/2000", "Date of Birth - 1st Jan 2000", "Born on 2000-01-01", etc.
   - Extract the date and map it to "dob" field in ISO format (YYYY_MM_DD).
   - Map it to the dob in json 

Return the data strictly as a JSON object with these keys:
{
  "full_name": "string",
  "roll_number": "string",
  "dob":"Extracted Date Of Birth",
  "college_email": "Extracted email or null",
  "gender" : "string",
  "phone_number": "string",
  "course": "string (Mapped Degree)",
  "branch": "string (Mapped Branch)",
  "x_percentage": "number or string",
  "xii_diploma_percentage": "number or string",
  "cgpa": "decimal (Converted to 10-point scale)",
  "linkedin": "string",
  "github": "string",
  "portfolio": "string",
  "skills": [{"skill_name": "string", "proficiency": "string"}],
  "projects": [{"title": "string", "description": "string", "tech_stack": ["strings"]}],
  "internships": [{"company": "string", "role": "string", "duration": "string"}],
  "certifications": [{"title":"string", "issuing_organization":"string", "issue_date":"string"}]
}

If a field is missing, use null or an empty array.
Resume Text: ${rawText}
    `;

    const result = await model.generateContent(prompt);
    
    const response = await result.response;
    let text = response.text();
    console.log("Ai info :",text);
    
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);
   
    res.status(200).json({ 
      message: "Extraction complete", 
      extractedText: parsedData
    });

  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/student/applications/apply", auth,  async (req, res) => {
  const { drive_id , role_id} = req.body;
  const userId = req.user.id;
    console.log("Application :",drive_id,role_id);
  try {
    const studentResult = await pool.query(
      "SELECT student_id FROM student_profiles WHERE user_id = $1", 
      [userId]
  );
  const sId = studentResult.rows[0].student_id;
  
  await pool.query(
      "INSERT INTO placement_applications (drive_id, student_id,role_id) VALUES ($1, $2,$3)",
      [drive_id, sId,role_id]
  );
    res.json({ msg: "Application successful!" });
  } catch (err) {
    res.status(500).send("Server Error",err);
  }
});

app.get('/api/admin/drive-applicants/:driveId', auth,isAdmin, async (req, res) => {
  const { driveId } = req.params;
  console.log("Drive ID :",driveId);
  const query = `
    SELECT 
      pa.application_id,
      pa.status,
      pa.applied_at,
      sp.full_name,
      sp.roll_number,
      sp.cgpa,
      sp.portfolio_slug,
      ss.department AS branch,
      r.role_title
    FROM placement_applications pa
    JOIN student_profiles sp ON pa.student_id = sp.student_id
    JOIN student_signup ss ON ss.id = sp.user_id
    JOIN drive_roles r ON pa.role_id = r.role_id
    WHERE pa.drive_id = $1
    ORDER BY pa.applied_at DESC;
  `;

  try {
    const result = await pool.query(query, [driveId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch applicants" });
  }
});

app.post('/api/admin/applications/bulk-status', auth, async (req, res) => {
  const { applicationIds, newStatus } = req.body; 

  if (!applicationIds || applicationIds.length === 0) {
    return res.status(400).json({ error: "No students selected" });
  }

  try {
    const query = `
      UPDATE placement_applications 
      SET status = $1 
      WHERE application_id = ANY($2::int[])
    `;
    await pool.query(query, [newStatus, applicationIds]);
    
    res.json({ msg: `Updated ${applicationIds.length} students to ${newStatus}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bulk update failed" });
  }
});




const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});


app.post("/api/profile/send-reminder", auth, async (req, res) => {
  try {
    const { full_name, missingFields = [] } = req.body;
    const userId = req.user.id;

 
    const userResult = await pool.query("SELECT email FROM student_signup WHERE id=$1", [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetEmail = userResult.rows[0].email;

    const mailOptions = {
      from: `"Student Portal" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: "Action Required: Complete Your Profile",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #e91e63;">Hello ${full_name || 'Student'},</h2>
          <p>Your resume was successfully uploaded, but our system noticed some missing information in your profile.</p>
          <p><strong>Please fill in the following fields:</strong></p>
          <ul style="color: #555; background-color: #f9f9f9; padding: 20px; border-radius: 5px; list-style-type: none;">
            ${missingFields.length > 0 
              ? missingFields.map(field => `<li style="margin-bottom: 8px;">⚠️ ${field}</li>`).join('') 
              : "<li>General profile update required</li>"}
          </ul>
          <p>A complete profile significantly increases your visibility to recruiters.</p>
          <br />
          <div style="text-align: center;">
            <a href="http://yourportal.com/profile" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Finish My Profile</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Reminder email sent" });

  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Internal server error while sending email" });
  }
});

app.post('/api/admin/applications/send-to-company', auth, isAdmin, async (req, res) => {
  const { applicationIds, driveId } = req.body;
   console.log(applicationIds,driveId);
  if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({ error: "Missing required data" });
  }

  try {
  
      const emailResult = await pool.query("SELECT company_email FROM placement_drives WHERE drive_id = $1", [driveId]);
      
      if (emailResult.rows.length === 0 || !emailResult.rows[0].company_email) {
          return res.status(404).json({ error: "Company email not found in drive details" });
      }
      const fetchedEmail = emailResult.rows[0].company_email;


      const applicantsResult = await pool.query(`
        SELECT 
            u.full_name, 
            u.roll_number, 
            u.branch, 
            u.cgpa, 
            u.portfolio_slug, 
            dr.role_title, -- Selecting from the drive_roles table
            a.status 
        FROM placement_applications a
        JOIN "student_profiles" u ON a.student_id = u.student_id
        JOIN drive_roles dr ON a.role_id = dr.role_id -- Joining the roles table
        WHERE a.application_id = ANY($1)
    `, [applicationIds]);
    
    const applicants = applicantsResult.rows;
      console.log(applicants);
   
      

      if (applicants.length === 0) {
          return res.status(404).json({ error: "No applicants found for provided IDs" });
      }


      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Applicant Data');

      worksheet.columns = [
          { header: 'Full Name', key: 'full_name', width: 25 },
          { header: 'Roll Number', key: 'roll_number', width: 15 },
          { header: 'Branch', key: 'branch', width: 15 },
          { header: 'CGPA', key: 'cgpa', width: 10 },
          { header: 'Portfolio', key: 'portfolio_slug', width: 25 },
          { header: 'Applied Role', key: 'role_title', width: 25 },
          { header: 'Current Status', key: 'status', width: 20 }
      ];

      applicants.forEach(app => worksheet.addRow(app));
      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();


      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      const mailOptions = {
          from: `"Placement Portal" <${process.env.EMAIL_USER}>`,
          to: fetchedEmail,
          subject: `Candidate List for Drive ID: ${driveId} - ${new Date().toDateString()}`,
          text: `Hello, \n\nPlease find attached the Excel sheet containing details of ${applicants.length} applied candidates.`,
          attachments: [{
              filename: `Applicants_List_Drive_${driveId}.xlsx`,
              content: buffer
          }]
      };

   
      await transporter.sendMail(mailOptions);
      
      await pool.query(
          `UPDATE placement_applications SET status = 'Applied' WHERE application_id = ANY($1)`, 
          [applicationIds]
      );

      res.status(200).json({ 
          success: true, 
          message: `Excel sheet sent to ${fetchedEmail} and statuses updated.` 
      });

  } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Failed to process request", details: error.message });
  }
});




app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log(email);

  const result = await pool.query("SELECT * FROM student_signup WHERE email = $1", [email]);
  const ser = result.rows[0];
  if (!ser) return res.status(404).json({ msg: "Email not registered" });


  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

  await transporter.sendMail({
    from: '"Your App" <yourapp@gmail.com>',
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  });

  res.json({ msg: "OTP sent" });
});


app.post("/api/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);

  if (!record) return res.status(400).json({ msg: "OTP not requested" });
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ msg: "OTP expired" });
  }
  if (record.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

  res.json({ msg: "OTP verified" });
});


app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore.get(email);

  if (!record || record.otp !== otp)
    return res.status(400).json({ msg: "Invalid or expired OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE student_signup SET password = $1 WHERE email = $2", [hashed, email]);
  otpStore.delete(email); // clear OTP after use

  res.json({ msg: "Password reset successful" });
});
