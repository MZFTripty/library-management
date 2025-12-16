'use client'

import React, { useEffect, useState } from 'react'
import { User, Bell, Moon, Sun, Palette, Shield, Save, Camera, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { User as UserType } from '@/lib/database.types'

export default function SettingsPage() {
    const [user, setUser] = useState<UserType | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [darkMode, setDarkMode] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
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
                        avatar_url: data.avatar_url || '',
                    })
                }
            }
            setLoading(false)
        }

        fetchUser()
        setDarkMode(document.documentElement.classList.contains('dark'))
    }, [])

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        const supabase = createClient()
        await (supabase.from('users') as any).update({
            name: formData.name,
            avatar_url: formData.avatar_url || null,
        }).eq('id', user.id)
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const toggleDarkMode = () => {
        setDarkMode(!darkMode)
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', darkMode ? 'light' : 'dark')
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
            </div>

            {saved && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-green-700 dark:text-green-400">Settings saved successfully!</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Avatar */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                        {formData.name.charAt(0).toUpperCase()}
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                                    <p className="text-sm text-gray-500">{user?.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 capitalize">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-600" />
                                Appearance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                                    <p className="text-sm text-gray-500">Toggle dark theme</p>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${darkMode ? 'translate-x-7' : 'translate-x-1'}`}>
                                        {darkMode ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-amber-500" />}
                                    </div>
                                </button>
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
