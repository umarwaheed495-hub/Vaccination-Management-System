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
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Signup = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        letterpad: "",
        email: "",
        password: "",
        confirmPassword: "",
        countryCode: "+92",
        phoneNumber: "",
        mobileNumberWhatsapp: "",
        pmdcNumber: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error("Password and Confirm Password do not match!")
            return
        }

        try {
            setIsLoading(true)
            const res = await axios.post(`/api/v1/doctors/register`, formData, {
                headers: {
                    "Content-Type": "application/json"
                }
            })

            if (res.data.success) {
                toast.success(res.data.message)
                navigate('/verify-otp', { state: { email: formData.email } })
            }
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.message || "Registration failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-10'>
            <div className='w-full max-w-2xl space-y-6'>
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl font-bold tracking-tight text-blue-500'>Doctor Registration</h1>
                    <p className='text-slate-400'>Vaccination Management System</p>
                </div>

                <Card className="w-full bg-slate-900 border-slate-800 text-slate-100 overflow-hidden">
                    <CardHeader className='space-y-1 text-center'>
                        <CardTitle className='text-2xl text-blue-400'>Create Account</CardTitle>
                        <CardDescription className='text-slate-400'>
                            Enter your details to register as a doctor
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Doctor Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* PMDC Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="pmdcNumber">PMDC Number *</Label>
                                    <Input
                                        id="pmdcNumber"
                                        name="pmdcNumber"
                                        value={formData.pmdcNumber}
                                        onChange={handleChange}
                                        placeholder="Enter your PMDC number"
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Letterpad / Clinic Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="letterpad">Letterpad / Clinic Name *</Label>
                                    <Input
                                        id="letterpad"
                                        name="letterpad"
                                        value={formData.letterpad}
                                        onChange={handleChange}
                                        placeholder="Enter your letterpad or clinic name"
                                        required
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Country Code & Phone Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                                    <div className="flex gap-2">
                                        {/* Country Code Dropdown */}
                                        <select
                                            id="countryCode"
                                            name="countryCode"
                                            value={formData.countryCode}
                                            onChange={handleChange}
                                            required
                                            className="w-28 bg-slate-800/60 border border-slate-700 text-white rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        >
                                            <option value="+92" className="bg-slate-900 text-white">🇵🇰 +92 (PK)</option>
                                            <option value="+1" className="bg-slate-900 text-white">🇺🇸 +1 (US)</option>
                                            <option value="+44" className="bg-slate-900 text-white">🇬🇧 +44 (UK)</option>
                                            <option value="+971" className="bg-slate-900 text-white">🇦🇪 +971 (UAE)</option>
                                            <option value="+966" className="bg-slate-900 text-white">🇸🇦 +966 (KSA)</option>
                                            <option value="+91" className="bg-slate-900 text-white">🇮🇳 +91 (IN)</option>
                                            <option value="+61" className="bg-slate-900 text-white">🇦🇺 +61 (AU)</option>
                                            <option value="+1" className="bg-slate-900 text-white">🇨🇦 +1 (CA)</option>
                                            <option value="+49" className="bg-slate-900 text-white">🇩🇪 +49 (DE)</option>
                                            <option value="+33" className="bg-slate-900 text-white">🇫🇷 +33 (FR)</option>
                                            <option value="+86" className="bg-slate-900 text-white">🇨🇳 +86 (CN)</option>
                                            <option value="+81" className="bg-slate-900 text-white">🇯🇵 +81 (JP)</option>
                                            <option value="+90" className="bg-slate-900 text-white">🇹🇷 +90 (TR)</option>
                                            <option value="+60" className="bg-slate-900 text-white">🇲🇾 +60 (MY)</option>
                                            <option value="+62" className="bg-slate-900 text-white">🇮🇩 +62 (ID)</option>
                                            <option value="+20" className="bg-slate-900 text-white">🇪🇬 +20 (EG)</option>
                                            <option value="+27" className="bg-slate-900 text-white">🇿🇦 +27 (ZA)</option>
                                        </select>

                                        {/* Phone Input */}
                                        <Input
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="Enter Your Phone Number"
                                            required
                                            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                        />
                                    </div>
                                </div>

                                {/* WhatsApp Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="mobileNumberWhatsapp">WhatsApp Number</Label>
                                    <Input
                                        id="mobileNumberWhatsapp"
                                        name="mobileNumberWhatsapp"
                                        value={formData.mobileNumberWhatsapp}
                                        onChange={handleChange}
                                        placeholder="Enter Your WhatsApp Number"
                                        className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                </div>

                                {/* Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <div className='relative'>
                                        <Input
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter Your Password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="bg-slate-800/60 border-slate-700 text-white pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant='ghost'
                                            size="sm"
                                            className='absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400'
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <div className='relative'>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Enter Your Confirm Password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            className="bg-slate-800/60 border-slate-700 text-white pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant='ghost'
                                            size="sm"
                                            className='absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400'
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        {/* Updated CardFooter styling to match dark theme seamlessly */}
                        <CardFooter className="bg-slate-900 pt-2 pb-6 px-6 border-t border-slate-800/50">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 shadow-lg shadow-blue-600/20 transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Registering Account...
                                    </>
                                ) : "Register Account"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default Signup