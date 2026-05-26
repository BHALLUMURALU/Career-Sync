import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { Search, CheckCircle2, Lock, Clock, XCircle, Trophy } from "lucide-react";

const Viewplacements = () => {
  const [drives, setDrives] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/placements/eligible', getAuthHeaders());
      console.log("Drives fetched:", res.data);
      setDrives(res.data || []);
    } catch (err) {
      console.error("Fetch failed:", err.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const filteredDrives = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return drives.filter((drive) => 
      drive.company_name?.toLowerCase().includes(query) ||
      drive.role_title?.toLowerCase().includes(query) ||
      drive.salary_package?.toString().toLowerCase().includes(query)
    );
  }, [drives, searchTerm]);

  const submitApplication = async (e, drive) => {
    e.preventDefault();
    try {
      // Use the database status to check if already applied
      if (!drive.has_applied) {
        const res = await api.post(
          `student/applications/apply`, 
          { drive_id: drive.drive_id, role_id: drive.role_id }, 
          getAuthHeaders()
        );
  
        if (res.status === 200 || res.status === 201) {
          alert("Application submitted successfully!");
          fetchDrives(); // Refresh to get the new 'has_applied' status from DB
        }
      } else {
        alert("You have already applied for this role.");
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Application failed.");
    }
  };

  // Helper function to render the correct button state
  const renderActionButton = (drive) => {
    if (drive.has_applied) {
      const status = drive.application_status;
      
      // Dynamic styles based on DB status
      let config = {
        style: "bg-green-100 text-green-700 border-2 border-green-300",
        text: status || "Applied",
        icon: <CheckCircle2 size={20} />
      };

      if (status === 'Shortlisted') config = { style: "bg-blue-100 text-blue-700 border-2 border-blue-300", text: "Shortlisted", icon: <Trophy size={20}/> };
      if (status === 'Rejected') config = { style: "bg-red-100 text-red-700 border-2 border-red-300", text: "Not Selected", icon: <XCircle size={20}/> };

      return (
        <button disabled className={`w-full md:w-auto px-10 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 ${config.style}`}>
          {config.icon} {config.text.toUpperCase()}
        </button>
      );
    }

    if (!drive.is_eligible) {
      return (
        <button disabled className="w-full md:w-auto px-12 py-4 rounded-2xl font-black text-lg bg-slate-200 text-slate-400 cursor-not-allowed">
          LOCKED
        </button>
      );
    }

    return (
      <button 
        onClick={(e) => submitApplication(e, drive)}
        className="w-full md:w-auto px-12 py-4 rounded-2xl font-black text-lg bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl"
      >
        APPLY NOW
      </button>
    );
  };

  return (
    <div className="p-6 bg-slate-700 min-h-screen font-sans">
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-black text-slate-50 mb-6">Explore Placements</h1>
        <div className="w-full md:w-3/5 relative">
          <Search className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-300" size={24} />
          <input 
            type="text" 
            placeholder="Search by Company or Role..." 
            className="w-full p-5 pl-14 bg-slate-600 placeholder:text-slate-300 border-2 border-slate-200 rounded-3xl focus:border-slate-900 outline-none shadow-sm transition-all text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
             <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mb-4"></div>
             <p className="font-bold">Syncing live recruitment drives...</p>
          </div>
        ) : filteredDrives.length > 0 ? (
          filteredDrives.map((drive) => (
            <div 
              key={`${drive.drive_id}-${drive.role_id}`} 
              className={`p-8 bg-slate-700 rounded-2xl shadow-xl border-2 transition-all relative overflow-hidden ${
                drive.is_eligible ? ' hover:shadow-2xl hover:-translate-y-1' : ' opacity-80'
              }`}
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${drive.is_eligible ? 'bg-slate-900' : 'bg-slate-300'}`}></div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1">
                  <h3 className={`text-4xl font-black tracking-tight mb-3 ${drive.is_eligible ? 'text-slate-100' : 'text-slate-400'}`}>
                    {drive.company_name}
                  </h3>
                  <div className="flex flex-wrap gap-5 text-sm font-bold uppercase tracking-wider">
                    <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">💼 {drive.job_type}</span>
                    <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">🎓 Min CGPA: {drive.min_cgpa}</span>
                  </div>
                </div>

                {drive.is_eligible ? (
                  <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-xs font-black uppercase shadow-lg shadow-slate-100 flex flex-row gap-2 items-center"> 
                    <CheckCircle2 size={25}/> <span className="text-xl">Eligible</span> 
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 px-6 py-2 rounded-2xl text-xs font-black uppercase border border-red-100 flex flex-row gap-2 items-center">
                   <Lock size={25}/> <span className="text-xl">Ineligible: {drive.ineligibility_reason} </span> 
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-center gap-6 ${
                drive.is_eligible ? 'bg-slate-400 border-slate-100' : 'bg-slate-100/50 border-slate-200'
              }`}>
                <div className="text-center md:text-left">
                  <h4 className={`text-2xl font-black ${drive.is_eligible ? 'text-slate-800' : 'text-slate-600'}`}>{drive.role_title}</h4>
                  <p className={`text-xl font-bold mt-1 ${drive.is_eligible ? 'text-indigo-600' : 'text-slate-600'}`}>{drive.salary_package}</p>
                </div>

                {renderActionButton(drive)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-slate-500 rounded-[3rem] border-4 border-dashed border-slate-100">
            <p className="text-slate-300 text-xl font-bold">No active drives found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Viewplacements;