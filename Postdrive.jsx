import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Eye, Trash2, Loader2, Briefcase, TrendingUp, X, Mail, MousePointer2, MapPin, Calendar, Award, Users, ArrowLeft, GraduationCap } from 'lucide-react';
import { Usedrives } from './Usedrives';
import api from "../../utils/api";

const Postdrive = ({ year = 2026 }) => {
  const { filteredDrives, loading, stats, searchQuery, setSearchQuery, deleteDrive, refresh } = Usedrives(year);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingDrive, setViewingDrive] = useState(null);
  const [viewingApplicantsDrive, setViewingApplicantsDrive] = useState(null); 
  const [activeTab, setActiveTab] = useState('overall'); 

  const getTabFilteredDrives = () => {
    if (activeTab === 'typical') return filteredDrives.filter(d => d.post_type === 'manual');
    if (activeTab === 'automated') return filteredDrives.filter(d => d.post_type === 'automation');
    return filteredDrives;
  };

  const finalDrives = getTabFilteredDrives();

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the drive for "${name}"? This will remove all associated roles and eligibility data.`)) {
      try {
        await deleteDrive(id);
        refresh();
      } catch (err) {
        alert("Failed to delete drive");
      }
    }
  };

  // Switch to Applicants View if a drive is selected for viewing applicants
  if (viewingApplicantsDrive) {
    return (
      <DriveApplicants 
        drive={viewingApplicantsDrive} 
        onBack={() => setViewingApplicantsDrive(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-700 rounded-4xl p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Placement Management</h1>
          <p className="text-slate-200 mt-1 font-medium">Manage and track recruitment cycles for the {year} batch.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 border-4 border-slate-300 rounded-2xl font-bold transition-all shadow active:scale-95"
        >
          <Plus size={22} /> Create New Drive
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total Companies" value={stats.total} icon={<Briefcase size={22}/>} color="text-slate-900" bgColor="bg-blue-100" />
        <StatCard label="Live Drives" value={stats.live} icon={<TrendingUp size={22}/>} color="text-slate-900" bgColor="bg-green-100" />
        <StatCard label="Avg. CTC" value={`₹${stats.avgPackage|| '0'} LPA`} icon={<Award size={22}/>} color="text-slate-900" bgColor="bg-purple-100" />
      </div>

      <div className="bg-slate-600 p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2 bg-slate-600 p-2 rounded-2xl w-fit border border-slate-400/30">
          <TabButton active={activeTab === 'overall'} onClick={() => setActiveTab('overall')} label="Overall Posts" icon={<Filter size={16}/>} />
          <TabButton active={activeTab === 'typical'} onClick={() => setActiveTab('typical')} label="Typical Posts" icon={<MousePointer2 size={16}/>} />
          <TabButton active={activeTab === 'automated'} onClick={() => setActiveTab('automated')} label="Automated Posts" icon={<Mail size={16}/>} />
        </div>
        
        <div className="relative w-full md:w-3/6 lg:3/6 ">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Company or Job Role..." 
            className="w-full pl-15 pr-4 py-3 bg-slate-600 border text-sm md:text-md lg:text-xl placeholder:text-sm placeholder:md:text-md placeholder:lg:text-xl border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-600 transition-all text-white"
          />
        </div>
      </div>

      <div className="bg-slate-600 border mt-2.5 border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin text-slate-800 mb-4" size={40} />
            <p className="font-medium animate-pulse">Synchronizing drive data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700">
                  <th className="px-8 py-5 text-sm md:text-md lg:text-xl font-bold text-slate-300 uppercase tracking-widest">Company & Roles</th>
                  <th className="px-8 py-5 text-sm md:text-md lg:text-xl font-bold text-slate-300 uppercase tracking-widest">Global Criteria</th>
                  <th className="px-8 py-5 text-sm md:text-md lg:text-xl font-bold text-slate-300 uppercase tracking-widest text-center">Source</th>
                  <th className="px-8 py-5 text-sm md:text-md lg:text-xl font-bold text-slate-300 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500">
                {finalDrives.length > 0 ? (
                  finalDrives.map((drive) => (
                    <DriveRow 
                      key={drive.id} 
                      drive={drive} 
                      onDelete={() => handleDelete(drive.id, drive.name)} 
                      onView={() => setViewingDrive(drive)}
                      onViewApplicants={() => setViewingApplicantsDrive(drive)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-20 text-slate-200 font-medium italic">No drives found in this category.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateDriveModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => { setIsCreateModalOpen(false); refresh(); }} 
        />
      )}

      {viewingDrive && (
        <ViewDriveModal 
          drive={viewingDrive} 
          onClose={() => setViewingDrive(null)} 
        />
      )}
    </div>
  );
};

// --- DRIVE APPLICANTS COMPONENT ---
const DriveApplicants = ({ drive, onBack }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); 
  
  const token = localStorage.getItem('token');
  const config = { headers: { 'Authorization': `Bearer ${token}` } };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/drive-applicants/${drive.id}`, config);
      setApplicants(res.data);
    } catch (err) {
      console.error("Error fetching applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [drive.id]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      await api.post('/admin/applications/bulk-status', {
        applicationIds: selectedIds,
        newStatus: status
      }, config);
      
      alert(`Successfully marked ${selectedIds.length} students as ${status}`);
      setSelectedIds([]); 
      fetchApplicants(); 
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleSendToCompany = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      // 1. Get the actual data for selected applicants to show in a confirmation (optional)
      // 2. Call the new specialized endpoint
      await api.post('/admin/applications/send-to-company', {
        applicationIds: selectedIds,
        driveId: drive.id,
        role_title:drive.roles[0]?.role_title || "N/A",
         // Ensure your drive object has the company email
      }, config);
  
      alert(`Sheet generated and emailed to ${drive.contact_email || 'the company'}`);
      setSelectedIds([]);
      fetchApplicants(); // Refresh statuses
    } catch (err) {
      console.error(err);
      alert("Failed to send data to company.");
    }
  };
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return applicants.filter(a => 
      a.full_name?.toLowerCase().includes(q) ||
      a.roll_number?.toLowerCase().includes(q) ||
      a.branch?.toLowerCase().includes(q) ||
      a.role_title?.toLowerCase().includes(q)
    );
  }, [applicants, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-700 rounded-4xl p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition shadow-lg">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{drive.name} Applicants</h1>
            <p className="text-slate-200 font-bold flex items-center gap-2">
              <Users size={18} className="text-blue-300"/> Total Applications: {applicants.length}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-800 border-4 border-slate-300 text-white px-8 py-4 rounded-3xl text-center shadow-xl">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Search Results</p>
          <p className="text-3xl font-black">{filtered.length}</p>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-6 p-4 bg-slate-700 border-2 border-slate-500 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <p className="text-white font-black uppercase tracking-widest ml-4">
            {selectedIds.length} Students Selected
          </p>
          <div className="flex gap-3">
            <button 
              onClick={handleSendToCompany}
              className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-500 transition-all"
            >
              Send to Company
            </button>
            <button 
              onClick={() => handleBulkStatusChange('Shortlisted')}
              className="px-6 py-4 bg-green-600 text-white rounded-xl font-black text-xs uppercase hover:bg-green-500 transition-all"
            >
              Mark Shortlisted
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="px-4 py-4 bg-slate-700 text-slate-300 rounded-xl font-black text-xs uppercase hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <input 
          type="text"
          placeholder="Search by Name, Roll No, Branch, or Job Role..."
          className="w-full pl-16 pr-6 py-5 bg-slate-600 border-2 border-slate-400/30 rounded-2xl outline-none text-white focus:border-slate-100 transition-all text-xl placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-slate-600 rounded-2xl border border-slate-400/30 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-32 text-center text-white flex flex-col items-center">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-black uppercase tracking-widest">Extracting applicant database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-500">
                  <th className="px-8 py-6 w-10">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-indigo-500"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(filtered.map(a => a.application_id));
                        else setSelectedIds([]);
                      }}
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                    />
                  </th>
                  <th className="px-4 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter">Student Info</th>
                  <th className="px-8 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter">Branch</th>
                  <th className="px-8 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter">Applied For</th>
                  <th className="px-8 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter">Portfolio Links</th>
                  <th className="px-8 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter">Academic</th>
                  <th className="px-8 py-6 text-sm font-black text-slate-300 uppercase tracking-tighter text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500">
                {filtered.map((app) => (
                  <tr key={app.application_id} className={`transition-colors ${selectedIds.includes(app.application_id) ? 'bg-indigo-500/20' : 'hover:bg-slate-500/50'}`}>
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-indigo-500 cursor-pointer"
                        checked={selectedIds.includes(app.application_id)}
                        onChange={() => toggleSelect(app.application_id)}
                      />
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-xl font-black text-white">{app.full_name}</p>
                      <p className="text-sm font-bold text-slate-400 tracking-widest">{app.roll_number}</p>
                    </td>
                    <td className="px-8 py-5 text-slate-100 font-bold uppercase text-sm">{app.branch}</td>
                    <td className="px-8 py-5">
                      <span className="bg-slate-900/50 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg font-black text-xs">
                        {app.role_title}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <a 
                        href={`http://localhost:3000/portfolio/${app.portfolio_slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-black text-green-400 hover:underline truncate max-w-[150px] block"
                      >
                        {app.portfolio_slug}
                      </a>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-lg font-black text-green-400">{app.cgpa} <span className="text-[10px] text-slate-400">CGPA</span></p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                        app.status === 'Applied' ? 'bg-blue-500/20 text-blue-300' : 
                        app.status === 'Sent to Company' ? 'bg-indigo-500/20 text-indigo-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-slate-300 font-bold italic">No applicants found matching your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- HELPER SUB-COMPONENTS ---

const StatCard = ({ label, value, icon, color, bgColor }) => (
  <div className="bg-slate-500 p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
    <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
      {icon}
    </div>
    <p className="text-slate-200 text-sm md:text-md lg:text-xl font-bold uppercase tracking-tight">{label}</p>
    <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
  </div>
);

const TabButton = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex text-sm md:text-md lg:text-xl items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
      active ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-200 hover:bg-slate-700/50'
    }`}
  >
    {icon} {label}
  </button>
);

const DriveRow = ({ drive, onDelete, onView, onViewApplicants }) => (
  <tr className="group hover:bg-slate-500 transition-all bg-slate-600">
    <td className="px-8 py-6">
      <p className="font-black text-slate-100 text-sm md:text-md lg:text-xl">{drive.name}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {drive.roles?.map((r, i) => (
          <span key={i} className="text-sm md:text-md lg:text-xl text-black border border-slate-300/40 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
            {r.role_title}
          </span>
        ))}
      </div>
    </td>
    <td className="px-8 py-6">
      <div className="flex flex-col gap-1">
        <span className="text-sm md:text-md lg:text-xl font-bold text-slate-100 flex items-center gap-1.5">
          <Award size={20} className="text-indigo-300"/> Min CGPA: {drive.min_cgpa}
        </span>
        <span className="ml-7 text-sm md:text-md lg:text-xl text-slate-300 font-medium">Max Backlogs: {drive.max_backlogs}</span>
      </div>
    </td>
    <td className="px-8 py-6 text-center">
      <div className="flex justify-center">
        {drive.is_automated ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-sm md:text-md lg:text-xl font-black uppercase">
            <Mail size={12}/> Automated
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-500/30 rounded-full text-sm md:text-md lg:text-xl font-black uppercase">
            <MousePointer2 size={12}/> Typical
          </span>
        )}
      </div>
    </td>
    <td className="px-8 py-6 text-right">
      <div className="flex justify-end gap-3">
        <button onClick={onViewApplicants} className="p-2.5 bg-slate-600 text-white hover:bg-slate-700 rounded-xl transition-all shadow-sm flex items-center gap-2 px-4">
          <Users size={20} /> <span className="text-xs font-bold uppercase">Applicants</span>
        </button>
        <button onClick={onView} className="p-2.5 bg-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm"><Eye size={20} /></button>
        <button onClick={onDelete} className="p-2.5 bg-slate-700 text-slate-200 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all shadow-sm"><Trash2 size={20} /></button>
      </div>
    </td>
  </tr>
);

const ViewDriveModal = ({ drive, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="bg-slate-800 rounded-[2.5rem] w-full max-w-2xl p-8 border border-slate-700 shadow-2xl animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-white">{drive.name}</h2>
            {drive.is_automated && <Mail size={20} className="text-blue-400" />}
          </div>
          <p className="flex items-center gap-2 text-indigo-400 font-bold tracking-wide">
            <MapPin size={18} /> {drive.location || 'Location Not Specified'}
          </p>
        </div>
        <button onClick={onClose} className="p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-all"><X size={24} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-700/40 p-5 rounded-3xl border border-slate-600/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Calendar size={12}/> Drive Date
          </p>
          <p className="text-lg font-bold text-white">
            {new Date(drive.drive_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-slate-700/40 p-5 rounded-3xl border border-slate-600/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Award size={12}/> Eligibility
          </p>
          <p className="text-lg font-bold text-white">{drive.min_cgpa} CGPA • {drive.max_backlogs} Backlogs</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Job Roles & Compensation</h3>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {drive.roles?.map((role, idx) => (
            <div key={idx} className="bg-slate-900/40 p-5 rounded-[1.5rem] border border-slate-700 flex justify-between items-center group hover:border-indigo-500/50 transition-all">
              <div>
                <p className="font-black text-white text-lg">{role.role_title}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">{role.job_type} • {role.skills_required}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-black text-2xl tracking-tighter">₹{role.salary_package} <span className="text-xs text-green-500/70">LPA</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Eligible Branches</h3>
        <div className="flex flex-wrap gap-2">
          {drive.branches?.map((branch, idx) => (
            <span key={idx} className="px-4 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-black">
              {branch}
            </span>
          ))}
        </div>
      </div>

      <button onClick={onClose} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg active:scale-[0.98]">
        Close Preview
      </button>
    </div>
  </div>
);

const CreateDriveModal = ({ onClose, onSuccess }) => {
  const [driveData, setDriveData] = useState({ company_name: '', company_email:'', location: '', drive_date: '', min_cgpa: '', max_backlogs: '' });
  const [roles, setRoles] = useState([{ role_title: '', job_type: 'Full-time', salary_package: '', skills_required: '' }]);
  const [branches, setBranches] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get(`/admin/branches`);
        setAvailableBranches(res.data.map(item => item.branch_name));
      } catch (err) { console.error("Error fetching branches:", err); }
    };
    fetchBranches();
  }, []);

  const addRole = () => setRoles([...roles, { role_title: '', job_type: 'Full-time', salary_package: '', skills_required: '' }]);
  const updateRole = (index, field, value) => {
    const updatedRoles = [...roles];
    updatedRoles[index][field] = value;
    setRoles(updatedRoles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (branches.length === 0) return alert("Select at least one branch");
    
    const token = localStorage.getItem('token');
    const config = { headers: { 'Authorization': `Bearer ${token}` } };
  
    try {
      const formattedRoles = roles.map(r => ({ title: r.role_title, type: r.job_type, salary: r.salary_package, skills: r.skills_required }));
      const payload = { ...driveData, roles: formattedRoles, branches, is_automated: false };
      await api.post('/create-drive', payload, config);
      alert("Drive posted successfully!");
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.response?.data?.msg || "Something went wrong"}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-700 rounded-3xl w-full max-w-4xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-50 uppercase tracking-tight">New Manual Placement Drive</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-600 rounded-full text-slate-300 transition-colors"><X size={26} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Company Name</label>
              <input required className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500 transition-all" 
                onChange={e => setDriveData({...driveData, company_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Company Email</label>
              <input required className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500 transition-all" 
                onChange={e => setDriveData({...driveData, company_email: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Location</label>
              <input required placeholder="e.g. Hyderabad, Remote" className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500" 
                onChange={e => setDriveData({...driveData, location: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Drive Date</label>
              <input type='date' required className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500" 
                onChange={e => setDriveData({...driveData, drive_date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Min CGPA</label>
                <input type="number" step="0.01" className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500" 
                  onChange={e => setDriveData({...driveData, min_cgpa: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Backlogs</label>
                <input type="number" className="w-full p-4 bg-slate-800 border-2 border-slate-600 rounded-2xl outline-none text-white focus:border-indigo-500" 
                  onChange={e => setDriveData({...driveData, max_backlogs: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-widest">Eligible Branches</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {availableBranches.map(b => (
                  <button key={b} type="button" 
                    onClick={() => branches.includes(b) ? setBranches(branches.filter(x => x !== b)) : setBranches([...branches, b])}
                    className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${branches.includes(b) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-50 text-lg uppercase tracking-widest">Job Roles</h3>
              <button type="button" onClick={addRole} className="text-indigo-400 text-xs font-black uppercase flex items-center gap-1 hover:text-indigo-300">
                <Plus size={16}/> Add Another Role
              </button>
            </div>
            <div className="space-y-4">
              {roles.map((role, index) => (
                <div key={index} className="p-6 border-2 border-slate-600 rounded-[2rem] bg-slate-800/50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input placeholder="Job Title" className="p-4 bg-slate-800 text-white outline-none border border-slate-600 rounded-xl focus:border-indigo-500" 
                      onChange={e => updateRole(index, 'role_title', e.target.value)} required />
                    <select className="p-4 bg-slate-800 text-white border border-slate-600 outline-none rounded-xl focus:border-indigo-500" 
                      onChange={e => updateRole(index, 'job_type', e.target.value)}>
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Intern + FTE">Intern + FTE</option>
                    </select>
                    <input placeholder="Package (LPA)" className="p-4 bg-slate-800 text-white outline-none border border-slate-600 rounded-xl focus:border-indigo-500" 
                      onChange={e => updateRole(index, 'salary_package', e.target.value)} required />
                  </div>
                  <input placeholder="Skills (e.g. React, Node.js, SQL)" className="w-full p-4 bg-slate-800 text-white border outline-none border-slate-600 rounded-xl focus:border-indigo-500" 
                    onChange={e => updateRole(index, 'skills_required', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-[0.99]">
            Publish Placement Drive
          </button>
        </form>
      </div>
    </div>
  );
};

export default Postdrive;