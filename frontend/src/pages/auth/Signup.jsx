import React, { useState, useRef, useEffect } from 'react'
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
import { Eye, EyeOff, Loader2, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const COUNTRIES = [
    { iso: "PK", flag: "🇵🇰", code: "+92", label: "PK" },
    { iso: "US", flag: "🇺🇸", code: "+1", label: "US" },
    { iso: "GB", flag: "🇬🇧", code: "+44", label: "UK" },
    { iso: "AE", flag: "🇦🇪", code: "+971", label: "UAE" },
    { iso: "SA", flag: "🇸🇦", code: "+966", label: "KSA" },
    { iso: "IN", flag: "🇮🇳", code: "+91", label: "IN" },
    { iso: "AU", flag: "🇦🇺", code: "+61", label: "AU" },
    { iso: "CA", flag: "🇨🇦", code: "+1", label: "CA" },
    { iso: "DE", flag: "🇩🇪", code: "+49", label: "DE" },
    { iso: "FR", flag: "🇫🇷", code: "+33", label: "FR" },
    { iso: "CN", flag: "🇨🇳", code: "+86", label: "CN" },
    { iso: "JP", flag: "🇯🇵", code: "+81", label: "JP" },
    { iso: "TR", flag: "🇹🇷", code: "+90", label: "TR" },
    { iso: "MY", flag: "🇲🇾", code: "+60", label: "MY" },
    { iso: "ID", flag: "🇮🇩", code: "+62", label: "ID" },
    { iso: "EG", flag: "🇪🇬", code: "+20", label: "EG" },
    { iso: "ZA", flag: "🇿🇦", code: "+27", label: "ZA" },
]

const Signup = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [isCountryOpen, setIsCountryOpen] = useState(false)
    const [selectedIso, setSelectedIso] = useState("PK")
    const countryRef = useRef(null)

    const selectedCountry = COUNTRIES.find((c) => c.iso === selectedIso) || COUNTRIES[0]

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

    // Close the dropdown on outside click or Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (countryRef.current && !countryRef.current.contains(e.target)) {
                setIsCountryOpen(false)
            }
        }
        const handleEscape = (e) => {
            if (e.key === "Escape") setIsCountryOpen(false)
        }
        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleEscape)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleEscape)
        }
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleCountrySelect = (country) => {
        setSelectedIso(country.iso)
        setFormData((prev) => ({ ...prev, countryCode: country.code }))
        setIsCountryOpen(false)
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

                {/* overflow-hidden removed so the dropdown list isn't clipped by the card */}
                <Card className="w-full bg-slate-900 border-slate-800 text-slate-100">
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
                                        {/* Custom scrollable country code dropdown */}
                                        <div className="relative shrink-0" ref={countryRef}>
                                            <button
                                                type="button"
                                                id="countryCode"
                                                aria-haspopup="listbox"
                                                aria-expanded={isCountryOpen}
                                                onClick={() => setIsCountryOpen((open) => !open)}
                                                className="flex h-9 w-28 items-center justify-between gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                            >
                                                <span className="truncate">
                                                    {selectedCountry.flag} {selectedCountry.code}
                                                </span>
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isCountryOpen ? "rotate-180" : ""}`}
                                                />
                                            </button>

                                            {isCountryOpen && (
                                                <ul
                                                    role="listbox"
                                                    className="absolute left-0 top-full z-50 mt-1 max-h-60 w-56 overflow-y-auto overscroll-contain rounded-md border border-slate-700 bg-slate-900 py-1 shadow-xl shadow-black/40
                                                        [&::-webkit-scrollbar]:w-2
                                                        [&::-webkit-scrollbar-track]:bg-slate-900
                                                        [&::-webkit-scrollbar-thumb]:rounded-full
                                                        [&::-webkit-scrollbar-thumb]:bg-slate-600
                                                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-500"
                                                    style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 #0f172a" }}
                                                >
                                                    {COUNTRIES.map((country) => {
                                                        const isSelected = country.iso === selectedIso
                                                        return (
                                                            <li
                                                                key={country.iso}
                                                                role="option"
                                                                aria-selected={isSelected}
                                                                onClick={() => handleCountrySelect(country)}
                                                                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-slate-800 ${isSelected ? "bg-slate-800/70 text-blue-400" : "text-slate-100"}`}
                                                            >
                                                                <span>
                                                                    {country.flag} {country.code} ({country.label})
                                                                </span>
                                                                {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Phone Input */}
                                        <Input
                                            id="phoneNumber"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            placeholder="Enter Your Phone Number"
                                            required
                                            className="min-w-0 flex-1 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
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

                        <CardFooter className="bg-slate-900 pt-2 pb-6 px-6 border-t border-slate-800/50 flex flex-col gap-4 rounded-b-xl">
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

                            <p className="text-center text-sm text-slate-400">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-blue-400 hover:text-blue-300 hover:underline underline-offset-4 transition-colors"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default Signup