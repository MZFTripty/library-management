'use client'

import * as React from 'react'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    if (!mounted) {
        return <div className="w-9 h-9" /> // Placeholder to prevent layout shift
    }

    const themes = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ]

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-violet-100 dark:hover:bg-violet-900 border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
                aria-label="Toggle theme"
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-violet-700 dark:text-violet-400" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-violet-700 dark:text-violet-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-violet-100 dark:border-violet-800 bg-white/90 dark:bg-black/80 backdrop-blur-xl shadow-lg shadow-violet-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-0.5">
                        {themes.map((t) => {
                            const Icon = t.icon
                            const isActive = theme === t.value
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => {
                                        setTheme(t.value)
                                        setIsOpen(false)
                                    }}
                                    className={`
                                        w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors
                                        ${isActive
                                            ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="flex-1 text-left">{t.label}</span>
                                    {isActive && <Check className="w-3 h-3" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
