import { useParams } from "react-router-dom";
import { useState, useEffect,useCallback } from "react";
import axios from "axios";
import { 
  Github, Linkedin, Mail, Phone, Calendar, 
  User, BookOpen, Award, Briefcase, FileText, 
  ExternalLink, Download, Hash, Globe, GraduationCap, Copy, Check
} from "lucide-react";

const PortfolioView = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const BASE_URL = "http://localhost:5000";
  const getUrl = useCallback((path) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, '/');
    return `${BASE_URL}/${cleanPath}`;
  }, []);
  useEffect(() => {
    axios.get(`http://localhost:5000/api/public/portfolio/${slug}`)
      .then(res => {
        const fetchedData = res.data;
        
        // Helper to construct the full URL
        // const getUrl = (path) => `http://localhost:5000/${path.replace(/\\/g, '/')}`;
  
        // Check if resume array exists and has at least one item
        const resumeUrl = (fetchedData.resume && fetchedData.resume.length > 0) 
          ? getUrl(fetchedData.resume[0].file_path) 
          : null;
  
        setData({
          ...fetchedData,
          resume_url: resumeUrl
        });
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError(true);
      });
  }, [slug]);
  
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return (
    <div className="bg-white min-h-screen text-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black mb-4 text-indigo-600">404</h1>
        <p className="text-xl font-bold uppercase tracking-widest">Portfolio Not Found</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center italic font-black text-indigo-600 animate-pulse">
      LOADING PROFILE...
    </div>
  );
  console.log("Portfolio : ", data);
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans pb-20">
      
      
      <header className="bg-white border-b border-slate-200 pt-16 pb-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-30">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {data.profile_picture && (
              <div className="relative z-10">
                <img 
                  src={`http://localhost:5000/${data.profile_picture.replace('\\', '/')}`} 
                  alt={data.full_name} 
                  className="w-48 h-48 md:w-52 md:h-52 rounded-[2.5rem] object-cover border-8 border-white shadow-2xl"
                />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{data.full_name}</h1>
              <p className="mt-4 flex items-center justify-center md:justify-start gap-2 text-indigo-600 font-black uppercase tracking-widest text-sm">
                <GraduationCap size={20} /> {data.course} {data.branch ? `in ${data.branch}` : ''}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                {data.linkedin && <a href={data.linkedin} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-50"><Linkedin size={18}/></a>}
                {data.github && <a href={data.github} className="p-3 bg-slate-100 rounded-xl hover:bg-slate-900 hover:text-white"><Github size={18}/></a>}
                <button onClick={copyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest">
                  {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                  {copied ? "Link Copied" : "Copy Profile"}
                </button>
              </div>
            </div>
            {data.resume && (
              <a href={data.resume_url} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest flex items-center gap-2">
                <Download size={18} /> RESUME
              </a>
            )}
          </div>
        </div>
      </header>

     
      <main className="max-w-4xl mx-auto mt-16 space-y-12">
        
       
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Contact Details</h2>
              <div className="space-y-3">
                {data.college_email && <p className="text-xs md:text-md lg:text-lg font-bold flex items-center gap-2 text-slate-600"><Mail size={14}/> {data.college_email}</p>}
                {data.phone_number && <p className="text-xs md:text-md lg:text-lg font-bold flex items-center gap-2 text-slate-600"><Phone size={14}/> {data.phone_number}</p>}
                {data.roll_number && <p className="text-xs md:text-md lg:text-lg font-bold flex items-center gap-2 text-slate-600"><Hash size={14}/> {data.roll_number}</p>}
              </div>
            </div>
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-12">
               <h2 className="text-xs md:text-md lg:text-lg font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Academic Metrics</h2>
               <div className="flex flex-wrap gap-6">
                 {data.cgpa && (
                   <div>
                     <span className="block text-4xl font-black text-slate-900 italic leading-none">{data.cgpa}</span>
                     <span className="text-xs md:text-md lg:text-lg font-black uppercase text-slate-400 tracking-widest">Current CGPA</span>
                   </div>
                 )}
                 {data.backlogs !== null && (
                   <div>
                     <span className={`block text-4xl font-black italic leading-none ${data.backlogs > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{data.backlogs}</span>
                     <span className="text-xs md:text-md lg:text-lg font-black uppercase text-slate-400 tracking-widest">Active Backlogs</span>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </section>

        
        {data.skills && data.skills.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
              Core Skills <div className="h-px flex-1 bg-slate-200"></div>
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.skills.map((s, idx) => (
                <span key={idx} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs md:text-md lg:text-lg font-black text-slate-700 shadow-sm">
                  {s.skill_name}
                </span>
              ))}
            </div>
          </section>
        )}

      
        {data.internships && data.internships.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
              Professional Experience <div className="h-px flex-1 bg-slate-200"></div>
            </h2>
            {data.internships.map((intern, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase italic leading-tight">{intern.role}</h3>
                    <p className="text-indigo-600 font-bold uppercase tracking-widest mt-1 text-xs md:text-md lg:text-lg">{intern.company_name}</p>
                  </div>
                </div>
                <p className="text-slate-500 text-lg md:text-md lg:text-lg leading-relaxed max-w-3xl">{intern.description}</p>
              </div>
            ))}
          </section>
        )}

       
        {data.projects && data.projects.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
              Projects <div className="h-px flex-1 bg-slate-200"></div>
            </h2>
            <div className="space-y-6">
              {data.projects.map((p, idx) => (
                <div key={idx} className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl group">
                  <h3 className="text-2xl font-black uppercase italic mb-4 group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                  <p className="text-slate-400 text-md md:text-md lg:text-lgleading-relaxed mb-8 max-w-2xl">{p.description}</p>
                  {p.tech_stack && (
                    <div className="flex flex-wrap gap-2 pt-6 border-t border-white/10">
                      {p.tech_stack.split(',').map((tech, i) => (
                        <span key={i} className="text-xs md:text-md lg:text-lg px-3 py-1 bg-white/10 rounded-full font-bold uppercase tracking-tighter">{tech.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

       
        {data.certification && data.certification.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xs md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
              Certifications <div className="h-px flex-1 bg-slate-200"></div>
            </h2>
            <div className="space-y-4">
              {data.certification.map((p, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hidden md:block">
                      <Award size={28}/>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase italic leading-none">{p.title}</h3>
                      <p className="text-slate-400 text-xs md:text-md lg:text-lg font-bold mt-2 uppercase tracking-widest">{p.issuing_organization}</p>
                    </div>
                  </div>
                  <ExternalLink size={20} className="text-slate-300"/>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <footer className="mt-32 text-center py-12 border-t border-slate-200">
        <p className="text-xs md:text-md lg:text-lg font-black text-slate-400 uppercase tracking-[0.8em]">Student Portfolio from SITAM</p>
      </footer>
    </div>
  );
};

export default PortfolioView;