'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Check, ArrowRight, Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/FloatingInput'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [rememberMe, setRememberMe] = useState(false)

    // Social Login Mock Handler
    const handleSocialLogin = async (provider: string) => {
        try {
            setError('')
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: provider as "google" | "github" | "apple" | "facebook" | "twitter",
                options: {
                    queryParams: {
                        access_type: 'online',
                        prompt: 'consent',
                    },
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
        setLoading(true)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            router.push('/')
            router.refresh()
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex w-full min-h-[650px] bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-3/5 p-8 sm:p-14 flex flex-col justify-center relative">
                <div className="max-w-[420px] mx-auto w-full">
                    {/* Header */}
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 lg:hidden mb-4 shadow-lg shadow-indigo-500/30">
                            <span className="text-white font-bold text-xl">L</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-3 text-lg">
                            Please enter your details to sign in.
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="flex items-center justify-center py-2.5 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
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
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <FloatingInput
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            leftIcon={<Mail className="w-5 h-5" />}
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

                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                  ${rememberMe
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'border-gray-300 dark:border-gray-600 group-hover:border-indigo-500'
                                    }
                `}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={rememberMe}
                                        onChange={() => setRememberMe(!rememberMe)}
                                    />
                                    {rememberMe && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors font-medium">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-bold shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5 transition-all duration-300 mt-6"
                            loading={loading}
                        >
                            Log In
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            Don&apos;t have an account?{' '}
                            <Link
                                href="/register"
                                className="text-indigo-600 hover:text-indigo-500 font-bold transition-colors inline-flex items-center gap-1 group"
                            >
                                Create account
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Copyright/Footer Info */}
                <div className="absolute bottom-8 left-0 right-0 text-center lg:text-left lg:left-14 text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} LibraryMS. All rights reserved.
                </div>
            </div>

            {/* Right Side - Visual Showcase */}
            <div className="hidden lg:flex w-2/5 md:w-1/2 lg:w-2/5 p-4 pl-0">
                <div className="w-full h-full rounded-2xl bg-indigo-600 relative overflow-hidden flex items-center justify-center p-12 text-center">
                    {/* Background Gradient & Shapes */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

                    {/* Glassmorph Card Content */}
                    <div className="relative z-10 w-full max-w-sm backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20 shadow-2xl">
                        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 text-white shadow-lg">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Discover & Learn</h2>
                        <p className="text-indigo-100 mb-8 leading-relaxed">
                            Access thousands of books, articles, and resources. Join our community of lifelong learners today.
                        </p>

                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce animation-delay-200" />
                            <div className="w-2 h-2 rounded-full bg-white/50 animate-bounce animation-delay-400" />
                        </div>
                    </div>

                    {/* Decorative Abstract Elements */}
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
            </div>
        </div>
    )
}
