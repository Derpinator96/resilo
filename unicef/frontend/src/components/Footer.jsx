import React from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector } from "react-redux";
import unicefLogo from '../assets/logo-unicef.png'
import nitrLogo from '../assets/NITRR Logo.png'

function Footer() {
    const { user } = useSelector((state) => state.auth);
    
    return (
        <footer className="bg-[#011425] text-[#ffffff] h-full flex flex-col justify-end">
            <nav className="max-w-6xl mx-auto py-6 space-y-4 w-full">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Logos */}
                    <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                            <img
                                src={unicefLogo}
                                alt="UNICEF Logo"
                                className="h-25 w-auto object-contain"
                            />
                            <img
                                src={nitrLogo}
                                alt="NITRR Logo"
                                className="h-25 w-auto object-contain"
                            />
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h2 className="text-xl font-semibold mb-2">
                            Resources
                        </h2>
                        <ul className="columns-3 text-base space-y-1">
                            <li><NavLink to="/" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Home</NavLink></li>
                            <li><NavLink to="/dashboard" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Dashboard</NavLink></li>
                            <li><NavLink to="/ghg-map" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">GHG Map</NavLink></li>
                            <li><NavLink to="/iot-monitor" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">IOT Monitor</NavLink></li>
                            <li><NavLink to="/solar-forecast" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Solar Forecast</NavLink></li>
                            {user && user.role !== "viewer" && (
                                <>
                                    <li><NavLink to="/data-entry" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Centre Data Entry</NavLink></li>
                                    <li><NavLink to="/glimpse-entry" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Glimpse Data Entry</NavLink></li>
                                    <li><NavLink to="/update-centre" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Update Centre Details</NavLink></li>
                                </>
                            )}
                            <li><NavLink to="/glimpses" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Glimpse</NavLink></li>
                            <li><NavLink to="/about" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">About Us</NavLink></li>
                            {user?.role === "admin" && (
                                <li><NavLink to="/admin" className="text-[#ffffff] hover:text-[#5c7c89] transition-colors duration-200">Admin</NavLink></li>
                            )}
                        </ul>
                    </div>

                    {/* Credits */}
                    <div className="text-base md:text-right space-y-3">
                        <h2 className="text-lg font-semibold">
                            Principle Investigator : Dr. S Ghosh
                        </h2>
                        <h2 className="text-lg font-semibold">
                            Made by Kalyan &amp; Debanjan
                        </h2>
                    </div>
                </div>

                <div className="border-t border-[#5c7c89]/40 pt-2 text-center">
                    <p className="text-sm text-[#5c7c89]">
                        © {new Date().getFullYear()} All rights reserved.
                    </p>
                </div>
            </nav>
        </footer>
    )
}

export default Footer