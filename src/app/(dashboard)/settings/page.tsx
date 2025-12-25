'use client'

import React, { useEffect, useState } from 'react'
import { User, Bell, Palette, Shield, Save, Camera, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { User as UserType } from '@/lib/database.types'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toast } from 'sonner'

export default function SettingsPage() {
    const [user, setUser] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const { theme, setTheme } = useTheme()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        avatar_url: '',
    })

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data } = await (supabase.from('users') as any)
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (data) {
                    setUser(data)
                    setFormData({
                        name: data.name,
                        email: data.email,
                        phone: data.phone || '', // Fetch phone from data
                        avatar_url: data.avatar_url || '',
                    })
                }
            }
            setLoading(false)
        }

        fetchUser()
    }, [])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        const supabase = createClient()
        await (supabase.from('users') as any).update({
            name: formData.name,
            phone: formData.phone,
            avatar_url: formData.avatar_url || null,
        }).eq('id', user.id)
        setSaving(false)
        setSaved(true)
        toast.success("Settings saved successfully!")
        setTimeout(() => setSaved(false), 2000)
    }


    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-primary dark:to-fuchsia-500 dark:bg-clip-text">Settings</h1>
                <p className="text-gray-500 dark:text-muted-foreground font-medium mt-1">Manage your account settings and preferences</p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2" padding="lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-primary/10">
                                <User className="w-5 h-5 text-indigo-600 dark:text-primary" />
                            </div>
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:w-24 dark:h-24 dark:rounded-3xl dark:from-primary dark:via-purple-600 dark:to-fuchsia-500 flex items-center justify-center text-white text-2xl dark:text-3xl font-bold dark:font-black shadow-lg dark:shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                                        {formData.avatar_url ? (
                                            <img src={formData.avatar_url} alt={formData.name} className="w-full h-full object-cover" />
                                        ) : (
                                            formData.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 dark:-bottom-2 dark:-right-2 p-2 dark:p-2.5 rounded-full dark:rounded-2xl bg-white dark:bg-black border border-gray-200 dark:border-white/5 shadow-lg dark:shadow-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                                        <Camera className="w-4 h-4 dark:w-5 dark:h-5 text-gray-600 dark:text-primary" />
                                    </button>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-xl dark:font-bold text-foreground tracking-tight">{user?.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-muted-foreground font-medium">{user?.email}</p>
                                    <span className="inline-flex mt-1 dark:mt-2 px-2 dark:px-3 py-0.5 dark:py-1 text-xs dark:text-[10px] font-medium dark:font-bold rounded-full dark:rounded-lg bg-indigo-100 dark:bg-primary/10 text-indigo-600 dark:text-primary capitalize dark:uppercase dark:tracking-widest">
                                        {user?.role}
                                    </span>
                                </div>
                            </div>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Form */}
                            <div className="space-y-4">
                                <Input
                                    label="Display Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your name"
                                />
                                <Input
                                    label="Email Address"
                                    value={formData.email}
                                    disabled
                                    helperText="Email cannot be changed"
                                />
                                <Input
                                    label="Contact Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1234567890"
                                />
                                <Input
                                    label="Avatar URL"
                                    value={formData.avatar_url}
                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>

                            <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Preferences */}
                <div className="space-y-6">
                    <Card className="border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Palette className="w-5 h-5 text-primary" />
                                </div>
                                Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-foreground">Theme Mode</p>
                                    <p className="text-xs text-muted-foreground font-medium">Switch interface style</p>
                                </div>
                                <ThemeToggle />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-indigo-600" />
                                Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Email alerts</p>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Due date reminders</p>
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full">
                                Change Password
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
