import React, { useState, useContext } from "react";
import { Authcontext } from "../../context/Authcontext";
import api from "../../utils/api";

const Settings = () => {
  const {  logout } = useContext(Authcontext);
  const [activeTab, setActiveTab] = useState("account");
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const auth = {headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}};
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert("Passwords do not match");

    setLoading(true);
    try {
      const a =  await api.post("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      },auth);
      if(a.status===200){
        alert(a.data.msg);
      }
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      alert(err.response?.data?.msg || "Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row  md:flex-row  p-5 min-h-screen bg-slate-700">
      
      <div className="w-full md:w-full  bg-transparent p-7 rounded-2xl border-l-8 border-t border-b border-r border-slate-800 shadow-sm ">
        <div className="bg-slate-600 shadow-xl p-8 rounded-2xl" >
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-50 mb-8 ml-3">Settings</h2>
        <nav className="flex flex-row justify-around gap-10 ">
          {["account", "notifications", "privacy"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-center w-full py-3 rounded-lg capitalize font-medium transition  ${
                activeTab === tab ? "bg-slate-800 text-white text-xl " : "bg-slate-500 hover:bg-slate-800 hover:text-white text-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
          <button onClick={logout} className="text-center w-full py-3 rounded-lg text-white font-medium bg-slate-500 hover:bg-slate-900 ">
            Logout Session
          </button>
        </nav>
        </div>

      
      <div className="flex-1 mt-10 ">
        <div className="max-w-3xl bg-slate-600 rounded-2xl shadow-md border-l-8 border-slate-800 p-8">
          
          
          {activeTab === "account" && (
            <section className="animate-fadeIn">
              <h3 className="text-xl font-bold mb-6 text-slate-100">Account Security</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200">Current Password</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <button disabled={loading} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition">
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>
          )}

          
          {activeTab === "notifications" && (
            <section className="animate-fadeIn space-y-6">
              <h3 className="text-xl text-slate-100 font-bold">Email Notifications</h3>
              <div className="space-y-4">
                <ToggleItem label="New Placement Drives" description="Get notified when a company posts a new job." />
                <ToggleItem label="Application Updates" description="Notifications when your status changes (Shortlisted/Selected)." />
                <ToggleItem label="Deadline Reminders" description="Alerts for drives closing within 24 hours." />
              </div>
            </section>
          )}

         
          {activeTab === "privacy" && (
            <section className="animate-fadeIn space-y-6">
              <h3 className="text-xl font-bold text-slate-100">Profile Privacy</h3>
              <div className="space-y-4">
                <ToggleItem label="Visible to Recruiters" description="Allow companies to find your profile in searches." />
                <ToggleItem label="Show CGPA" description="Display your CGPA to recruiters (Admins can always see it)." />
                <div className="pt-6 border-t text-red-600 w-5/6">
                   <h4 className="font-bold text-sm md:text-md lg:text-lg">Danger Zone</h4>
                   <p className="text-sm md:text-md lg:text-lg text-slate-300 mb-4">Once you deactivate, you will not receive placement updates.</p>
                   <button className="border border-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition">Deactivate Account</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};


const ToggleItem = ({ label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="w-5/6">
      <p className="font-medium text-sm md:text-md lg:text-lg text-slate-200">{label}</p>
      <p className="text-sm md:text-md lg:text-lg text-slate-300">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" defaultChecked />
      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
    </label>
  </div>
);

export default Settings;