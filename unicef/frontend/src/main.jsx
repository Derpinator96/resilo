// src/main.jsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { store } from './stores/store.js';
import { getCurrentUser } from './features/authSlice.js';

import AuthLayout from './layouts/AuthLayout.jsx';
import LoginLayout from './layouts/LoginLayout.jsx';
import './index.css';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DataEntry from './pages/DataEntry.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GhgReductionMap from "./pages/GhgReductionMap";
import AboutPage from "./pages/AboutPage.jsx";
import Glimpses from './pages/Glimpses.jsx';
import IoTMonitor from './pages/IoTMonitor.jsx';
import GlimpseDataEntry from './pages/GlimpseDataEntry.jsx';
import UpdateCentre from './pages/UpdateCentre.jsx';
import { Toaster } from 'react-hot-toast';
import SolarForecastPage from "./pages/SolarForecast.jsx";

// Add import:
import Admin from './pages/Admin.jsx';

// Router configuration
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public login route without header/footer */}
      <Route path="/login" element={<LoginLayout />}>
        <Route index element={<Login />} />
      </Route>

      {/* Protected routes with header/footer */}
      <Route path="/" element={<AuthLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="iot-monitor" 
          element={
          <ProtectedRoute>
            <IoTMonitor />
          </ProtectedRoute>} 
        />
        <Route 
          path="solar-forecast" 
          element={
          <ProtectedRoute>
            <SolarForecastPage />
          </ProtectedRoute>} 
        />
        <Route
          path="data-entry"
          element={
            <ProtectedRoute>
              <DataEntry />
            </ProtectedRoute>
          }
        />
        <Route 
          path="glimpse-entry" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GlimpseDataEntry />
            </ProtectedRoute>
          } 
        />
        <Route 
         path="update-centre"
         element={
          <ProtectedRoute>
            <UpdateCentre />
          </ProtectedRoute>
          } 
        />
        <Route 
          path="/ghg-map" 
          element={
            <ProtectedRoute>
              <GhgReductionMap />
            </ProtectedRoute>
          } 
        />
        <Route
            path="about"
            element={<AboutPage />}
        />
        <Route 
          path="glimpses" 
          element={
          <ProtectedRoute>
            <Glimpses />
          </ProtectedRoute>} 
        />
        <Route 
          path="admin" 
          element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>} 
        />
      </Route>
    </>
  )
);

// Wrapper to rehydrate auth state on app load
function RehydrateAuth({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const token =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return children;
}

// Render
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <RehydrateAuth>
        <Toaster position="top-right" reverseOrder={false} />
        <RouterProvider router={router} />
      </RehydrateAuth>
    </Provider>
  </StrictMode>
);