import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Studentheader from './Studentheader';
import Footer from "./Footer";
const Layout=()=>{
    return(
        <div className="flex flex-col ">
            <Studentheader/>
            <div className=" flex flex-1 mt-20 ">
                <Sidebar/>
            <main className="flex-1 w-5/6">
                <Outlet/>
            </main>
            </div>
            <Footer/>
        </div>
    );
};
export default Layout;