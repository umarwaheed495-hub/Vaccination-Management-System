import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

const VerifyOtp = () => {
    const navigate = useNavigate()
    const location = useLocation()
    
    const email = location.state?.email || ""
    
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const handleVerify = async (e) => {
        e.preventDefault()
        setErrorMessage("")

        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit OTP code")
            return
        }

        try {
            setIsLoading(true)
            const res = await axios.post(`/api/v1/doctors/verify-otp`, {
                email,
                otp
            })

            if (res.data.success) {
                toast.success(res.data.message || "Account verified successfully!")
                setIsVerified(true)
                
                // 4 seconds baad automatic Signin page par navigate karega
                setTimeout(() => {
                    navigate('/Login')
                }, 4000)
            }
        } catch (error) {
            console.error(error)
            const msg = error?.response?.data?.message || "Invalid or expired OTP code"
            setErrorMessage(msg)
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setErrorMessage("")
        try {
            setIsResending(true)
            const res = await axios.post(`/api/v1/doctors/resend-otp`, { email })
            
            if (res.data.success) {
                toast.success(res.data.message || "OTP resent to your email!")
            }
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.message || "Failed to resend OTP")
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className='min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-10'>
            <div className='w-full max-w-md space-y-6'>
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl font-bold tracking-tight text-blue-500'>Doctor Verification</h1>
                    <p className='text-slate-400'>Vaccination Management System</p>
                </div>

                <Card className="w-full bg-slate-900 border-slate-800 text-slate-100 overflow-hidden">
                    {/* SUCCESS STATE UI */}
                    {isVerified ? (
                        <div className="py-10 px-6 text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
                            </div>
                            <CardTitle className="text-2xl text-emerald-400">Account Verified!</CardTitle>
                            
                            {/* Meaningful Email Verification Message */}
                            <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg space-y-2">
                                <CardDescription className="text-slate-200 font-medium flex items-center justify-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Email Address Verified Successfully!</span>
                                </CardDescription>
                                <p className="text-xs text-slate-400">
                                    Your email <strong className="text-slate-200">({email || "your email"})</strong> is now verified. Please proceed to login to access your dashboard.
                                </p>
                            </div>

                            <p className="text-xs text-slate-500">Redirecting to login page in 4 seconds...</p>
                            <Button 
                                onClick={() => navigate('/Login')}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold mt-4 shadow-lg shadow-emerald-600/20"
                            >
                                Proceed to Sign In
                            </Button>
                        </div>
                    ) : (
                        /* OTP FORM UI */
                        <form onSubmit={handleVerify}>
                            <CardHeader className='space-y-1 text-center'>
                                <CardTitle className='text-2xl text-blue-400'>Enter Verification Code</CardTitle>
                                <CardDescription className='text-slate-400'>
                                    We sent a 6-digit OTP code to <br />
                                    <strong className="text-slate-200">{email || "your registered email"}</strong>
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Inline Error Alert */}
                                {errorMessage && (
                                    <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-md text-sm">
                                        <XCircle className="w-5 h-5 shrink-0 text-red-400" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="otp">6-Digit OTP Code *</Label>
                                    <Input
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter Your OTP"
                                        maxLength={6}
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 text-center tracking-widest text-lg font-bold"
                                    />
                                </div>

                                <div className="text-center text-sm text-slate-400 mt-2">
                                    Didn't receive the code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={isResending}
                                        className="text-blue-400 hover:underline disabled:opacity-50 font-medium"
                                    >
                                        {isResending ? "Resending..." : "Resend OTP"}
                                    </button>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-slate-900 pt-2 pb-6 px-6 border-t border-slate-800/50 mt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            Verifying...
                                        </>
                                    ) : "Verify Account"}
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    )
}

export default VerifyOtp