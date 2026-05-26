import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';

export const Authcontext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = "http://localhost:5000";

 
  const getUrl = useCallback((path) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, '/');
    return `${BASE_URL}/${cleanPath}`;
  }, []);


  const getFileName = useCallback((path) => {
    if (!path) return "No file uploaded";
  
    return path.replace(/\\/g, '/').split('/').pop();
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    setUser(null);
    window.location.replace("/");
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
  
    try {
      const profileEndpoint = storedRole === 'admin' 
        ? '/admin/profile/me' 
        : '/profile/full-details';

     
      const res = await api.get(profileEndpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // console.log("Auth Data Received:", res.data);
      
      if (res.data) {
       
        const profile_picture = getUrl(res.data.profile_picture);
        
        
        const resumeData = res.data.resume;
        const resumeUrl = resumeData && resumeData.file_path 
          ? getUrl(resumeData.file_path) 
          : null;

        setUser({
          ...res.data,
          role: storedRole,
          profile_picture,
          resume_url: resumeUrl, 
          resume_name: getFileName(res.data.resume?.file_path),
          isProfileComplete: !!res.data.student_id 
        });

      } else {
        
        setUser({ role: storedRole, isProfileComplete: false });
      }
    } catch (err) {
      console.error("Auth Context Error:", err.response?.data || err.message);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <Authcontext.Provider value={{ user, setUser, refreshUser, loading, logout, getUrl }}>
      {children}
    </Authcontext.Provider>
  );
};