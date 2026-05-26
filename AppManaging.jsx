import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Database, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  Save, 
  CheckCircle2,
  ChevronDown 
} from 'lucide-react';
import api from "../../utils/api";

const AppManaging = () => {
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(""); 
  const [courseSelection, setCourseSelection] = useState({ course: "", department: "" });
  const [systemYear, setSystemYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "course") {
      setCourseSelection({ course: value, department: "" });
      setSelectedBranch(""); 
    } else {
      setCourseSelection(prev => ({ ...prev, [name]: value }));
      setSelectedBranch(value); 
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchRes = await api.get("/admin/branches", getAuthHeaders());
      setBranches(branchRes.data || []);

      try {
        const settingsRes = await api.get("/admin/settings/active-year", getAuthHeaders());
        if (settingsRes.data?.year) {
          setSystemYear(settingsRes.data.year);
        }
      } catch (err) {
        console.warn("Active year setting not found, using default.");
      }
    } catch (err) {
      console.error("Management Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      const res = await api.post("/admin/branches", 
        { branch_name: selectedBranch }, 
        getAuthHeaders()
      );

      setBranches((prev) => [...prev, res.data.branch || res.data]);
      setCourseSelection({ course: "", department: "" });
      setSelectedBranch("");
      showSuccess(`${selectedBranch} Added Successfully!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to add branch");
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm("Deleting a branch will remove it from all Admin profiles. Proceed?")) return;
    
    try {
      await api.delete(`/admin/branches/${id}`, getAuthHeaders());
      setBranches((prev) => prev.filter(b => b.id !== id));
      showSuccess("Branch Removed.");
    } catch (err) {
      console.error(err);
      alert("Error deleting branch");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings/active-year", 
        { year: systemYear }, 
        getAuthHeaders()
      );
      showSuccess("System Settings Updated Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-700 rounded-4xl p-6 md:p-10">
      
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="text-slate-200" size={28} />
          <h1 className="text-3xl font-bold text-slate-200">App Management</h1>
        </div>
        <p className="text-slate-300 font-medium">Configure global system parameters and academic structures.</p>
      </div>

      {successMsg && (
        <div className="fixed top-10 right-10 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl animate-bounce z-50">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        <div className="space-y-6">
          <div className="bg-slate-600 p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <Database size={20} className="text-slate-300" />
              <h2 className="text-xl font-bold text-slate-300">Branch Directory</h2>
            </div>

            <form onSubmit={handleAddBranch} className="space-y-4 mb-8">
              <div className="relative w-full bg-transparent rounded border border-slate-400 focus-within:border-white">
                <select
                  name="course"
                  value={courseSelection.course}
                  onChange={handleChange}
                  required
                  className="w-full h-10 bg-transparent outline-none px-3 appearance-none cursor-pointer text-slate-100"
                >
                  <option value="" hidden disabled className="text-black">Select Course</option>
                  {Object.keys(courseData).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none" />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1 bg-transparent rounded border border-slate-400 focus-within:border-white">
                  <select
                    name="department"
                    value={courseSelection.department}
                    onChange={handleChange}
                    required
                    disabled={!courseSelection.course}
                    className="w-full h-10 bg-transparent outline-none px-3 appearance-none cursor-pointer text-slate-100 disabled:opacity-50"
                  >
                    <option value="" hidden disabled className="text-black">{courseSelection.course ? "Select Branch" : "Select Course First"}</option>
                    {courseSelection.course && courseData[courseSelection.course].map(b => <option key={b} value={b} className="text-black">{b}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none" />
                </div>

                <button 
                  type="submit" 
                  disabled={!selectedBranch}
                  className="bg-slate-500 hover:bg-slate-400 disabled:bg-slate-800 text-slate-100 px-6 rounded-xl transition-all shadow-md"
                >
                  <Plus size={24} />
                </button>
              </div>
            </form>

            <div className="space-y-3 max-h-[270px] overflow-y-auto pr-2 custom-scrollbar">
              {branches.length === 0 ? (
                <p className="text-center text-slate-200 py-4 italic">No branches found. Select one above.</p>
              ) : (
                branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-3 bg-slate-500/50 border border-slate-400 rounded-2xl group hover:border-slate-300 transition-all">
                    <span className="font-bold text-slate-100">{branch.branch_name}</span>
                    <button 
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="p-2 text-slate-300 hover:text-red-400 md:opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-600 p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-8 text-slate-800">
              <Calendar size={20} className="text-slate-300" />
              <h2 className="text-xl font-bold text-slate-300">Academic Configuration</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Active Placement Year
                </label>
                <select 
                  value={systemYear}
                  onChange={(e) => setSystemYear(e.target.value)}
                  className="w-full bg-slate-500 border border-slate-400 rounded-xl px-4 py-4 font-bold text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2024}>2024 Academic Year</option>
                  <option value={2025}>2025 Academic Year</option>
                  <option value={2026}>2026 Academic Year</option>
                  <option value={2027}>2027 Academic Year</option>
                </select>
                <p className="mt-2 text-xs text-slate-400 italic">This controls the default data displayed on all analytics dashboards.</p>
              </div>

              <div className="pt-6 border-t border-slate-500">
                <div className="flex items-start gap-4 p-4 bg-slate-700/50 rounded-2xl border border-slate-500 mb-6">
                  <ShieldCheck size={24} className="text-slate-400 shrink-0" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong>Admin Security:</strong> Changes here affect the global database and live dashboards. Ensure you have finalized the academic calendar before updating the active year.
                  </p>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {saving ? "Updating System..." : "Save Global Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AppManaging;
