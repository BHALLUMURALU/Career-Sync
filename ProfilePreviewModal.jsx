import React, { useState } from 'react';
import { X, Save, Briefcase, Code, Award, Globe, Trash2, ChevronDown, Phone, Mail, User } from 'lucide-react';

const ProfilePreviewModal = ({ aiData, onSave, onClose }) => {
  const [formData, setFormData] = useState(aiData);


  const courseData = {
    "B.Tech": ["CSE", "AI&DS", "ECE", "EEE", "MECH", "CIVIL"],
    "B.C.A": ["Computer Applications"],
    "M.C.A": ["Computer Applications"],
    "B.B.A": ["Business Administration"],
    "M.B.A": ["Business Administration"],
    "M.Tech": ["Computer Science"],
    "Diploma-CSE(VCS)": ["Computer Science"],
    "Diploma-ECE(VMC)": ["Mobile Communication"],
    "Diploma-ME(VAS)": ["Automobile Servicing"]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "course") {
      setFormData({ ...formData, [name]: value, branch: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNestedChange = (index, field, value, category) => {
    const updatedCategory = [...formData[category]];
  
   
    if (field === 'tech_stack') {
   
  
      updatedCategory[index][field] = typeof value === 'string' ? value.split(',') : value;
    } else {
      updatedCategory[index][field] = value;
    }
  
    setFormData({ ...formData, [category]: updatedCategory });
  };

  const removeArrayItem = (index, category) => {
    const updated = formData[category].filter((_, i) => i !== index);
    setFormData({ ...formData, [category]: updated });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-700 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border-4 border-slate-900">
        
       
        <div className="p-6 border-b-4 border-slate-900 bg-slate-800 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-pink-600 tracking-tighter uppercase italic flex items-center gap-3">
              <span className="bg-black text-pink-600 px-2 not-italic">AI</span> Profile Audit
            </h2>
            <p className="text-slate-300 text-[13px] font-black uppercase tracking-[0.2em] mt-1">Verify extracted data structures</p>
          </div>
          <button 
            onClick={onClose} 
            className="group p-2 rounded-full border-2 border-slate-200 hover:border-pink-600 hover:bg-black transition-all"
          >
            <X size={20} className="group-hover:text-pink-600 text-slate-400" />
          </button>
        </div>

       
        <div className="p-8 overflow-y-auto space-y-16 bg-slate-700 scrollbar-thin scrollbar-thumb-slate-300 text-slate-300">
          
        
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">01 . Identity & Education</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <div className="flex items-center gap-2 bg-slate-500 rounded-xl p-3 border-b-2 border-slate-200">
                  <User size={16} className="text-slate-900"/>
                  <input name="full_name" value={formData.full_name || ''} onChange={handleChange} className="w-full bg-transparent outline-none font-black text-slate-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date Of Birth</label>
                <div className="flex items-center gap-2 bg-slate-500 rounded-xl p-3 border-b-2 border-slate-200">
                  <User size={16} className="text-slate-900"/>
                  <input name="full_dob" value={formData.dob || ''} onChange={handleChange} className="w-full bg-transparent outline-none font-black text-slate-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone</label>
                <div className="flex items-center gap-2 bg-slate-500 rounded-xl p-3 border-b-2 border-slate-200">
                  <Phone size={16} className="text-slate-900"/>
                  <input name="phone_number" value={formData.phone_number || ''} onChange={handleChange} className="w-full bg-transparent outline-none font-black text-slate-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email</label>
                <div className="flex items-center gap-2 bg-slate-500 rounded-xl p-3 border-b-2 border-slate-200">
                  <Mail size={16} className="text-slate-900"/>
                  <input name="college_email" value={formData.college_email || ''} onChange={handleChange} className="w-full bg-transparent outline-none font-black text-slate-900" placeholder="Not extracted" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Course</label>
                <div className="relative bg-slate-500 rounded-xl border-b-2 border-slate-200 p-3">
                  <select name="course" value={formData.course || ''} onChange={handleChange} className="w-full bg-transparent outline-none font-black text-slate-900 appearance-none cursor-pointer">
                    <option value="" selected hidden disabled>Select Course</option>
                    {Object.keys(courseData).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Branch</label>
                <div className="relative bg-slate-500 rounded-xl border-b-2 border-slate-200 p-3">
                  <select 
                    name="branch" 
                    value={formData.branch || ''} 
                    onChange={handleChange} 
                    disabled={!formData.course}
                    className="w-full bg-transparent outline-none font-black text-slate-900 appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="" selected hidden disabled>{formData.course ? "Select Branch" : "Select Course First"}</option>
                    {formData.course && courseData[formData.course].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-900" />
                </div>
              </div>
            </div>
          </section>

         
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">02 . Performance Metrics</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-slate-500 rounded-xl overflow-hidden">
              {[
                { label: 'CGPA', name: 'cgpa' },
                { label: '10th %', name: 'x_percentage' },
                { label: '12th/Dip %', name: 'xii_diploma_percentage' },
                { label: 'Backlogs', name: 'backlogs' }
              ].map((metric, idx) => (
                <div key={idx} className="p-6 border-r last:border-r-0 border-slate-500 flex flex-col items-center bg-slate-600 hover:bg-slate-500 transition-colors">
                  <label className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">{metric.label}</label>
                  <input 
                    name={metric.name} 
                    value={formData[metric.name] ?? ''} 
                    onChange={handleChange} 
                    className="w-full bg-transparent text-center text-3xl font-black text-pink-600 outline-none placeholder-slate-400" 
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </section>

        
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">03 . Technical Stack</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, idx) => (
                <div key={idx} className="group flex items-center border-2 border-slate-900 bg-slate-500 px-4 py-2 hover:bg-pink-600 transition-all rounded-xl">
                  <span className="text-sm font-black uppercase tracking-tighter text-slate-900 group-hover:text-white">{skill.skill_name}</span>
                  <button onClick={() => removeArrayItem(idx, 'skills')} className="ml-4 text-slate-800 hover:text-white transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
          </section>

     
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">04 . Featured Projects</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.projects?.map((proj, idx) => (
                <div key={idx} className="p-6 border-2 border-l-8 border-slate-500 hover:border-pink-600 transition-all relative rounded-2xl bg-slate-600">
                  <button onClick={() => removeArrayItem(idx, 'projects')} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-pink-600"><Trash2 size={18}/></button>
                  <div className="space-y-4">
                    <input 
                       value={proj.title || ''} 
                       onChange={(e) => handleNestedChange(idx, 'title', e.target.value, 'projects')} 
                       className="w-full text-lg font-black uppercase tracking-tighter outline-none border-b-2 border-slate-400 focus:border-pink-600 pb-1 bg-transparent text-white" 
                       placeholder="TITLE" 
                    />
                   <input 
  value={Array.isArray(proj.tech_stack) ? proj.tech_stack.join(",") : (proj.tech_stack || '')} 
  onChange={(e) => {
    const val = e.target.value;
  
    // handleNestedChange(idx, 'tech_stack', val.split(','), 'projects')
    
    
    handleNestedChange(idx, 'tech_stack', val, 'projects')
  }} 
  className="w-full text-lg tracking-tighter outline-none border-b-2 border-slate-400 focus:border-pink-600 pb-1 bg-transparent text-white" 
  placeholder="TECH STACK (comma separated)" 
/>
                    <textarea 
                       value={proj.description || ''} 
                       onChange={(e) => handleNestedChange(idx, 'description', e.target.value, 'projects')} 
                       className="w-full text-sm text-slate-300 font-bold bg-slate-500 p-4 h-24 outline-none resize-none rounded-xl" 
                       placeholder="Description" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

      
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">05 . Internships</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            <div className="space-y-4">
              {formData.internships?.map((exp, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-600 rounded-2xl border-l-4 border-pink-600">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Organization</label>
                    <input value={exp.company || ''} onChange={(e) => handleNestedChange(idx, 'company', e.target.value, 'internships')} className="w-full bg-transparent text-white font-black uppercase border-b border-slate-500 outline-none focus:border-pink-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Role</label>
                    <input value={exp.role || ''} onChange={(e) => handleNestedChange(idx, 'role', e.target.value, 'internships')} className="w-full bg-transparent text-white font-black uppercase border-b border-slate-500 outline-none focus:border-pink-600" />
                  </div>
                  <div className="space-y-1 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Duration</label>
                      <input value={exp.duration || ''} onChange={(e) => handleNestedChange(idx, 'duration', e.target.value, 'internships')} className="w-full bg-transparent text-white font-black uppercase border-b border-slate-500 outline-none focus:border-pink-600" />
                    </div>
                    <button onClick={() => removeArrayItem(idx, 'internships')} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

     
          <section className="space-y-8 pb-10">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase tracking-tighter text-lg px-3 py-1">06 . Certifications</h3>
              <div className="h-[2px] flex-1 bg-slate-500"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.certifications?.map((cert, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-500">
                  <div className="flex items-center gap-3">
                    <Award className="text-pink-600" size={20} />
                    <div>
                      <input 
                        value={cert.title || ''} 
                        onChange={(e) => handleNestedChange(idx, 'title', e.target.value, 'certifications')}
                        className="bg-transparent font-bold text-white text-sm outline-none border-b border-transparent focus:border-pink-600"
                      />
                      <p className="text-[10px] text-slate-400 uppercase font-black">{cert.issuing_organization || 'Unknown Org'}</p>
                    </div>
                  </div>
                  <button onClick={() => removeArrayItem(idx, 'certifications')} className="text-slate-500 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-8 border-t-4 border-slate-900 bg-slate-800 flex justify-end items-center gap-10">
          <button onClick={onClose} className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] hover:text-white transition-all">Discard Changes</button>
          <button 
            onClick={() => onSave(formData)} 
            className="flex items-center gap-4 px-16 py-6 bg-pink-600 text-black rounded-2xl hover:bg-pink-700 font-black uppercase tracking-[0.3em] transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <Save size={18}/> Commit & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;
