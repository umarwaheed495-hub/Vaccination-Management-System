import React from 'react'
import { Button } from "@/components/ui/button"
import { ShieldCheck, Syringe, LogIn, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
            {/* Header / Navbar */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                        <Syringe className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Vax<span className="text-blue-500">Care</span>
                    </span>
                </div>
            </header>

            {/* Main Welcome Hero Section */}
            <main className="container mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-pulse">
                    <ShieldCheck className="w-4 h-4" /> Authorized Doctor Portal
                </div>

                <div className="max-w-3xl space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                        Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Vaccination Management System</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                        Streamlining healthcare workflows, tracking patient vaccination records, and managing schedules with efficiency and precision.
                    </p>
                </div>

                {/* Authentication Call-to-Actions (Sign In & Sign Up) */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4 w-full max-w-md">
                    {/* Already have an account -> Sign In */}
                    <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                        <p className="text-xs text-slate-400">If you already have an account:</p>
                        <Button 
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-4 h-4" /> Sign In
                        </Button>
                    </div>

                    {/* New User -> Sign Up */}
                    <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                        <p className="text-xs text-slate-400">If you are a new user:</p>
                        <Button 
                            onClick={() => navigate('/signup')}
                            variant="outline"
                            className="w-full sm:w-auto border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 hover:text-white font-medium px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4 text-blue-400" /> Create Account
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} Vaccination Management System. All rights reserved.
            </footer>
        </div>
    )
}

export default Home