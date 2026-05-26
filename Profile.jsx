import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import ProfilePlaceholder from "../../pngs/profile.png";
import { Authcontext } from "../../context/Authcontext";
import api from "../../utils/api";
import ProfilePreviewModal from '../../components/ProfilePreviewModal'
import ResumeUpload from '../../components/ResumeUpload';
import {
  Camera,
  Save,
  UserRoundPen as UserEdit,
  Trash2,
  Globe,
  Github,
  Linkedin,
  BookOpen,
  User,
  Briefcase,
  FileText,
  Plus,
  GraduationCap,
  Award,
  Link as LinkIcon,
  BadgeCheck,
  X,
  FileUp,
  Download,
  Bot, Sparkles
} from "lucide-react";

const ProfilePage = () => {
  const [showResumeModal, setShowResumeModal] = useState(false);
  const { user, loading, refreshUser } = useContext(Authcontext);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [pimg, setpimg] = useState(ProfilePlaceholder);
  
  // const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    dob: "",
    gender: "",
    adhar_number: "",
    phone_number: "",
    roll_number: "",
    course: "",
    branch: "",
    college_email: "",
    x_percentage: "",
    xii_diploma_percentage: "",
    backlogs: 0,
    cgpa: "",
    internships: [],
    projects: [],
    skills: [],
    certifications: [],
    resume_url: "", 
    resume_name: "", 
    github: "",
    portfolio: "",
    linkedin: "",
    // portfolio_slug: "",
  });

  


  

  const token = localStorage.getItem("token");
  const authConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );
  
  useEffect(() => {
    if (user) {
      setProfile({
        ...user,
        internships: user.internships || [],
        projects: user.projects || [],
        skills: user.skills || [],
        certifications: user.certifications || [],
        resume_url: user.resume_url || "",
        resume_name: user.resume_name || "",
        
      });
      // generateUniqueSlug(profile.full_name);
      if (user.profile_picture) {
        setpimg(user.profile_picture);
      }
    }
  }, [user]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleDynamicChange = (index, field, value, category) => {
    const updatedCategory = [...profile[category]];
    updatedCategory[index] = { ...updatedCategory[index], [field]: value };
    setProfile((prev) => ({ ...prev, [category]: updatedCategory }));
  };

  const addEntry = (category, template) => {
    setProfile((prev) => ({
      ...prev,
      [category]: [...prev[category], template],
    }));
  };

  const removeEntry = (index, category) => {
    const updatedCategory = profile[category].filter((_, i) => i !== index);
    setProfile((prev) => ({ ...prev, [category]: updatedCategory }));
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [...prev.skills, { skill_name: "", proficiency: "Beginner" }],
    }));
  };

  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      await api.post("/profile/upload-image", formData, {
        headers: {
          ...authConfig.headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setpimg(URL.createObjectURL(file));
      alert("Profile picture updated!");
      refreshUser();
    } catch (err) {
      alert("Image upload failed");
    }
  };

 
  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await api.post("/profile/upload-resume", formData, {
        headers: {
          ...authConfig.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Resume uploaded successfully!");
      
      refreshUser();
    } catch (err) {
      console.error("Upload error details:", err.response?.data);
      alert(
        `Resume upload failed: ${
          err.response?.data?.error || "Check server logs"
        }`
      );
    }
  };

  
  const handleSave = async () => {
    if (!isEditing) return setIsEditing(true);

    setIsSaving(true);
    try {
      const res = await api.post("/profile/save-all", profile, authConfig);

      if (res.status === 200) {
        alert(
          `Success! Portfolio link created: /portfolio/${profile.portfolio_slug}`
        );
        setIsEditing(false);
        refreshUser();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

 
  const handleDeleteProfile = async () => {
    if (
      window.confirm(
        "Warning! This will clear your entire professional profile. Continue?"
      )
    ) {
      try {
        await api.delete("/profile/clear-all", authConfig);
        refreshUser(); 
        window.location.reload();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };


  const [parsedData, setParsedData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    college_email: '',
    roll_number: '',
    dob:"",
    gender:'Male',
    phone_number: '',
    course: '',
    branch: '',
    x_percentage: 0,
    xii_diploma_percentage: 0,
    cgpa: 0,
    backlogs: 0,
    github: '',
    linkedin: '',
    portfolio: '',
    skills: [],
    projects: [],
    internships: [],
    certifications: []
  });
  
  // This function is triggered when AI parsing is successful
  const handleParsedData = (aiData) => {
    console.log("Data received from AI:", aiData);
  
    // Map AI data to form state, ensuring arrays are never null to avoid .map() errors
    const updatedData = {
      full_name: aiData.full_name || '',
      college_email: aiData.college_email || '',
      roll_number: aiData.roll_number || "22B61A0510",
      gender:'Male',
      phone_number: aiData.phone_number || '',
      course: aiData.course || '',
      branch: aiData.branch || '',
      x_percentage: aiData.x_percentage || 0,
      xii_diploma_percentage: aiData.xii_diploma_percentage || 0,
      cgpa: aiData.cgpa || 0,
      backlogs: aiData.backlogs || 0,
      github: aiData.github || '',
      linkedin: aiData.linkedin || '',
      portfolio: aiData.portfolio || '',
      skills: aiData.skills || [],
      projects: aiData.projects || [],
      internships: aiData.internships || [],
      certifications: aiData.certifications || [],
    };
  
    setFormData(updatedData);
    setParsedData(updatedData); // Keeping a reference of raw AI data if needed
    setShowModal(true); // Open the pop-up card for review
  };


  const checkProfileCompleteness = () => {
    const missing = [];
  
    // --- STRING & NUMERIC FIELDS ---
    if (!formData.full_name?.trim()) missing.push("Full Name");
    if (!formData.dob) missing.push("Date of Birth");
    if (!formData.gender) missing.push("Gender");
    if (!formData.adhar_number?.trim()) missing.push("Aadhar Number");
    if (!formData.phone_number?.trim()) missing.push("Phone Number");
    if (formData.roll_number?.trim()===0) missing.push("Roll Number");
    if (!formData.course?.trim()) missing.push("Course");
    if (!formData.branch?.trim()) missing.push("Branch");
    if (!formData.college_email?.trim()) missing.push("College Email");
    if (formData.x_percentage===0) missing.push("10th Percentage");
    if (formData.xii_diploma_percentage===0) missing.push("12th/Diploma Percentage");
    if (formData.cgpa === 0 ) missing.push("CGPA");
    
    // Note: backlogs is 0 by default, usually not "missing" unless you want to force a check
    if (formData.backlogs === 0 ) missing.push("Backlogs count");
  
    // --- SOCIAL & LINKS ---
    if (!formData.github?.trim()) missing.push("GitHub Link");
    if (!formData.linkedin?.trim()) missing.push("LinkedIn Profile");
    if (!formData.portfolio?.trim()) missing.push("Portfolio URL");
  
    // --- ARRAYS (Lists) ---
    if (formData.internships?.length === 0) missing.push("Internship Details");
    if (formData.projects?.length === 0) missing.push("Projects");
    if (formData.skills?.length === 0) missing.push("Skills");
    if (formData.certifications?.length === 0) missing.push("Certifications");
  
    // --- RESUME UPLOAD STATUS ---
    if (!formData.resume_url) missing.push("Resume File (Upload failed/missing)");
  
    return missing;
};

const handleValidationAlert = async () => {
  const emptyFields = checkProfileCompleteness();

  if (emptyFields.length > 0) {
    const message = `Resume uploaded, but the following fields remain empty:\n\n` + 
                    emptyFields.map(f => `❌ ${f}`).join("\n") + 
                    `\n\nPlease update these manually. An email reminder has been sent.`;
    
    alert(message);

    try {
      // DATA is the 2nd argument, CONFIG (headers) is the 3rd
      await api.post("/profile/send-reminder", 
        {
          email: profile.college_email,
          full_name: profile.full_name,
          missingFields: emptyFields 
        }, 
        authConfig 
      );
      console.log("Email notification sent successfully.");
    } catch (err) {
      console.error("Failed to send reminder email:", err.response?.data || err.message);
    }

    return false;
  }
  return true;
};
  const handleFinalSave = async (verifiedData) => {
    try {
      console.log("Verified data to save: ", verifiedData);
      // const token = localStorage.getItem('token');
      // Send the VERIFIED data to your backend save-all route
      const a=  await api.post("/profile/save-all", verifiedData, authConfig);
      console.log("Save response:",a);
      // alert("Profile verified and saved successfully!");
      setShowModal(false); 
      // Close the modal
      handleValidationAlert();
      refreshUser();
    } catch (err) {
      alert("Error saving data: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-500 text-white font-bold tracking-widest animate-pulse">
        SYNCHRONIZING DATABASE...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-700 py-10 px-4 md:px-16 font-sans text-slate-200">
      <div className="max-w-8xl mx-auto space-y-10">
        
        <div className="bg-slate-600 rounded-[3rem] p-10 border border-slate-400 shadow-2xl flex flex-col
         md:flex-col lg:flex-row items-center gap-10 ">
          <div className="relative group">
            <img
              src={pimg}
              className="w-60 h-60 rounded-[2.5rem] object-cover border-4 border-slate-700 shadow-2xl group-hover:opacity-80 transition-opacity"
              alt="Profile"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-slate-800 rounded-2xl border-4 border-slate-600 hover:scale-110 transition-all shadow-xl"
            >
              <Camera size={24} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="flex-1 flex flex-col gap-10 md:gap-5 lg:gap-1 text-center lg:text-left">
            <h1 className="text-5xl h-16  font-black tracking-normal text-white ">
              {profile.full_name || "STUDENT NAME"}.
            </h1>
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <span className=" px-7 py-4 rounded-full text-xs md:text-md lg:text-lg font-bold text-slate-300 border border-slate-500 uppercase">
                {profile.branch || "BRANCH"}
              </span>
              <span className=" px-7 py-4 rounded-full text-xs md:text-md lg:text-lg font-bold text-slate-300 border border-slate-500 uppercase">
                ROLL: {profile.roll_number || "N/A"}
              </span>
            </div>
            {profile.portfolio_slug && (
              <div className=" p-4 rounded-xl border border-slate-500 mt-6 w-96">
                <p className="text-xs md:text-md lg:text-lg  text-indigo-300 font-bold uppercase">
                  Your Public Portfolio Link
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    id="pt"
                    readOnly
                    value={`${window.location.origin}/portfolio/${profile.portfolio_slug}`}
                    className="bg-black/40 flex-1 p-2 rounded text-sm text-white"
                  />
                  <button onClick={()=>handleCopy(document.getElementById('pt').value)} className="bg-indigo-600 px-4 py-2 rounded text-sm">
                    Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-5 py-4 rounded-2xl font-black text-sm md:text-md lg:text-lg 
              shadow-xl transition-all ${
                isEditing
                  ? "bg-slate-100 text-slate-950 scale-105"
                  : "bg-white text-slate-900 hover:bg-slate-200"
              }`}
            >
              {isSaving ? (
                "SAVING..."
              ) : isEditing ? (
                <div className="flex items-center justify-center gap-2">
                  <Save /> CONFIRM
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserEdit /> EDIT DATA
                </div>
              )}
            </button>
            {!isEditing && (
              <button
                onClick={handleDeleteProfile}
                className="text-black font-bold bg-slate-200 px-5 py-4 rounded-2xl text-sm md:text-md lg:text-lg shadow-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={25} />
                CLEAR DATA
              </button>
            )}
          </div>
        </div>
         
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8">
        <Section className=" rounded-[2.5rem]" title="Quick Fill" icon={<Sparkles color="blue"/>}>
         {/* <h2 className="text-sm font-black uppercase tracking-tighter mb-4 text-slate-400"></h2> */}
         <ResumeUpload onDataParsed={handleParsedData} />
        
         </Section>
      
          <Section title="Identity & Contact" icon={<User />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                name="full_name"
                value={profile.full_name}
                editing={isEditing}
                onChange={handleChange}
              />
              <Select
                label="Gender"
                name="gender"
                value={profile.gender}
                editing={isEditing}
                onChange={handleChange}
                options={["Male", "Female","Other"]}
              />

              <Input
                label="DOB"
                name="dob"
                type="date"
                value={profile.dob}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Aadhar"
                name="adhar_number"
                value={profile.adhar_number}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Phone"
                name="phone_number"
                value={profile.phone_number}
                editing={isEditing}
                onChange={handleChange}
              />
            </div>
          </Section>

         
          <Section title="Education Details" icon={<GraduationCap />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select
                label="Course"
                name="course"
                value={profile.course}
                editing={isEditing}
                onChange={handleChange}
                options={["B.Tech"]}
              />

              
              <Select
                label="Branch"
                name="branch"
                value={profile.branch}
                editing={isEditing}
                onChange={handleChange}
                options={["CSE", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"]}
              />
              <Input
                label="Roll Number"
                name="roll_number"
                value={profile.roll_number}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="college_email"
                value={profile.college_email}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="10th %"
                name="x_percentage"
                value={profile.x_percentage}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="12th %"
                name="xii_diploma_percentage"
                value={profile.xii_diploma_percentage}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Current CGPA"
                name="cgpa"
                value={profile.cgpa}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Backlogs"
                name="backlogs"
                type="number"
                value={profile.backlogs}
                editing={isEditing}
                onChange={handleChange}
              />
            </div>
          </Section>

          
          <Section
            title="Internships"
            icon={<Briefcase />}
            isArray
            onAdd={() =>
              addEntry("internships", {
                company_name: "",
                role: "",
                duration: "",
                description: "",
              })
            }
            editing={isEditing}
          >
            {profile.internships.length === 0 && (
              <p className="text-slate-300 italic">No internships added yet.</p>
            )}
            {profile.internships.map((item, index) => (
              <div
                key={index}
                className="p-5 bg-slate-700/50 rounded-2xl mb-4 border border-slate-500 relative group/item"
              >
                {isEditing && (
                  <button
                    onClick={() => removeEntry(index, "internships")}
                    className="absolute top-4 right-4 text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <X size={18} />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Company"
                    value={item.company_name}
                    editing={isEditing}
                    onChange={(e) =>
                      handleDynamicChange(
                        index,
                        "company_name",
                        e.target.value,
                        "internships"
                      )
                    }
                  />
                  <Input
                    label="Role"
                    value={item.role}
                    editing={isEditing}
                    onChange={(e) =>
                      handleDynamicChange(
                        index,
                        "role",
                        e.target.value,
                        "internships"
                      )
                    }
                  />
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Description
                    </label>
                    <textarea
                      disabled={!isEditing}
                      value={item.description}
                      onChange={(e) =>
                        handleDynamicChange(
                          index,
                          "description",
                          e.target.value,
                          "internships"
                        )
                      }
                      className="w-full bg-slate-800 rounded-xl p-3 border border-slate-600 mt-1 h-20 outline-none text-sm md:text-md lg:text-lg text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Section>

         
          <Section
            title="Projects"
            icon={<FileText />}
            isArray
            onAdd={() =>
              addEntry("projects", {
                title: "",
                description: "",
                tech_stack: "",
                project_link: "",
              })
            }
            editing={isEditing}
          >
            {profile.projects.length === 0 && (
              <p className="text-slate-300 italic">No projects added yet.</p>
            )}
            {profile.projects.map((item, index) => (
              <div
                key={index}
                className="p-5 bg-slate-700/50 rounded-2xl mb-4 border border-slate-500 relative group/item"
              >
                {isEditing && (
                  <button
                    onClick={() => removeEntry(index, "projects")}
                    className="absolute top-4 right-4 text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                  >
                    <X size={20} />
                  </button>
                )}
                <Input
                  label="Project Title"
                  value={item.title}
                  editing={isEditing}
                  onChange={(e) =>
                    handleDynamicChange(
                      index,
                      "title",
                      e.target.value,
                      "projects"
                    )
                  }
                />
                <Input
                  label="Tech Stack"
                  value={Array.isArray(item.tech_stack) 
                    ? item.tech_stack.join(", ") 
                    : (item.tech_stack || "").toString().replace(/{|}/g, "")}
                  editing={isEditing}
                  onChange={(e) =>
                    handleDynamicChange(
                      index,
                      "tech_stack",
                      e.target.value,
                      "projects"
                    )
                  }
                />
                <Input
                  label="Link"
                  value={item.project_link}
                  editing={isEditing}
                  onChange={(e) =>
                    handleDynamicChange(
                      index,
                      "project_link",
                      e.target.value,
                      "projects"
                    )
                  }
                  icon={<LinkIcon size={20} />}
                />
                <textarea
                  placeholder="Description..."
                  disabled={!isEditing}
                  value={item.description}
                  onChange={(e) =>
                    handleDynamicChange(
                      index,
                      "description",
                      e.target.value,
                      "projects"
                    )
                  }
                  className="w-full bg-slate-800 rounded-xl p-3 border border-slate-600 mt-2 h-20 outline-none text-sm md:text-md lg:text-lg text-white"
                />
              </div>
            ))}
          </Section>

          
          <Section
            title="Certifications"
            icon={<Award />}
            isArray
            onAdd={() =>
              addEntry("certifications", {
                title: "",
                issuing_organization: "",
                issue_date: "",
                credential_url: "",
              })
            }
            editing={isEditing}
          >
            {profile.certifications.length === 0 && (
              <p className="text-slate-300 italic">
                No certifications added yet.
              </p>
            )}

            {profile.certifications.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-slate-800/50 rounded-2xl mb-3 border border-slate-600 flex justify-between items-center relative group/cert"
              >
                <div className="flex-1">
                  <Input
                    label="Certificate Name"
                    value={item.title}
                    editing={isEditing}
                    onChange={(e) =>
                      handleDynamicChange(
                        index,
                        "title",
                        e.target.value,
                        "certifications"
                      )
                    }
                  />
                  {isEditing && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Input
                        label="Organization"
                        value={item.issuing_organization}
                        editing={isEditing}
                        onChange={(e) =>
                          handleDynamicChange(
                            index,
                            "issuing_organization",
                            e.target.value,
                            "certifications"
                          )
                        }
                      />
                      <Input
                        label="Issue Date"
                        type="date"
                        value={item.issue_date}
                        editing={isEditing}
                        onChange={(e) =>
                          handleDynamicChange(
                            index,
                            "issue_date",
                            e.target.value,
                            "certifications"
                          )
                        }
                      />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeEntry(index, "certifications")}
                    className="ml-4 text-red-500"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            ))}
          </Section>

         
          <Section title="Skillset" icon={<BadgeCheck />}>
            <div className="flex flex-wrap gap-3 ">
              {profile.skills.length === 0 && (
                <p className="text-slate-300 italic">No skills added yet.</p>
              )}

              {profile.skills.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-around w-full bg-slate-800 border border-slate-500 rounded-2xl px-2 py-5 shadow-inner transition-all"
                >
                  {isEditing ? (
                    <div className="flex items-center justify-around w-full gap-2">
                      <input
                        type="text"
                        placeholder="Skill Name"
                        value={s.skill_name || ""}
                        onChange={(e) =>
                          handleDynamicChange(
                            i,
                            "skill_name",
                            e.target.value,
                            "skills"
                          )
                        }
                        className="bg-slate-700 text-white text-sm font-bold rounded-lg px-2 py-4 outline-none border border-slate-600 w-1/2"
                      />
                      <select
                        value={s.proficiency || "Beginner"}
                        onChange={(e) =>
                          handleDynamicChange(
                            i,
                            "proficiency",
                            e.target.value,
                            "skills"
                          )
                        }
                        className="bg-slate-700 text-indigo-400 text-xs font-black rounded-lg px-2 py-4 outline-none border border-slate-600"
                      >
                        <option value="Beginner">BEGINNER</option>
                        <option value="Intermediate">INTERMEDIATE</option>
                        <option value="Advanced">ADVANCED</option>
                        <option value="Expert">EXPERT</option>
                      </select>
                      <button
                        onClick={() => removeEntry(i, "skills")}
                        className="text-red-400 px-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-row  items-center  gap-20 px-3">
                      <span className="text-sm md:text-md lg:text-lg font-black text-white  uppercase">
                        {s.skill_name || "Untitled Skill"}
                      </span>
                      <span className="text-sm md:text-md lg:text-lg bg-slate-500/20 text-slate-400 px-2 py-2 rounded-lg font-black border border-slate-500/30">
                        {s.proficiency}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {isEditing && (
                <button
                  onClick={addSkill}
                  className="border-2 border-dashed border-slate-500 bg-slate-600 rounded-2xl px-5 py-3 text-xs md:text-md lg:text-lg font-black text-slate-400 hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> ADD SKILL
                </button>
              )}
            </div>
          </Section>
          <Section title="Social Identity" icon={<Globe />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Linked in"
                name="linkedin"
                value={profile.linkedin}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="Git Hub"
                name="github"
                value={profile.github}
                editing={isEditing}
                onChange={handleChange}
              />
              <Input
                label="portfolio"
                name="portfolio"
                value={profile.portfolio}
                editing={isEditing}
                onChange={handleChange}
              />
              
            </div>
          </Section>
          
          
        </div>
        <div className="lg:col-span-2">
            <Section title="Career Resume" icon={<FileText />}>
              <div
                className={`w-full border-4 border-dashed rounded-[2rem] p-10 transition-all flex flex-col items-center justify-center gap-4 ${
                  isEditing
                    ? "border-indigo-400 bg-slate-700/30"
                    : "border-slate-500 bg-slate-800/20"
                }`}
              >
                {profile.resume_url ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-5 bg-indigo-500/20 rounded-full text-indigo-400">
                      <FileText size={48} />
                    </div>
                    <p className="text-xl font-black text-white">
                      {profile.resume_name || "resume.pdf"}
                    </p>
                    <div className="flex gap-4">
                      
                      <button
                        onClick={() => setShowResumeModal(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-slate-700 rounded-xl font-bold text-sm hover:bg-slate-600 transition-all"
                      >
                        <Download size={18} /> VIEW PREVIEW
                      </button>

                      {isEditing && (
                        <button
                          onClick={() => resumeInputRef.current.click()}
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-500"
                        >
                          <FileUp size={18} /> REPLACE
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="p-5 bg-slate-700/50 rounded-full text-slate-400 inline-block mb-4">
                      <FileUp size={48} />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                      No Resume Uploaded
                    </p>
                    {isEditing && (
                      <button
                        onClick={() => resumeInputRef.current.click()}
                        className="mt-4 px-10 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all shadow-lg"
                      >
                        UPLOAD RESUME
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={resumeInputRef}
                  className="hidden"
                  accept=".pdf"
                  onChange={handleResumeChange}
                />
              </div>
            </Section>
          </div>
      </div>
      {showModal && (
  <ProfilePreviewModal 
    aiData={formData} 
    onSave={handleFinalSave} 
    onClose={() => setShowModal(false)} 
  />
   )}
      {showResumeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm p-4 md:p-10">
          <div className="bg-slate-800 w-full max-w-5xl h-full rounded-[2.5rem] border border-slate-500 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 bg-slate-700 border-b border-slate-600 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-widest">
                  Document Preview: {profile.resume_name}
                </h3>
              </div>
              <button
                onClick={() => setShowResumeModal(false)}
                className="p-2 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-full transition-all"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 bg-slate-900 relative">
              <iframe
                src={`${profile.resume_url}#toolbar=0`}
                className="w-full h-full border-none"
                title="Resume Viewer"
              />
            </div>
            <div className="p-6 bg-slate-700 flex justify-center gap-4">
              <a
                href={profile.resume_url}
                download
                className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <Download size={20} /> DOWNLOAD
              </a>
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-10 py-3 bg-slate-600 text-white font-black rounded-xl hover:bg-slate-500 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

const Section = ({ title, icon, children, isArray, onAdd, editing }) => (
<div>
  <div className="  flex items-center gap-3 m-5 ">
        <div className="p-2 bg-slate-800 text-white rounded-xl shadow-lg ">
          {icon}
        </div>
        <h2 className=" text-sm md:text-md lg:text-xl font-black uppercase tracking-widest text-slate-100">
          {title}
        </h2>
      </div>
  <div className="bg-slate-600/40 h-[400px] overflow-y-auto backdrop-blur-xl rounded-2xl border border-slate-400 shadow-xl flex flex-col hover:border-slate-300 transition-colors
  /* 1. Set the width of the scrollbar */
  [&::-webkit-scrollbar]:w-2
  
  /* 2. Style the track (background) - keeping it transparent to show backdrop-blur */
  [&::-webkit-scrollbar-track]:bg-transparent
  
  /* 3. Style the thumb (draggable part) */
  [&::-webkit-scrollbar-thumb]:bg-slate-500/50
  [&::-webkit-scrollbar-thumb]:rounded-full
  
  /* 4. Thumb hover effect */
  hover:[&::-webkit-scrollbar-thumb]:bg-slate-400
  
  /* 5. Firefox support (Standard properties) */
  [scrollbar-width:thin]
  [scrollbar-color:theme(colors.slate.500/50%)_transparent]">
    <div className="bg-slate-700/80 px-8 py-5 flex items-center justify-between border-b border-slate-500">
      
      {isArray && editing && (
        <button
          onClick={onAdd}
          className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all hover:rotate-90"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
    <div className="p-8 flex-1">{children}</div>
  </div></div>
);

const Input = ({
  label,
  name,
  value,
  editing,
  onChange,
  type = "text",
  icon,
}) => (
  <div className="flex flex-col gap-1.5 mb-2">
    <label className="text-sm md:text-md lg:text-lg md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
      {label}
    </label>
    {editing ? (
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          value={
            type === "date" ? (value ? value.split("T")[0] : "") : value || ""
          }
          onChange={onChange}
          className={`w-full bg-slate-700 border border-slate-500 rounded-xl py-3 text-sm md:text-md lg:text-lg text-white outline-none focus:border-white transition-all ${
            icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    ) : (
      <div className="bg-slate-800/40 px-4 py-3 rounded-xl text-slate-100 font-bold flex items-center gap-2 border border-transparent truncate text-sm md:text-md lg:text-lg">
        {icon && <span className="text-slate-500">{icon}</span>}
        {value || "—"}
      </div>
    )}
  </div>
);
const Select = ({ label, name, value, editing, onChange, options }) => (
  <div className="flex flex-col gap-1.5 mb-2">
    <label className="text-sm md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-widest pl-1">
      {label}
    </label>
    {editing ? (
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full bg-slate-700 border border-slate-500 rounded-xl py-3 px-4 text-sm md:text-md lg:text-lg text-white outline-none focus:border-white transition-all appearance-none cursor-pointer"
      >
        <option value="" disabled hidden selected>
          Select {label}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-800">
            {opt}
          </option>
        ))}
      </select>
    ) : (
      <div className="bg-slate-800/40 px-4 py-3 rounded-xl text-slate-100 font-bold text-sm md:text-md lg:text-lg truncate">
        {value || "—"}
      </div>
    )}
  </div>
);
  



export default ProfilePage;
