import React from 'react'
import { Bell, Search, Menu } from 'lucide-react'
import { User } from '@/lib/database.types'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps {
    user: User | null
    onMenuClick?: () => void
    title?: string
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick, title }) => {

    return (
        <header className="sticky top-0 z-20 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    )}
                    {title && (
                        <h1 className="text-xl font-semibold text-violet-800 dark:text-violet-100">
                            {title}
                        </h1>
                    )}
                </div>

                {/* Search */}
                <div className="hidden md:flex flex-1 max-w-md mx-8">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search books, members..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white/50 dark:bg-black/50 border border-violet-100 dark:border-violet-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    {/* User avatar */}
                    {user && (
                        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                    {user.role}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-md overflow-hidden">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-medium text-white">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

export { Header }
