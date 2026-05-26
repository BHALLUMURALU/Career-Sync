import React from 'react'
import { Link ,useLocation} from 'react-router-dom';

function Sidebar() {
    const location = useLocation();
    const menu =[
     
      {name:'View Placement Drives',path:'/Student-dashboard'},
      
      {name:'Profile',path:'/Profile'},
      {name : 'Settings', path:'/settings'}
    ]
  return (
    
        <aside className=' w-1/6 bg-slate-800 align-middle  h-auto flex flex-col gap-0'>
         {
          menu.map((item)=>(
            <Link
               key={item.name}
               to={item.path}
  
               className={`flex items-center gap-4 p-3 rounded-lg mb-2 transition-colors ${
                location.pathname=== item.path ? 'bg-slate-800 text-white text-lg shadow-2xl ':'text-white  hover:bg-slate-700 text-lg   '
               }`}
            >
              <span className='font-medium '>{item.name}</span>
            </Link>
          ))
         }
          </aside> 
    
  )
}

export default Sidebar