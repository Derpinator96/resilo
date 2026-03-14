import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sanitation from './pages/Sanitation'
import Energy from './pages/Energy'
import Weather from './pages/Weather'
import Water from './pages/Water'
import AIChat from './pages/AIChat'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sanitation" element={<Sanitation />} />
      <Route path="/energy" element={<Energy />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="/water" element={<Water />} />
      <Route path="/AIChat" element={<AIChat />} />
    </Routes>
  )
}

export default App
