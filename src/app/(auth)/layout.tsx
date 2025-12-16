import React from 'react'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-5xl">
                {children}
            </div>
        </div>
    )
}
