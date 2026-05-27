import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../features/authSlice.js";
import logo from "../assets/UNICEF Logo 2.png";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dataEntryDropdownOpen, setDataEntryDropdownOpen] = useState(false);
  const [solarIotDropdownOpen, setSolarIotDropdownOpen] = useState(false); // New state for Solar & IoT dropdown
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isHomePage = location.pathname === "/";

  const { user, loading, loggingOut, accessToken } = useSelector((state) => state.auth);

  // Auto-hide header on scroll (only on homepage)
  useEffect(() => {
    if (!isHomePage) {
      setHeaderVisible(true);
      setScrolled(false);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 80);
          
          if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
            setHeaderVisible(false); // scrolling down
          } else {
            setHeaderVisible(true); // scrolling up
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Also listen on the snap container
    const snapContainer = document.querySelector('.snap-container');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', () => {
        const currentScrollY = snapContainer.scrollTop;
        setScrolled(currentScrollY > 80);
        if (currentScrollY > lastScrollY.current && currentScrollY > 200) {
          setHeaderVisible(false);
        } else {
          setHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }, { passive: true });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setMenuOpen(false);
    navigate("/login");
  };

  const navLinkBase =
    "transition-colors duration-200 hover:text-[#7dd3fc] text-sm md:text-base font-medium";
  const navLinkActive = "text-[#7dd3fc]";
  const navLinkInactive = "text-white";

  const renderAuthControl = (mobile = false) => {
    const commonClass = mobile
      ? "w-full rounded-md bg-[#1f4959] px-5 py-2.5 text-center text-white transition-colors duration-200 hover:bg-[#4a646f] disabled:opacity-50"
      : "rounded-md bg-[#1f4959] px-5 py-2 text-white transition-colors duration-200 hover:bg-[#4a646f] disabled:opacity-50";

    if (loggingOut) {
      return <span className={`${mobile ? "block w-full" : ""} text-white/70`}>Logging out...</span>;
    }

    if (user) {
      return (
        <button onClick={handleLogout} disabled={loggingOut} className={commonClass}>
          Logout
        </button>
      );
    }

    if (accessToken && loading) {
      return <span className={`${mobile ? "block w-full" : ""} text-white/70`}>Loading...</span>;
    }

    return (
      <NavLink to="/login" onClick={() => setMenuOpen(false)} className={commonClass}>
        Login
      </NavLink>
    );
  };

  // Toggle handlers
  const toggleDataEntryDropdown = (e) => {
    e.stopPropagation();
    setSolarIotDropdownOpen(false); // Close other dropdown
    setDataEntryDropdownOpen((prev) => !prev);
  };

  const toggleSolarIotDropdown = (e) => {
    e.stopPropagation();
    setDataEntryDropdownOpen(false); // Close other dropdown
    setSolarIotDropdownOpen((prev) => !prev);
  };

  // Close dropdowns when navigating away
  const handleDropdownItemClick = () => {
    setDataEntryDropdownOpen(false);
    setSolarIotDropdownOpen(false);
    setMenuOpen(false);
  };

  const headerClasses = isHomePage
    ? `fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-out ${
        headerVisible ? 'translate-y-0' : '-translate-y-full'
      } bg-gradient-to-b from-black/20 to-transparent backdrop-blur-[0.25px]`
    : 'sticky top-0 z-50 border-b border-white/10 bg-[#011425] text-white shadow-md';

  return (
    <header className={headerClasses}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center">
          <img
            src={logo}
            alt="UNICEF Logo"
            className="h-8 w-auto max-w-45 object-contain sm:max-w-45 md:h-9 md:max-w-45"
          />
        </div>

        <ul className="hidden items-center gap-6 lg:gap-8 md:flex">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              HOME
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              DASHBOARD
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ghg-map"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              GHG MAP
            </NavLink>
          </li>

          {/* SOLAR & IOT Dropdown */}
          <li className="relative">
            <button
              onClick={toggleSolarIotDropdown}
              className={`${navLinkBase} ${navLinkInactive} flex items-center gap-1`}
            >
              SOLAR & IOT
              <svg
                className={`h-4 w-4 transition-transform ${solarIotDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {solarIotDropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <NavLink
                    to="/iot-monitor"
                    onClick={handleDropdownItemClick}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    IoT Monitor
                  </NavLink>
                  <NavLink
                    to="/solar-forecast"
                    onClick={handleDropdownItemClick}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Solar Forecast
                  </NavLink>
                </div>
              </div>
            )}
          </li>

          {/* DATA ENTRY Dropdown – visible for non-viewer users */}
          {user && user.role !== "viewer" && (
            <li className="relative">
              <button
                onClick={toggleDataEntryDropdown}
                className={`${navLinkBase} ${navLinkInactive} flex items-center gap-1`}
              >
                DATA ENTRY
                <svg
                  className={`h-4 w-4 transition-transform ${dataEntryDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dataEntryDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <NavLink
                      to="/data-entry"
                      onClick={handleDropdownItemClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Centre Data Entry
                    </NavLink>
                    <NavLink
                      to="/glimpse-entry"
                      onClick={handleDropdownItemClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Glimpse Data Entry
                    </NavLink>
                    <NavLink
                      to="/update-centre"
                      onClick={handleDropdownItemClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Update Centre Details
                    </NavLink>
                  </div>
                </div>
              )}
            </li>
          )}

          {/* GLIMPSES – View only gallery (visible to all logged in users) */}
          <li>
            <NavLink
              to="/glimpses"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              GLIMPSE
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
              }
            >
              ABOUT US
            </NavLink>
          </li>

          {user?.role === "admin" && (
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`
                }
              >
                ADMIN
              </NavLink>
            </li>
          )}
        </ul>

        <div className="hidden md:flex md:items-center">{renderAuthControl(false)}</div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-white transition hover:bg-white/10 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#011425] px-4 py-4 md:hidden sm:px-6">
          <ul className="flex flex-col gap-4 text-sm font-medium">
            <li>
              <NavLink
                to="/"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-2 transition-colors duration-200 ${
                    isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                  }`
                }
              >
                HOME
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-2 transition-colors duration-200 ${
                    isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                  }`
                }
              >
                DASHBOARD
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/ghg-map"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-2 transition-colors duration-200 ${
                    isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                  }`
                }
              >
                GHG MAP
              </NavLink>
            </li>

            {/* Mobile collapsible for SOLAR & IOT */}
            <li>
              <button
                onClick={() => setSolarIotDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-white hover:bg-white/5 transition-colors"
              >
                <span>SOLAR & IOT</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${solarIotDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {solarIotDropdownOpen && (
                <div className="mt-2 ml-3 flex flex-col gap-1 border-l-2 border-white/20 pl-3">
                  <NavLink
                    to="/iot-monitor"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                  >
                    IoT Monitor
                  </NavLink>
                  <NavLink
                    to="/solar-forecast"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                  >
                    Solar Forecast
                  </NavLink>
                </div>
              )}
            </li>

            {/* Mobile collapsible for DATA ENTRY */}
            {user && user.role !== "viewer" && (
              <li>
                <button
                  onClick={() => setDataEntryDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-white hover:bg-white/5 transition-colors"
                >
                  <span>DATA ENTRY</span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${dataEntryDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dataEntryDropdownOpen && (
                  <div className="mt-2 ml-3 flex flex-col gap-1 border-l-2 border-white/20 pl-3">
                    <NavLink
                      to="/data-entry"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      Centre Data Entry
                    </NavLink>
                    <NavLink
                      to="/glimpse-entry"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      Glimpse Data Entry
                    </NavLink>
                    <NavLink
                      to="/update-centre"
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                    >
                      Update Centre Details
                    </NavLink>
                  </div>
                )}
              </li>
            )}

            <li>
              <NavLink
                to="/glimpses"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-2 transition-colors duration-200 ${
                    isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                  }`
                }
              >
                GLIMPSES
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/about"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-2 py-2 transition-colors duration-200 ${
                    isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                  }`
                }
              >
                ABOUT US
              </NavLink>
            </li>

            {user?.role === "admin" && (
              <li>
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-2 py-2 transition-colors duration-200 ${
                      isActive ? "bg-white/10 text-[#7dd3fc]" : "text-white hover:bg-white/5"
                    }`
                  }
                >
                  ADMIN
                </NavLink>
              </li>
            )}
          </ul>

          <div className="mt-4 border-t border-white/10 pt-4">{renderAuthControl(true)}</div>
        </div>
      )}
    </header>
  );
}

export default Header;