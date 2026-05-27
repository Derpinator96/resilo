import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/authSlice.js"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import unicefLogo from '../assets/logo-unicef.png'
import nitrLogo from '../assets/NITRR Logo.png'
import login from '../assets/login 1.jpeg'

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const resultAction = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(resultAction)) {
        navigate("/");
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={login}
          alt="Login"
          className="h-full w-full object-cover brightness-65"
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="hidden text-white lg:block">
            <div className=" flex items-center gap-6">
              <img
                src={unicefLogo}
                alt="UNICEF Logo"
                className="h-50 w-50 object-contain"
              />

              <div className="h-14 w-px bg-white/50" />

              <img
                src={nitrLogo}
                alt="NITRR Logo"
                className="h-30 w-30 object-contain"
              />
            </div>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-wide">
              WELCOME TO SOLAR ENERGY AUDIT DASHBOARD
            </h1>

            <p className="mt-6 max-w-xl text-xl font-medium text-white/95">
              Monitoring Energy Across Government Health Facilities Across Chhattisgarh
            </p>

            <p className="mt-2 text-lg text-white/95">
              Connecting Health And Clean Energy
            </p>
          </div>


          <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl">
            <h1 className="mb-4 text-4xl font-serif text-center">Login</h1>
            <p className="text-serif font-sm text-white/95 text-center">
              Please enter your credentials to access the dashboard
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-4 block text-sm font-medium text-white/90"
                >
                  Username:
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  placeholder="Enter Username"
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-md transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-4 block text-sm font-medium text-white/90"
                >
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  placeholder="Enter Password"
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none backdrop-blur-md transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40"
                />

                <label className="text-sm text-white/90 ">
                    <input
                        type="checkbox"
                        name="remember"
                        className="mt-6 bg-blue-400 h-auto"
                        checked={formData.remember}
                        onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                    />
                Remember Me
                </label>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 mb-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {error && (
              <p className="mt-4 text-sm font-medium text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;