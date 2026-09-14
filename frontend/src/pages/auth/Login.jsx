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
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const Login = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        phoneNumber: "",
        password: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    // Normal Login Handler
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.phoneNumber || !formData.password) {
            toast.error("Please enter both phone number and password")
            return
        }

        try {
            setIsLoading(true)
            const res = await axios.post(`http://localhost:8000/api/v1/doctors/login`, formData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            })

            if (res.data.statusCode === 200 || res.data.success) {
                // ApiResponse ki wajah se actual data 'res.data.data' mein hai
                const responseData = res.data.data;
                const token = responseData?.accessToken;
                const doctorObj = responseData?.doctor; // Yeh hai loggedInDoctor object

                if (token) {
                    localStorage.setItem("accessToken", token);
                }

                // CreateSchedule.jsx ke liye poora doctor object save karna zaroori hai
                if (doctorObj) {
                    localStorage.setItem("doctor", JSON.stringify(doctorObj));
                    localStorage.setItem("doctorName", doctorObj.name || "Doctor");
                }

                toast.success(res.data.message || "Logged in successfully!");
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Login Error:", error)
            const statusCode = error?.response?.status;
            const errorMessage = error?.response?.data?.message || "Invalid credentials. Please try again.";

            if (statusCode === 403) {
                toast.error(errorMessage);
                setTimeout(() => navigate('/verify-otp'), 2000);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-10 relative'>
            <div className='w-full max-w-md space-y-6'>
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl font-bold tracking-tight text-blue-500'>Doctor Login</h1>
                    <p className='text-slate-400'>Vaccination Management System</p>
                </div>

                <Card className="w-full bg-slate-900 border-slate-800 text-slate-100 overflow-hidden shadow-2xl">
                    <CardHeader className='space-y-1 text-center'>
                        <CardTitle className='text-2xl text-blue-400'>Welcome Back</CardTitle>
                        <CardDescription className='text-slate-400'>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phoneNumber" className="text-slate-200">Phone Number *</Label>
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="Enter Your Phone No"
                                    required
                                    className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className='flex items-center justify-between'>
                                    <Label htmlFor="password" className="text-slate-200">Password *</Label>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className='text-xs text-blue-400 hover:text-blue-300 hover:underline bg-transparent border-0 cursor-pointer transition-colors'
                                    >
                                        Forgot / Reset password?
                                    </button>
                                </div>
                                <div className='relative'>
                                    <Input
                                        id="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <Button
                                        type="button"
                                        variant='ghost'
                                        size="sm"
                                        className='absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-200'
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-slate-900 pt-2 pb-6 px-6 border-t border-slate-800/60 mt-4 flex-col gap-3">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 shadow-lg shadow-blue-600/20 transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Logging in...
                                    </>
                                ) : "Login"}
                            </Button>

                            <div className="text-center text-sm text-slate-400 mt-2">
                                Don't have an account?{" "}
                                <Link to="/signup" className="text-blue-400 hover:underline font-medium">
                                    Sign up
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default Login