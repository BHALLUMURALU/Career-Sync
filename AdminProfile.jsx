import React, { useState, useEffect, useRef,useContext } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, Camera, Save, 
  ShieldCheck, Loader2, CheckCircle, RefreshCcw, Image as ImageIcon 
} from 'lucide-react';
import api from "../../utils/api";
import { Authcontext } from '../../context/Authcontext';
const AdminProfile = () => {
  const { user, loading, refreshUser, logout } = useContext(Authcontext);
 
  const [profile, setProfile] = useState({
    name: "",
    college_email: "",
    alternate_email: "",
    designation: "",
    college_location: "",
    phone_number: "",
    profile_picture: "", 
    email_sync_enabled: false,
    managed_branches: []
  });
  const token = localStorage.getItem('token');
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 
  const [isloading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);

  
  useEffect(() => {
    const updatedProfile = { ...user };
    
 
    console.log(updatedProfile);
    setProfile(updatedProfile);
  }, [user]);

 
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
     
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("alternate_email", profile.alternate_email);
      formData.append("designation", profile.designation);
      formData.append("college_email",profile.college_email);
      formData.append("college_location", profile.college_location);
      formData.append("phone_number", profile.phone_number);
      formData.append("email_sync_enabled", profile.email_sync_enabled);
      console.log(profile);
      if (imageFile) {
        
        formData.append("profile_picture", imageFile);
      }

      const res = await api.put("/admin/profile/update", formData, {
        headers: {
          Authorization : `Bearer ${token}`,
          "Content-Type": "multipart/form-data" }
      });

      setProfile(res.data.updatedProfile);
      setImageFile(null); 
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Update Error:", err);
      alert("Failed to update profile. Check server logs.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-400">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-700 rounded-4xl p-4 md:p-10 lg:p-12">
      <div className="w-full mx-auto">
        
        {/* Profile Header */}
        <div className="flex flex-col border-l-8 p-6 border-t border-b border-r border-slate-400 bg-slate-600 rounded-2xl md:flex-row items-center gap-8 mb-10">
          <div className="relative group ">
            <div className="w-32 h-32 rounded-[2rem] bg-slate-600 overflow-hidden shadow-2xl transition-transform group-hover:scale-105 border-4 border-white">
              {imagePreview || profile.profile_picture ? (
                <img 
                  src={imagePreview || profile.profile_picture} 
                  alt="Admin" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 text-4xl font-black">
                  {profile.name?.charAt(0) || "A"}
                </div>
              )}
            </div>
            
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*" 
            />
            
            <button 
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Camera size={20} />
            </button>
          </div>
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-900">{profile.name || "Administrator"}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1">
                <ShieldCheck size={14} /> {profile.designation || "TPO Official"}
              </span>
              <span className="text-slate-200 text-sm font-medium italic">
                Last updated: {user? user.updated_at :new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
         
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-600 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <User size={20} className="text-slate-200" /> Account Identity
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Full Name" name="name" value={profile.name} onChange={handleInputChange} icon={<User size={18}/>} />
                <InputGroup label="Exact Designation" name="designation" value={profile.designation} onChange={handleInputChange} icon={<Briefcase size={18}/>} />
                <InputGroup label="Official Email" name="college_email" value={profile.college_email} onChange={handleInputChange} icon={<Mail size={18}/>}  />
                <InputGroup label="Personal Email" name="alternate_email" value={profile.alternate_email} onChange={handleInputChange} icon={<Mail size={18}/>} />
                <InputGroup label="Mobile Number" name="phone_number" value={profile.phone_number} onChange={handleInputChange} icon={<Phone size={18}/>} />
                <InputGroup label="Office Location" name="college_location" value={profile.college_location} onChange={handleInputChange} icon={<MapPin size={18}/>} />
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            <div className="bg-slate-600 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-200 mb-6">Configuration</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-400 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700 text-sm">Email Sync</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Automate Job Alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="email_sync_enabled"
                      checked={profile.email_sync_enabled}
                      onChange={handleInputChange}
                      className="sr-only peer  "
                    />
                    <div className="w-11 h-6 bg-slate-500  peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                  </label>
                </div>

                <div className="p-4 bg-slate-600 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-600 uppercase mb-3">Assigned Departments</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.managed_branches?.length > 0 ? profile.managed_branches.map((b, i) => (
                      <span key={i} className="px-3 py-1 bg-white text-slate-600 rounded-lg text-[10px] font-black border border-indigo-200 shadow-sm">
                        {b}
                      </span>
                    )) : <span className="text-xs text-slate-400 italic">No branches assigned</span>}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                  {updating ? <Loader2 className="animate-spin" size={20} /> : (success ? <CheckCircle size={20} /> : <Save size={20} />)}
                  {updating ? "Processing..." : (success ? "Profile Updated!" : "Save Changes")}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};


const InputGroup = ({ label, icon, disabled, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
        {icon}
      </div>
      <input 
        className={`w-full pl-12 pr-4 py-3.5 rounded-2xl outline-none border transition-all font-semibold text-slate-700
          ${disabled 
            ? 'bg-slate-400 border-slate-200 cursor-not-allowed text-slate-400' 
            : 'bg-slate-400 border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          }`}
        disabled={disabled}
        {...props}
      />
    </div>
  </div>
);

export default AdminProfile;