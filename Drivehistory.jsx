import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
const Drivehistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState([]); 

  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 bg-slate-700">
      <h2 className="text-2xl font-bold mb-4">Your Application Analytics</h2>
      
     
      <div className="bg-white p-4 rounded-xl shadow mb-8 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={stats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {stats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

     
      <table className="w-full text-left bg-white rounded-xl overflow-hidden shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-4">Company</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map(item => (
            <tr key={item.id} className="border-t">
              <td className="p-4">{item.company_name}</td>
              <td className={`p-4 font-bold ${item.status === 'Selected' ? 'text-green-500' : 'text-orange-500'}`}>
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Drivehistory;