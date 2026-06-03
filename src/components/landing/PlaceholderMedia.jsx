export default function PlaceholderMedia({ className }) {
  return (
    <div className={`bg-[#121614] border border-white/10 flex items-center justify-center overflow-hidden relative ${className}`}>
      <svg className="w-full h-full text-white/5 absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M0,100 L100,0 M0,0 L100,100" stroke="currentColor" strokeWidth="1" />
      </svg>
      <div className="text-white/30 text-sm font-medium tracking-widest uppercase z-10 flex flex-col items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>Media Placeholder</span>
      </div>
    </div>
  )
}
