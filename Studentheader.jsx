import React,{ useState,useEffect , useContext } from 'react';
import { Authcontext } from '../context/Authcontext';
import profile from '../pngs/profile.png'

function Studentheader() {
    const {user,logout} = useContext(Authcontext);
    const email = localStorage.getItem('email');
    const name = email.split('@')[0];
    const display = name.charAt(0).toUpperCase()+name.slice(1);
  
  return (
   
      <header className='fixed w-full h-20 bg-slate-800 text-slate-300 flex flex-row items-center gap-3 shadow-xl z-50'>
      <h1 className="flex-1/3 text-xl md:text-2xl lg:text-4xl font-bold ml-10 text-slate-50">Career Sync.</h1>
      <h3 className='text-xs md:text-sm lg:text-xl' >Hello, {user?.full_name ||display}</h3>
      <img src={user?.profile_picture || profile} alt="pro" className='w-16 h-16 object-cover rounded-full  mr-6'/>
      <button className='font-bold mr-10  border shadow px-5 py-1 rounded' onClick={logout}>Logout</button>
      </header>
      
  )
}

export default Studentheader;