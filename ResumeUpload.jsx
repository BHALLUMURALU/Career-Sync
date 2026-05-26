import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Loader2, FileCheck, AlertCircle } from 'lucide-react';

const ResumeUpload = ({ onDataParsed }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // Validation: Ensure it is a PDF
    if (selectedFile && selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const uploadAndParse = async () => {
    if (!file) return;

    // STEP 1: Wrap file in FormData
    const formData = new FormData();
    formData.append("resume", file); 

    try {
      setLoading(true);
      setError(null);

      
      const response = await axios.post("http://localhost:5000/api/resume/parse", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });


      const parsedResult = response.data.data || response.data.extractedText;
      if(parsedResult){
        onDataParsed(parsedResult);
        alert("AI Parsing Complete! Review your details.");
      }

      
    } catch (err) {
      setError("AI failed to read this resume. Please try a clearer PDF.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-[2rem] border-2 border-blue-400 shadow-blue-300 shadow-2xl text-center">
      <input 
        type="file" 
        id="resumeInput" 
        hidden 
        accept=".pdf" 
        onChange={handleFileChange} 
      />
      
      <label htmlFor="resumeInput" className="cursor-pointer flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-500 text-slate-100 rounded-2xl flex items-center justify-center mb-4">
          {loading ? <Loader2 className="animate-spin" /> : <Upload />}
        </div>
        <h3 className="font-black text-slate-100 uppercase italic">
          {file ? file.name : "Upload Resume (PDF)"}
        </h3>
        <p className="text-xs md:text-md lg:text-lg text-slate-100 mt-1 uppercase tracking-widest font-bold">
          AI will automatically fill your profile
        </p>
      </label>

      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-rose-500 text-xs font-bold uppercase">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {file && !loading && (
        <button 
          onClick={uploadAndParse}
          className="mt-6 w-full py-4 bg-slate-800 text-blue-400 rounded-2xl font-black text-xs tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-slate-500"
        >
          START AI EXTRACTION
        </button>
      )}
    </div>
  );
};

export default ResumeUpload;