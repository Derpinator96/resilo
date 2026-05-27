import { useNavigate } from 'react-router-dom'
import { ArrowRight, User, ShieldCheck } from 'lucide-react'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden bg-slate-50">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stripe-gradient opacity-20 blur-3xl mix-blend-multiply pointer-events-none animate-fade-in"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stripe-gradient opacity-10 blur-3xl mix-blend-multiply pointer-events-none animate-fade-in" style={{ animationDelay: '0.2s' }}></div>

      <div className="z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 shadow-xl rounded-3xl bg-stripe-gradient shadow-indigo-500/20">
            <span className="text-4xl font-black text-white">R</span>
          </div>
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-slate-900">
            Project <span className="text-gradient">RESILO</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-slate-500">
            The next-generation infrastructure monitoring platform connecting rural assets, AI triage, and central authorities.
          </p>
        </div>

        {/* Unified Auth Box */}
        <div className="p-8 mx-auto shadow-2xl bg-glass rounded-3xl animate-slide-up text-center max-w-lg" style={{ animationDelay: '0.1s' }}>
          
          <SignedOut>
            <div className="mb-8 text-slate-600">
              <ShieldCheck size={48} className="mx-auto mb-4 text-indigo-500" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Access</h2>
              <p>Please sign in or create an account to access the dashboard and tools.</p>
            </div>
            <div className="flex flex-col gap-4">
              <SignInButton mode="modal">
                <button className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-all shadow-lg rounded-2xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 active:scale-[0.98]">
                  Sign In <ArrowRight size={20} />
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-slate-700 transition-all border-2 border-slate-200 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98]">
                  Create Account
                </button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="mb-8 text-slate-600">
              <User size={48} className="mx-auto mb-4 text-emerald-500" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
              <p>You are authenticated. Proceed to your dashboard.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center w-full gap-2 py-4 text-lg font-bold text-white transition-all shadow-lg rounded-2xl bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              Go to Dashboard <ArrowRight size={20} />
            </button>
          </SignedIn>

        </div>
      </div>
    </div>
  )
}