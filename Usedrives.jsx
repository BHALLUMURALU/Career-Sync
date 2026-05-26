import { useState, useEffect, useMemo, useCallback } from 'react';
import api from "../../utils/api";

export function Usedrives(year) {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDrives = useCallback(async () => {
    if (!year) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Ensure the config matches your auth middleware expectations
      const config = { 
        headers: { Authorization: `Bearer ${token}` } 
      };

      
      const res = await api.get(`/admin/drives?year=${year}`, config);
      console.log("Fetched Drives:", res.data);
      setDrives(res.data || []);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        console.warn("Unauthorized: Check token or Admin status");
      }
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  
  const filteredDrives = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return drives.filter(drive => 
      drive.name?.toLowerCase().includes(query) ||
      drive.roles?.some(role => role.role_title?.toLowerCase().includes(query))
    );
  }, [drives, searchQuery]);

 
  const stats = useMemo(() => {
    const total = drives.length;
    const live = drives.filter(d => d.status === 'Live').length;
    
   
    const totalPackageValue = drives.reduce((acc, d) => {
      const pkgString = d.roles?.[0]?.salary_package || "0";
     
      const numericValue = parseFloat(pkgString.replace(/[^0-9.]/g, '')) || 0;
      return acc + numericValue;
    }, 0);

    return {
      total,
      live,
      avgPackage: total > 0 ? (totalPackageValue / total).toFixed(2) : "0.00"
    };
  }, [drives]);


  const deleteDrive = async (id) => {
    
    
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/drives/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrives(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data || "Server Error"));
    }
  };

  return { 
    filteredDrives, 
    loading, 
    stats, 
    searchQuery, 
    setSearchQuery, 
    deleteDrive, 
    refresh: fetchDrives 
  };
}