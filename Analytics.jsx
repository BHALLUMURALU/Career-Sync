import React, { useEffect, useMemo, useState } from "react";

import api from "../../utils/api";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement);

const AdminAnalytics = () => {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear-2;
  const maxYear = currentYear;
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [totalPlaced, setTotalPlaced] = useState(null);
  const [byBranch, setByBranch] = useState([]);
  const [byCompany, setByCompany] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("Overall");

  

  const fetchBranches = async () => {
    try {
      const res = await api.get(`/admin/branches`);
      setBranches(res.data); 
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };


  const fetchAnalytics = async (y, branchFilter) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/admin/analytics-complex`, {
        params: { year: y, branch: branchFilter },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Total: ",res.data.totalPlaced);
      console.log("By branch :",res.data.byBranch);
      console.log("By company :",res.data.byCompany );
      console.log("history:",res.data.history);
      setTotalPlaced(res.data.totalPlaced || 0);
      setByBranch(res.data.byBranch || []);
      setByCompany(res.data.byCompany || []);
      setHistoryData(res.data.history || []); 
    } catch (err) {
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchAnalytics(year, "Overall");
  }, []);

  
  const handleBranchChange = (branchName) => {
    setSelectedBranch(branchName);
    fetchAnalytics(year, branchName);
  };

  const generateChartData = (labels, dataValues, title) => ({
    labels,
    datasets: [
      {
        label: title,
        data: dataValues,
        backgroundColor: ["#0f172a", "#2563eb", "#10b981", "#ef4444", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"],
        hoverOffset: 10,
        borderWidth: 2,
      }
    ]
  });

  const branchChartData = useMemo(() => 
    generateChartData(byBranch.map(b => b.branch), byBranch.map(b => b.count), "Placed by Branch"),
    [byBranch]
  );

  const companyChartData = useMemo(() => 
    generateChartData(byCompany.map(c => c.company), byCompany.map(c => c.count), "Placed by Company"),
    [byCompany]
  );


  const historyChartData = useMemo(() => ({
    labels: historyData.map(h => h.year),
    datasets: [{
      label: `Placement Growth (${selectedBranch})`,
      data: historyData.map(h => h.count),
      backgroundColor: "#2563eb",
      borderRadius: 5,
    }]
  }), [historyData, selectedBranch]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnalytics(year, selectedBranch);
  };

  return (
    <div className="p-6 bg-slate-700 rounded-4xl min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">{selectedBranch} Analytics</h1>
          <p className="text-slate-500">Visualizing placement trends and comparisons</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="number"
            min={minYear}
            max={maxYear}
            className="w-32 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition">
            Update Year
          </button>
        </form>
      </div>

    
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        <button
          onClick={() => handleBranchChange("Overall")}
          className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${
            selectedBranch === "Overall" ? "bg-slate-600 text-white shadow-lg border border-slate-300" : "bg-slate-500 text-slate-100 "
          }`}
        >
          Overall College
        </button>
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => handleBranchChange(b.branch_name)}
            className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${
              selectedBranch === b.branch_name ? "bg-slate-600 text-white shadow-lg border border-slate-300" : "bg-slate-500 text-slate-100 border "
            }`}
          >
            {b.branch_name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500 font-medium">Retrieving placement data...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 space-y-5">
           
            <div className="bg-slate-100 p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Total Placed ({year})</h2>
              <p className="text-6xl font-black text-slate-700 mt-2">{totalPlaced ?? 0}</p>
            </div>

           
            <div className="lg:col-span-2 bg-slate-100 p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-700 mb-4">Last 3 Years Comparison</h3>
              <div className="h-96">
                <Bar data={historyChartData} options={{ maintainAspectRatio: false }} color='red'/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
            <div className="bg-slate-100 p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-700 mb-6">Branch-wise Distribution</h3>
              {byBranch.length > 0 ? (
                <div className="max-w-[300px] mx-auto"><Pie data={branchChartData} /></div>
              ) : (
                <p className="text-center py-10 text-slate-700">No branch data found</p>
              )}
            </div>

          
            <div className="bg-slate-100 p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-700 mb-6">Company-wise Distribution</h3>
              {byCompany.length > 0 ? (
                <div className="max-w-[350px] mx-auto"><Pie data={companyChartData} /></div>
              ) : (
                <p className="text-center py-10 text-slate-700">No company data found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAnalytics;

