import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { ChevronDown } from 'lucide-react';

function Signup() {
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState([]);

  const [tempPassword, setTempPassword] = useState("");
  const [tempConfirm, setTempConfirm] = useState("");
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
      setStudentData({ ...studentData, [name]: value, department: "" });
    } else {
      setStudentData({ ...studentData, [name]: value });
    }
  };

  const [studentData, setStudentData] = useState({
    full_name: "",course: "", department: "",  roll_number: "",   email: "", password: ""
  });

  const [adminData, setAdminData] = useState({
    college_name: "", email: "", password: ""
  });

  const validateRegex = (pwd) => {
    const rules = [
      { regex: /.{8,}/, message: "At least 8 characters long" },
      { regex: /[A-Z]/, message: "At least 1 uppercase letter" },
      { regex: /[a-z]/, message: "At least 1 lowercase letter" },
      { regex: /[0-9]/, message: "At least 1 number" },
      { regex: /[^A-Za-z0-9]/, message: "At least 1 special character" },
    ];
    const validationErrors = rules.filter((r) => !r.regex.test(pwd)).map((r) => r.message);
    setError(validationErrors);
    return validationErrors.length === 0;
  };

  useEffect(() => {
    if (tempPassword === tempConfirm && validateRegex(tempPassword) && tempConfirm !== "") {
      if (role === "student") {
        setStudentData(prev => ({ ...prev, password: tempConfirm }));
      } else {
        setAdminData(prev => ({ ...prev, password: tempConfirm }));
      }
    }
  }, [tempPassword, tempConfirm, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentData = role === "student" ? studentData : adminData;
    if (!currentData.password) {
      alert("Passwords must match and meet all security requirements.");
      return;
    }

    const endpoint = role === "student" ? "/auth/student-signup" : "/auth/signup";

    try {
      const res = await api.post(endpoint, { ...currentData, role });
      alert(res.data.msg);
    } catch (err) {
      alert(err.response?.data?.msg || "Sign up failed");
    }
  };

  return (
    <div className="flex justify-center h-auto py-10">
      <form onSubmit={handleSubmit} className="bg-transparent border border-slate-300 flex flex-col w-96 h-auto items-center rounded-xl p-6 text-slate-100 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-slate-50">Create Account</h1>

        <select
          className="w-5/6 h-10 rounded outline-none px-3 border border-slate-400 focus:border-white mb-6 text-slate-100 bg-transparent"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="" disabled className="text-black">-- Choose Role --</option>
          <option value="student" className="text-black">Student</option>
          <option value="admin" className="text-black">Admin (TPO)</option>
        </select>

        {role === "student" && (
          <div className="w-full flex flex-col items-center">
            <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent" type='text' placeholder="Full Name" required onChange={(e) => setStudentData({ ...studentData, full_name: e.target.value })} />
            <div className="relative w-5/6 bg-transparent rounded mb-4 border border-slate-400 focus-within:border-white">
              <select
                name="course"
                value={studentData.course || ''}
                onChange={handleChange}
                required
                className="w-full h-10 bg-transparent outline-none px-3 appearance-none cursor-pointer text-slate-100"
              >
                <option value="" hidden disabled className="text-black">Select Course</option>
                {Object.keys(courseData).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none" />
            </div>
            <div className="relative w-5/6 bg-transparent rounded mb-4 border border-slate-400 focus-within:border-white">
              <select
                name="department"
                value={studentData.department || ''}
                onChange={handleChange}
                required
                disabled={!studentData.course}
                className="w-full h-10 bg-transparent outline-none px-3 appearance-none cursor-pointer text-slate-100 disabled:opacity-50"
              >
                <option value="" hidden disabled className="text-black">{studentData.course ? "Select Branch" : "Select Course First"}</option>
                {studentData.course && courseData[studentData.course].map(b => <option key={b} value={b} className="text-black">{b}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-100 pointer-events-none" />
            </div>

            {/* <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent" type='text' placeholder="College Name" required onChange={(e) => setStudentData({ ...studentData, college_name: e.target.value })} /> */}
            <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent uppercase" type='text' placeholder="Roll Number" required onChange={(e) => setStudentData({ ...studentData, roll_number: e.target.value })} />

            

            
            {/* <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent" type="email" placeholder="Admin Email" required onChange={(e) => setStudentData({ ...studentData, Admin_email: e.target.value })} /> */}
            <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent lowercase" type="email" placeholder="Email" required onChange={(e) => setStudentData({ ...studentData, email: e.target.value })} />
          </div>
        )}

        {role === "admin" && (
          <div className="w-full flex flex-col items-center">
            <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent" type='text' placeholder="College Name" required onChange={(e) => setAdminData({ ...adminData, college_name: e.target.value })} />
            <input className="border w-5/6 h-10 rounded pl-4 mb-4 border-slate-400 focus:border-white outline-none bg-transparent" type="email" placeholder="Admin Email" required onChange={(e) => setAdminData({ ...adminData, email: e.target.value })} />
          </div>
        )}

        {role && (
          <div className="w-full flex flex-col items-center">
            <input
              className="border w-5/6 h-10 rounded pl-4 mb-2 border-slate-400 focus:border-white outline-none bg-transparent"
              type={showPassword ? 'text' : "password"}
              placeholder="Enter Password"
              required
              onChange={(e) => {
                setTempPassword(e.target.value);
                validateRegex(e.target.value);
              }}
            />

            {error.length > 0 && (
              <ul className="text-slate-200 text-[15px] w-5/6 mb-4 list-disc pl-5">
                {error.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}

            {error.length === 0 && tempPassword.length >= 8 && (
              <input
                className={`border w-5/6 h-10 rounded outline-none pl-4 mb-4 border-slate-400 focus:border-white bg-transparent ${tempPassword === tempConfirm && tempConfirm !== "" ? "bg-slate-700" : ""}`}
                type={showPassword ? 'text' : "password"}
                placeholder="Confirm Password"
                required
                onChange={(e) => setTempConfirm(e.target.value)}
              />
            )}

            {tempConfirm !== "" && tempPassword !== tempConfirm && (
              <p className="text-red-500 text-[10px] mb-2 font-bold">Passwords do not match yet</p>
            )}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-slate-200 mb-4 underline"
            >
              {showPassword ? "Hide Password" : "Show Password"}
            </button>

            <button
              type="submit"
              disabled={tempPassword !== tempConfirm || error.length > 0}
              className={`w-5/6 h-12 rounded-xl font-bold transition-all shadow-lg text-white ${tempPassword === tempConfirm && tempConfirm !== "" ? "bg-slate-900 hover:bg-black" : "bg-slate-400 cursor-not-allowed"}`}
            >
              Register
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Signup;