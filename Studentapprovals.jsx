import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  GraduationCap, 
  Loader2, 
  CheckCircle, 
  Clock ,
  XCircle
} from 'lucide-react';
import api from "../../utils/api"; 


const StudentApprovals = () => {
 
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); 
  const token = localStorage.getItem('token');
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/students/approvals",auth);
      
      setStudents(res.data || []);
      console.log(students);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  
  const handleApprovalAction = async (id, status) => {
    const previousStudents = [...students];
  
    try {
      
      setStudents(prev => prev.map(s => 
        s.id === id ? { ...s, is_approved: status } : s
      ));
  
     
      const res = await api.put(
        `/admin/students/approve/${id}`, 
        { is_approved: status }, 
        auth                     
      );
  
      if (res.status === 200) {
        console.log("Server synced:", res.data.msg);
      }
  
    } catch (err) {
     
      setStudents(previousStudents);
  
      const errorMsg = err.response?.data?.msg || "Failed to update student status.";
      alert(`Error: ${errorMsg}`);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

 
 const filteredStudents = useMemo(() => {
  return students.filter(student => {
   
    const query = searchQuery.toLowerCase();

   
    const matchesSearch =
      student.full_name?.toLowerCase().includes(query) ||
      student.course?.toString().toLowerCase().includes(query)||
      student.department?.toLowerCase().includes(query) ||
      student.roll_number?.toString().toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query);
    
   
    const matchesStatus = activeTab === "approved" ? student.is_approved : !student.is_approved;
    
    return matchesSearch && matchesStatus;
  });
}, [students, searchQuery, activeTab]);

 
  return (
    <div className="min-h-screen bg-slate-700 rounded-4xl p-4 md:p-8">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">Student approvals Verification</h1>
        <p className="text-slate-300 text-sm">Review and manage student eligibility for placement drives</p>
      </div>

    
      <div className="bg-slate-400 p-4 rounded-2xl border-x border border-slate-200">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 ">
          
          
          <div className="flex bg-slate-600 p-1.5 rounded-2xl w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center justify-center gap-2 flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm md:text-md lg:text-xl font-bold transition-all ${
                activeTab === 'pending' 
                ? 'bg-white text-slate-800 shadow-md' 
                : 'text-slate-300 hover:text-slate-400'
              }`}
            >
              <Clock size={16} />
              Pending List ({students.filter(s => !s.is_approved).length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex items-center justify-center gap-2 flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm md:text-md lg:text-xl font-bold transition-all ${
                activeTab === 'approved' 
                ? 'bg-white text-green-600 shadow-md' 
                : 'text-slate-300 hover:text-slate-400'
              }`}
            >
              <CheckCircle size={16} />
              Approved List ({students.filter(s => s.is_approved).length})
            </button>
          </div>

       
          <div className="relative w-full lg:w-4/6 ">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={25} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, branch, or email..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-300 border text-sm md:text-md lg:text-xl placeholder:text-sm placeholder:md:text-md 
              placeholder:lg:text-xl border-slate-200 rounded-xl focus:ring-2
               focus:ring-slate-500  outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      
      <div className="bg-slate-600 rounded-2xl border mt-5 border-slate-500 rounded-b-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-white">
              <Loader2 className="animate-spin mb-3 text-slate-600" size={40} />
              <p className="text-sm md:text-md lg:text-xl">Loading student database...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead >
                <tr className="bg-slate-700 border-b border-slate-200 ">
                  <th className="px-6 py-4 text-sm md:text-md lg:text-xl font-bold text-slate-100 uppercase tracking-wider text-start">Student Name</th>
                  <th className="px-6 py-4 text-sm md:text-md lg:text-xl font-bold text-slate-100 uppercase tracking-wider text-start">Course & Branch</th>
                  <th className="px-6 py-4 text-sm md:text-md lg:text-xl font-bold text-slate-100 uppercase tracking-wider text-start">Roll Number</th>  
                  <th className="px-6 py-4 text-sm md:text-md lg:text-xl font-bold text-slate-100 uppercase tracking-wider text-start">College Email</th>
                  <th className="px-6 py-4 text-sm md:text-md lg:text-xl font-bold text-slate-100 uppercase tracking-wider text-start">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.full_name} className="hover:bg-slate-500 transition-colors group text-slate-200 ">
                      <td className="px-6 py-5 ">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center  justify-center font-bold text-sm md:text-md lg:text-xl ${
                            activeTab === 'approved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-slate-800'
                          }`}>
                            {student.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-300 text-sm md:text-md lg:text-xl">{student.full_name}</p>
                            <p className="text-sm md:text-md lg:text-xl font-bold text-slate-400 uppercase tracking-tighter">Reg ID: {student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 ">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <GraduationCap size={22} className="text-slate-400 text-sm md:text-md lg:text-xl" />
                          <span className='text-slate-300 font-balck tracking text-sm md:text-md lg:text-xl'>{student.course}.{student.department}</span>
                          <span className="text-slate-300 "></span> 
                        </div>
                      </td>
                      <td className='px-6 py-5 '>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <GraduationCap size={22} className="text-slate-400" />
                          <span className='text-slate-300 text-sm md:text-md lg:text-xl' >{student.roll_number}</span>
                          <span className="text-slate-300"></span>
                        </div>
                      </td>
                      <td className="px-6 py-5 ">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={22} className="text-slate-400" />
                          <span className="font-medium text-slate-300 text-sm md:text-md lg:text-xl">{student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 ">
                        <div className="flex justify-end gap-3">
                          {activeTab === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleApprovalAction(student.id, true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-600 hover:text-white transition-all text-sm md:text-md lg:text-xl font-bold shadow-sm"
                              >
                                <UserCheck size={22} /> Approve
                              </button>
                              <button 
                                onClick={() => handleApprovalAction(student.id, false)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all text-sm md:text-md lg:text-xl font-bold shadow-sm"
                              >
                                <UserX size={22} /> Reject
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleApprovalAction(student.id, false)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all text-sm md:text-md lg:text-xl font-bold"
                            >
                              <XCircle size={22} /> Revoke Approval
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-24 text-slate-400">
                      <div className="flex flex-col items-center">
                        <Search size={40} className="mb-2 opacity-20" />
                        <p className="italic">No students found matching your search or filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentApprovals;