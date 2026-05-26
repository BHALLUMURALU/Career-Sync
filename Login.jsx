import React, { useContext, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Authcontext } from "../context/Authcontext";

function Login() {
  const [formData, setformData] = useState({
    email: "",
    password: "",
  });

  const [forgotdata, setForgotdata] = useState({
    mail: "",
  });

  const [otp, setotp] = useState({
    otp: "",
  });

  const [otpverify, setotpverify] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);


  const handleGetOtp = async () => {
    if (!forgotdata.mail) {
      alert("Please enter your email address.");
      return;
    }

    setOtpLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotdata.mail });
      sentotp(true);
      alert("OTP sent to your Gmail inbox. Check spam if not visible.");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to send OTP.";
      alert(`Error: ${errorMsg}`);
    } finally {
      setOtpLoading(false);
    }
  };

  
  const handleOtpVerify = async (e) => {
    e.preventDefault();

    if (otp.otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    setVerifyLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email: forgotdata.mail,
        otp: otp.otp,
      });
      setotpverify(true);
      alert("OTP verified! You can now reset your password.");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Invalid or expired OTP.";
      alert(`Error: ${errorMsg}`);
    } finally {
      setVerifyLoading(false);
    }
  };

 
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotdata.mail,
        otp: otp.otp,
        newPassword,
      });
      setResetSuccess(true);
      alert("Password reset successful! Please login with your new password.");
     
      setForgot(false);
      sentotp(false);
      setotpverify(false);
      setotp({ otp: "" });
      setForgotdata({ mail: "" });
      setNewPassword("");
      setResetSuccess(false);
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to reset password.";
      alert(`Error: ${errorMsg}`);
    } finally {
      setResetLoading(false);
    }
  };

  const [getotp, sentotp] = useState(false);
  const { refreshUser } = useContext(Authcontext);
  const navigate = useNavigate();
  const [showPassword, setshowpassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  console.log(forgot);

  const fofgotSubmit = async (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", formData);
      const { token, email, role } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      await refreshUser();

      if (role === "admin") {
        navigate("/admin-dashboard/analytics");
      } else {
        navigate("/Student-dashboard");
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const errorMsg = err.response.data.msg || "An error occurred";

        if (status === 403) {
          alert(`Pending Approval: ${errorMsg}`);
        } else if (status === 400) {
          alert(`Invalid Credentials: ${errorMsg}`);
        } else {
          alert(`Server Error: ${errorMsg}`);
        }
      } else {
        alert("Network error. Please check if your backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-auto mb-20 ">
      <form
        onSubmit={handleSubmit}
        className="border border-slate-300 bg-transparent flex flex-col w-96 h-auto items-center rounded-xl p-8 shadow-2xl"
      >
       
      <h1 className="text-3xl text-slate-200 font-bold mb-8">Welcome Back</h1>
      {!forgot ? (
          <div className="w-full">
            <div className="w-full mb-4 flex flex-col items-start">
              <label className="text-sm font-semibold text-slate-300 ml-1">
                Email Address
              </label>
              <input
                className="border text-white border-slate-400 w-full h-11 rounded-lg pl-4 mt-1 focus:border-white outline-none transition-all"
                type="email"
                placeholder="name@college.edu"
                onChange={(e) =>
                  setformData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="w-full mb-6 flex flex-col items-start">
              <label className="text-sm font-semibold text-slate-300 ml-1">
                Password
              </label>
              <div className="relative w-full flex items-center">
                <input
                  className="border border-slate-400 text-white w-full pl-4 h-11 rounded-lg focus:border-white outline-none transition-all"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={(e) =>
                    setformData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setshowpassword(!showPassword)}
                  className="absolute right-3 text-xs font-bold text-slate-500 hover:text-slate-300 uppercase"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              
              <a
                className="text-blue-500 cursor-pointer"
                onClick={() => setForgot(true)}
              >
                Forgot my password
              </a>
            </div>
          </div>
        ) : (
          <div className="w-full">
            
            <div className="relative w-full mb-4 flex flex-col items-start">
              <label className="text-sm font-semibold text-slate-300 ml-1">
                Email Address
              </label>
              <input
                className="border text-white border-slate-400 w-full h-11 rounded-lg pl-4 mt-1 focus:border-white outline-none transition-all"
                type="email"
                placeholder="name@college.edu"
                onChange={(e) =>
                  setForgotdata({ ...forgotdata, mail: e.target.value })
                }
                disabled={getotp} // lock email once OTP is sent
                required
              />
              <button
                type="button"
                className={`absolute right-1 top-7 p-1.5 rounded transition-all ${
                  getotp
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                onClick={handleGetOtp} // ← wired up
                disabled={getotp || otpLoading}
              >
                {otpLoading ? "Sending..." : getotp ? "Sent ✓" : "Get OTP"}
              </button>
            </div>

           
            {getotp && (
              <div>
                <div className="relative w-full mb-4 flex flex-col items-start">
                  <label className="text-sm font-semibold text-slate-300 ml-1">
                    Enter OTP
                  </label>
                  <input
                    className="border text-white border-slate-400 w-full h-11 rounded-lg pl-4 mt-1 focus:border-white outline-none transition-all"
                    type="text"
                    placeholder="6-digit OTP"
                    maxLength={6}
                    onChange={(e) => setotp({ ...otp, otp: e.target.value })}
                    disabled={otpverify} // lock once verified
                    required
                  />
                  {getotp && otp.otp.length === 6 && !otpverify ? (
                    <button
                      type="button"
                      className="absolute right-1 top-7 p-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-all"
                      onClick={handleOtpVerify} // ← wired up
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? "Checking..." : "Verify"}
                    </button>
                  ) : otpverify ? (
                    <span className="absolute right-1 top-8 p-1.5 text-green-400 text-xs font-bold">
                      Verified ✓
                    </span>
                  ) : null}
                </div>

                
                {otpverify && (
                  <div className="relative w-full mb-4 flex flex-col items-start">
                    <label className="text-sm font-semibold text-slate-300 ml-1">
                      New Password
                    </label>
                    <input
                      className="border text-white border-slate-400 w-full h-11 rounded-lg pl-4 mt-1 focus:border-white outline-none transition-all"
                      type="password"
                      placeholder="Min. 6 characters"
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="mt-2 w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
                      onClick={handleResetPassword} 
                      disabled={resetLoading}
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                )}
              </div>
            )}
            <a
              className="text-blue-500 cursor-pointer text-sm"
              onClick={() => {
                setForgot(false);
                sentotp(false);
                setotpverify(false);
                setotp({ otp: "" });
                setForgotdata({ mail: "" });
                setNewPassword("");
              }}
            >
              ← Back to Login
              ← Back to Login
            </a>
            
          </div>
        )}

        <button
          type="submit"
          disabled={loading || forgot}
          className={`w-full h-12 font-bold rounded-lg mt-2 shadow-lg transition-all ${
            loading || forgot
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
          }`}
        >
          {loading ? "Verifying..." : "Login to Account"}
        </button>

        
      <p className="mt-6 text-sm text-slate-300">
        Don't have an account?{" "}
        <span
          className="text-white font-bold cursor-pointer underline"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </span>
      </p>
    </form>
  </div>)
}
export default Login;
