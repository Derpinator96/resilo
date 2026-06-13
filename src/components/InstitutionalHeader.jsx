import { useLocation } from 'react-router-dom'
import logoNitrr from '../assets/logo-nitrr.png'
import logoUnicef from '../assets/logo-unicef.png'

export default function InstitutionalHeader() {
  const { pathname } = useLocation()
  if (pathname === '/' || pathname === '/landing') return null

  return (
    <div className="w-full h-[36px] bg-[#0A192F] flex items-center justify-center px-4 z-50 fixed top-0 left-0">
      <div className="flex items-center text-white font-['Inter'] font-semibold text-[11px] tracking-[0.04em] sm:tracking-[0.08em]">
        <div className="flex items-center gap-2">
          <img src={logoNitrr} alt="NIT Raipur" className="h-[20px] hidden sm:block object-contain" />
          <span>NIT RAIPUR</span>
        </div>
        <div className="w-[1px] h-[14px] bg-[rgba(255,255,255,0.2)] mx-3 sm:mx-6"></div>
        <div className="flex items-center gap-2">
          <span>GOVT. OF CHHATTISGARH</span>
        </div>
        <div className="w-[1px] h-[14px] bg-[rgba(255,255,255,0.2)] mx-3 sm:mx-6"></div>
        <div className="flex items-center gap-2">
          <img src={logoUnicef} alt="UNICEF" className="h-[20px] hidden sm:block object-contain" />
          <span>UNICEF</span>
        </div>
      </div>
    </div>
  )
}
