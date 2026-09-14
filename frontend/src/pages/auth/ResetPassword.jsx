import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const ResetPassword = () => {
    const navigate = useNavigate()
    const location = useLocation()
    
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Previous page se aaya email auto-set karne ke liye
    const [email, setEmail] = useState(location.state?.email || '')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const handleResetPassword = async (e) => {
        e.preventDefault()

        if (!email.trim() || !otp.trim() || !newPassword.trim()) {
            toast.error("Please fill in all fields.")
            return
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long.")
            return
        }

        setLoading(true)
        try {
            const res = await axios.post(`/api/v1/doctors/verify-reset-otp`, {
                email: email.trim(),
                otp: otp.trim(),
                newPassword: newPassword.trim()
            })

            toast.success(res.data?.message || "Password updated successfully!")
            navigate('/login')
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password. Please check your OTP.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050914] text-white p-4">
            
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-[#2563eb] mb-2 tracking-tight">
                    Reset Password
                </h1>
                <p className="text-slate-400 text-sm">
                    Vaccination Management System
                </p>
            </div>

            <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-md border border-slate-800/60 rounded-2xl p-8 shadow-2xl">
                
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-[#3b82f6]">
                        Verify OTP & Reset
                    </h2>
                    <p className="text-slate-400 text-sm mt-2">
                        Enter your email, received OTP code, and new password.
                    </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200 block">
                            Email Address <span className="text-blue-500">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="doctor@example.com"
                            className="w-full px-4 py-2.5 rounded-lg bg-[#e2e8f0] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* OTP Code Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200 block">
                            OTP Code <span className="text-blue-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            className="w-full px-4 py-2.5 rounded-lg bg-[#e2e8f0] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200 block">
                            New Password <span className="text-blue-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                className="w-full px-4 py-2.5 rounded-lg bg-[#e2e8f0] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all pr-10"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                        type="submit" 
                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-6 rounded-lg shadow-lg shadow-blue-600/30 transition-all text-base mt-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Updating Password...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>

                <div className="text-center mt-6 pt-2">
                    <p className="text-slate-400 text-sm">
                        Remember your password?{" "}
                        <Link to="/login" className="text-[#3b82f6] hover:underline font-medium">
                            Login
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default ResetPassword