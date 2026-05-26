import React from "react";
import Footer from "../components/Footer";
import { useRef,useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
const Dashboard = () => {
  
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

 
  const signupRef = useRef(null);
  const loginRef = useRef(null);

  const handleShowSignup = () => {
    setShowSignup(true);
    setShowLogin(false); 
   
    setTimeout(() => {
      signupRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  const handleShowLogin = () => {
    setShowLogin(true);
    setShowSignup(false); 
    setTimeout(() => {
      loginRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };
  return (
    <div className="min-h-screen shadow-2xl bg-slate-500 font-sans text-gray-900 flex flex-col ">
      <header className="fixed w-full h-20 flex flex-row gap-5 items-center bg-gray-700">
        <h1 className="flex-1/2 text-xl md:text-2xl lg:text-3xl font-bold ml-10 text-white">Career Sync.</h1>
        <button
          onClick={handleShowSignup}
          className="bg-white text-slate-900 px-9 py-3 rounded-full font-bold hover:bg-gray-100 transition-transform duration-1000 shadow-lg "
        >
          Get Started
        </button>
        <button
          onClick={handleShowLogin}
          className="mr-10 border-2 border-slate-300 text-slate-300 px-9 py-2 rounded-full font-bold hover:bg-white hover:text-slate-800 transition"
        >
          Login
        </button>
      </header>

      <section className="mt-20 flex-1/3  bg-gradient-to-b  from-slate-900 to-slate-600 py-20 px-6 text-center text-white ">
        <h1 className="text-5xl font-extrabold mb-4 text-slate-50">Career Sync.</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          The ultimate platform connecting ambitious students with world-class
          recruiters.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleShowSignup}
            className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-transform duration-1000 shadow-lg "
          >
            Get Started
          </button>
          <button
            onClick={handleShowLogin}
            className="border-2  border-slate-300 text-slate-300 px-8 py-3 rounded-full font-bold hover:bg-white hover:text-slate-800 transition"
          >
            Login
          </button>
        </div>

        {showSignup && (
        <div ref={signupRef} className=" mt-0  flex items-center justify-center">
          <div className="relative mt-32">
           
             <button onClick={() => setShowSignup(false)} className="absolute -top-10 right-0 text-slate-300 font-bold">✕</button>
             <Signup />
          </div>
        </div>
      )}

      
      {showLogin && (
        <div ref={loginRef} className=" mt-0  flex items-center justify-center">
          <div className="relative mt-32">
             <button onClick={() => setShowLogin(false)} className="absolute -top-10 right-0 text-slate-200 font-bold">✕</button>
             <Login />
          </div>
        </div>
      )}
      </section>
     
   
      <section className="py-16 px-6 max-w-6xl mx-auto ">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose Career Sync?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-slate-400 rounded-xl shadow-sm border border-slate-200">
           
            <h3 className="text-xl font-bold mb-2">Fast Applications</h3>
            <p className="text-black">
              Apply to top-tier companies in seconds with your pre-filled
              academic profile.
            </p>
          </div>
          <div className="p-6 bg-slate-400 rounded-xl shadow-sm border border-slate-400">
            
            <h3 className="text-xl font-bold mb-2">Smart Tracking</h3>
            <p className="text-black">
              Admins can track application statuses and export placement reports
              easily.
            </p>
          </div>
          <div className="p-6 bg-slate-400 rounded-xl shadow-sm border border-slate-400">
           
            <h3 className="text-xl font-bold mb-2">Verified Profiles</h3>
            <p className="text-black">
              Only TPO-approved students can apply, ensuring high-quality talent
              for companies.
            </p>
          </div>
        </div>
      </section>

    
      <Footer />
    </div>
  );
};

export default Dashboard;
