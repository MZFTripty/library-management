'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Archive,
    ClipboardList,
    BarChart3,
    DollarSign,
    Settings,
    LogOut,
    ChevronLeft,
    Sparkles,
    Library,
    Clock
} from 'lucide-react'
import { User, UserRole } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet"
import { Button } from '@/components/ui/button'

interface SidebarProps {
    user: User | null
    collapsed?: boolean
    onToggle?: () => void
    variant?: 'sidebar' | 'drawer'
    isOpen?: boolean
    onClose?: () => void
}

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    roles?: UserRole[]
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/catalog', label: 'Catalog', icon: BookOpen },
    { href: '/admin/books', label: 'Manage Books', icon: Archive, roles: ['admin'] },
    { href: '/admin/shelves', label: 'Manage Shelves', icon: Library, roles: ['admin'] },
    { href: '/admin/members', label: 'Manage Members', icon: Users, roles: ['admin'] },
    { href: '/admin/assign', label: 'Assign Books', icon: ClipboardList, roles: ['admin'] },
    { href: '/admin/borrows', label: 'Manage Loans', icon: Clock, roles: ['admin'] },
    { href: '/member/my-books', label: 'My Books', icon: BookOpen, roles: ['member'] },
    { href: '/member/history', label: 'History', icon: ClipboardList, roles: ['member'] },
    { href: '/fines', label: 'Fines', icon: DollarSign, roles: ['admin', 'member'] },
    { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
]

const SidebarContent = ({ user, collapsed, pathname, handleSignOut, onClose }: any) => {
    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true
        if (!user) return false
        return item.roles?.includes(user.role)
    })

    return (
        <div className="flex flex-col h-full bg-sidebar bg-yellow-50 text-sidebar-foreground">
            {/* Decorative Elements (Subtle) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

            {/* Header */}
            <div className={cn(
                "relative flex items-center h-20 border-b border-sidebar-border flex-shrink-0 transition-all duration-300",
                collapsed ? "justify-center px-0" : "px-6"
            )}>
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex items-center gap-3 group transition-all duration-300",
                        collapsed ? "justify-center w-full" : ""
                    )}
                    onClick={onClose}
                >
                    <div className="relative w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300 flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary-foreground" />
                        <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300">
                            <span className="text-lg font-bold tracking-tight leading-none">
                                LibraryMS
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase mt-0.5">
                                Premium
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group font-medium text-sm",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                                collapsed && "justify-center px-2"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className={cn(
                                "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                                !isActive && "group-hover:scale-110"
                            )} />
                            {!collapsed && (
                                <span>{item.label}</span>
                            )}
                            {isActive && !collapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
                <div className="space-y-1">
                    <Link
                        href="/settings"
                        onClick={onClose}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                            collapsed && "justify-center"
                        )}
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                        {!collapsed && <span>Settings</span>}
                    </Link>
                    <button
                        onClick={handleSignOut}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                            "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive",
                            collapsed && "justify-center"
                        )}
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>

                {!collapsed && user && (
                    <div className="mt-4 pt-4 border-t border-sidebar-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold ring-2 ring-background">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate leading-none">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const Sidebar: React.FC<SidebarProps> = ({
    user,
    collapsed = false,
    onToggle,
    variant = 'sidebar',
    isOpen = false,
    onClose
}) => {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    // Sidebar Variant (Desktop)
    if (variant === 'sidebar') {
        return (
            <aside className={cn(
                "fixed top-0 left-0 z-30 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out hidden lg:block",
                collapsed ? "w-20" : "w-72"
            )}>
                {/* Toggle Button */}
                {onToggle && (
                    <Button
                        onClick={onToggle}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "absolute -right-3 top-9 z-40 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent",
                            collapsed && "rotate-180"
                        )}
                        aria-label="Toggle Sidebar"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </Button>
                )}
                <SidebarContent
                    user={user}
                    collapsed={collapsed}
                    pathname={pathname}
                    handleSignOut={handleSignOut}
                />
            </aside>
        )
    }

    // Drawer Variant (Mobile) using Shadcn Sheet
    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
            <SheetContent side="left" className="p-0 w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
                <SidebarContent
                    user={user}
                    collapsed={false}
                    pathname={pathname}
                    handleSignOut={handleSignOut}
                    onClose={onClose}
                />
            </SheetContent>
        </Sheet>
    )
}

export { Sidebar }
