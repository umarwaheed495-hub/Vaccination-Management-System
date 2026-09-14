import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')

    const handleSendOtp = async (e) => {
        e.preventDefault()
        if (!email.trim()) {
            toast.error("Please enter your email address.")
            return
        }

        setLoading(true)
        try {
            const res = await axios.post(`http://localhost:8000/api/v1/doctors/forgot-password`, {
                email: email.trim()
            })

            toast.success(res.data?.message || "OTP code sent to your email successfully.")
            // Email pass karke Reset Password page par redirect karein
            navigate('/reset-password', { state: { email: email.trim() } })
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong while sending OTP.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050914] text-white p-4 sm:p-6">
            <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2563eb] mb-2 tracking-tight">
                    Forgot Password
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm">
                    Vaccination Management System
                </p>
            </div>

            <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#3b82f6]">
                        Request OTP
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                        Enter your registered email address to receive an OTP code.
                    </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-200 block">
                            Email Address <span className="text-blue-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="doctor@example.com"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#e2e8f0] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm sm:text-base transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-5 sm:py-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm sm:text-base mt-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Sending OTP...
                            </>
                        ) : (
                            "Send OTP Code"
                        )}
                    </Button>
                </form>

                <div className="text-center mt-6 pt-2">
                    <Link to="/login" className="text-xs sm:text-sm inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword