import React from "react";
import {useParams, BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Profile from "./pages/Student/Profile";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import Dashboard from "./pages/Dashboard";
// import Drivehistory from "./pages/Student/Drivehistory";
import Viewplacements from "./pages/Student/Viewplacements";
// import Chatbot from "./pages/Student/Chatbot";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/Authcontext";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./pages/Student/Settings";
import Analytics from "./pages/Admin/Analytics";
import Postdrive from "./pages/Admin/Postdrive";
import Studentapprovals from "./pages/Admin/Studentapprovals";
import AppManaging from "./pages/Admin/AppManaging";
import AdminProfile from "./pages/Admin/AdminProfile";
import PendingDrives from "./pages/Admin/PendingDrives";
import PortfolioView from "./components/PortfolioView";
import ResumeUpload from "./components/ResumeUpload";
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
                <Route  element={<ProtectedRoute><AdminDashboard /></ProtectedRoute> } >
                <Route path="/admin-dashboard/analytics" element={<ProtectedRoute><Analytics/></ProtectedRoute>}/>
                <Route path='/admin/pending-drives'element={<PendingDrives/>}/>
                <Route path="/admin-dashboard/post-drive" element={<ProtectedRoute><Postdrive/></ProtectedRoute>} />
                <Route path="/admin-dashboard/approvals" element={<ProtectedRoute><Studentapprovals/></ProtectedRoute>}/>
                <Route path="/admin-dashboard/manage-apps" element={<ProtectedRoute><AppManaging/></ProtectedRoute>}/> 
                <Route path="/admin-dashboard/prfoile"  element={<AdminProfile/>}/>
          </Route>
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/Student-dashboard" element={<Viewplacements />} />
                {/* <Route path="/Drivehistory" element={<Drivehistory />} /> */}
                {/* <Route path="/Chatbot" element={<Chatbot />} /> */}
                <Route path="/Profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>
                <Route path="/settings" element={<Settings />} />
          </Route> 
          <Route path="/portfolio/:slug" element={<PortfolioView />} />
          <Route path="/resume" element={<ResumeUpload/>}/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
