
import React, { useContext } from 'react'
import {Navigate} from 'react-router-dom'
import { Authcontext } from '../context/Authcontext'

const ProtectedRoute = ({children}) => {
   const {user , loading}= useContext(Authcontext);
   // console.log("hello",user);

   const token = localStorage.getItem('token');
   if(loading) return <div>Loading Session ...</div>
   if(!token) return <Navigate to="/" replace/>

   return children;
}
export default ProtectedRoute;

