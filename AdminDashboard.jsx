import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Header from "../../components/Studentheader"; // Reuse your existing Header
import Footer from '../../components/Footer';
const AdminDashboard = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Analytics Dashboard", path: "/admin-dashboard/analytics" },
   
    { name: "Post Placement Drive", path: "/admin-dashboard/post-drive" },
    { name: "Student Approvals", path: "/admin-dashboard/approvals" },
    { name: "Manage Applications", path: "/admin-dashboard/manage-apps" },
    { name: "Profile", path:'/admin-dashboard/prfoile'}
    
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-700">
      <Header/>
      <div className="flex flex-1 overflow-hidden">
        
        <aside className="w-1/6 bg-slate-800 text-white flex flex-col shadow-xl mt-20">
         
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-lg font-medium transition  ${
                  location.pathname === item.path
                    ? "bg-slate-800 text-white shadow-lg text-lg "
                    : " hover:bg-slate-700  hover:text-white text-lg "
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-5 mt-22 ml-5  overflow-y-auto">
          <div className="w-full ">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer/>
    </div>
  );
};
export default AdminDashboard;