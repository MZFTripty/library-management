'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, Check, ArrowRight, Github, AlertCircle, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/FloatingInput'

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState(0)

    useEffect(() => {
        // Simple password strength calculator
        let strength = 0
        if (password.length > 5) strength += 20
        if (password.length > 8) strength += 20
        if (/[A-Z]/.test(password)) strength += 20
        if (/[0-9]/.test(password)) strength += 20
        if (/[^A-Za-z0-9]/.test(password)) strength += 20
        setPasswordStrength(strength)
    }, [password])

    const getStrengthColor = () => {
        if (passwordStrength < 40) return 'bg-red-500'
        if (passwordStrength < 80) return 'bg-amber-500'
        return 'bg-green-500'
    }

    const getStrengthText = () => {
        if (passwordStrength === 0) return ''
        if (passwordStrength < 40) return 'Weak'
        if (passwordStrength < 80) return 'Medium'
        return 'Strong'
    }

    const handleSocialLogin = async (provider: string) => {
        try {
            setError('')
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: provider as any,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (authError) {
                setError(authError.message)
            }
        } catch {
            setError('An unexpected error occurred during social login')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role: 'member',
                        phone: phone, // Pass phone to metadata
                    },
                },
            })

            if (authError) {
                setError(authError.message)
                return
            }

            setSuccess(true)
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl p-10 animate-scaleUp text-center border border-gray-100 dark:border-gray-700 w-full max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6 ring-8 ring-green-50 dark:ring-green-900/10 animate-bounce-subtle">
                    <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    Verify Your Account
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                    We&apos;ve sent a confirmation link to <br />
                    <strong className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{email}</strong>.
                    <br />Please verify your email to continue.
                </p>
                <Link href="/">
                    <Button className="w-full h-12 text-lg rounded-xl shadow-lg shadow-indigo-500/20">Return to Home</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex w-full min-h-[650px] bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Left Side - Visual Showcase */}
            <div className="hidden lg:flex w-2/5 md:w-1/2 lg:w-2/5 p-4 pr-0">
                <div className="w-full h-full rounded-2xl bg-indigo-600 relative overflow-hidden flex items-center justify-center p-12 text-center">
                    {/* Background Gradient & Shapes */}
                    <div className="absolute inset-0 bg-gradient-to-bl from-purple-700 via-indigo-700 to-indigo-900" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 grayscale"></div>

                    {/* Glassmorph Card Content */}
                    <div className="relative z-10 w-full max-w-sm backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 to-orange-500 text-white shadow-lg">
                            <User className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Start Your Journey</h2>
                        <p className="text-indigo-100 mb-0 leading-relaxed font-medium">
                            Create an account to track your reading, organize shelves, and get personalized recommendations.
                        </p>
                    </div>

                    {/* Decorative Abstract Elements */}
                    <div className="absolute bottom-8 text-indigo-200/60 text-sm font-medium tracking-widest uppercase">
                        Join 10,000+ Readers
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-3/5 p-8 sm:p-14 flex flex-col justify-center relative">
                <div className="max-w-[420px] mx-auto w-full">
                    {/* Header */}
                    <div className="mb-8 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 lg:hidden mb-4 shadow-lg shadow-indigo-500/30">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            Create Account
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                            Get started with your free account.
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handleSocialLogin('github')}
                            className="flex items-center justify-center py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                        >
                            <Github className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                            onClick={() => handleSocialLogin('apple')}
                            className="flex items-center justify-center py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                        >
                            <svg className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.9 3.87-.68c.69.11 2.68.8 3.5 2.19-.06.05-.24.16-.35.24-2.19 1.57-1.78 4.66.26 5.68-.05.09-.1.18-.15.27-.48 1.4-1.25 2.94-2.21 4.53zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.02 4.1-3.74 4.25z" />
                            </svg>
                        </button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">Or register with email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FloatingInput
                            label="Full Name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            leftIcon={<User className="w-5 h-5" />}
                        />

                        <FloatingInput
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            leftIcon={<Mail className="w-5 h-5" />}
                        />

                        <FloatingInput
                            label="Contact Number"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            leftIcon={<Phone className="w-5 h-5" />}
                        />

                        <FloatingInput
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            leftIcon={<Lock className="w-5 h-5" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none transition-colors hover:text-indigo-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            }
                        />

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="space-y-2 pt-1 px-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Password Strength</span>
                                    <span className={`font-bold transition-colors duration-300 ${passwordStrength < 40 ? 'text-red-500' :
                                        passwordStrength < 80 ? 'text-amber-500' : 'text-green-500'
                                        }`}>
                                        {getStrengthText()}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ease-out ${getStrengthColor()}`}
                                        style={{ width: `${passwordStrength}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">
                                    Use 8+ chars with numbers & symbols for strong password
                                </p>
                            </div>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mt-4 text-center">
                            By creating an account, you agree to our{' '}
                            <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium underline">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium underline">
                                Privacy Policy
                            </Link>.
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 transition-all duration-300 mt-2"
                            loading={loading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors inline-flex items-center gap-1 group"
                            >
                                Log in
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Copyright/Footer Info */}
                <div className="absolute bottom-8 left-0 right-0 text-center lg:text-left lg:left-14 text-xs text-gray-400">
                    <p>&copy; {new Date().getFullYear()} LibraryMS. All rights reserved.</p>
                    <p className="mt-1">Develop by <a href="https://www.softsasi.com" target='_blank' rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">Softsasi.</a></p>
                </div>
            </div>
        </div>
    )
}
