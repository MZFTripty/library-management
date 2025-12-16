'use client'

import React, { useEffect, useState } from 'react'
import { Search, Mail, UserCircle, Shield, Calendar } from 'lucide-react'
import { Button, Card, CardContent, Badge, Table, Modal, Select, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { User, UserRole } from '@/lib/database.types'

interface MemberWithStats extends User {
    borrow_count: number
    fine_count: number
}

export default function MembersPage() {
    const [members, setMembers] = useState<MemberWithStats[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('')
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [memberToEdit, setMemberToEdit] = useState<User | null>(null)
    const [newRole, setNewRole] = useState<UserRole>('member')
    const [updating, setUpdating] = useState(false)

    const fetchMembers = async () => {
        const supabase = createClient()
        const { data: usersData } = await (supabase.from('users') as any)
            .select('*')
            .order('created_at', { ascending: false })

        if (usersData) {
            const membersWithStats = await Promise.all(
                usersData.map(async (user: any) => {
                    const [borrowsResult, finesResult] = await Promise.all([
                        (supabase.from('borrow_records') as any)
                            .select('*', { count: 'exact', head: true })
                            .eq('member_id', user.id),
                        (supabase.from('fines') as any)
                            .select('*', { count: 'exact', head: true })
                            .eq('member_id', user.id)
                            .eq('paid', false),
                    ])
                    return {
                        ...user,
                        borrow_count: borrowsResult.count || 0,
                        fine_count: finesResult.count || 0,
                    }
                })
            )
            setMembers(membersWithStats)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchMembers()
    }, [])

    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesRole = !roleFilter || member.role === roleFilter
        return matchesSearch && matchesRole
    })

    const handleUpdateRole = async () => {
        if (!memberToEdit) return

        setUpdating(true)
        const supabase = createClient()
        await (supabase.from('users') as any).update({ role: newRole }).eq('id', memberToEdit.id)

        setMembers(
            members.map((m) => (m.id === memberToEdit.id ? { ...m, role: newRole } : m))
        )
        setEditModalOpen(false)
        setMemberToEdit(null)
        setUpdating(false)
    }

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'error'
            case 'member':
                return 'primary'
            default:
                return 'default'
        }
    }

    const columns = [
        {
            key: 'name' as const,
            header: 'Member',
            sortable: true,
            render: (member: MemberWithStats) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {member.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role' as const,
            header: 'Role',
            render: (member: MemberWithStats) => (
                <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                    <Shield className="w-3 h-3 mr-1" />
                    {member.role}
                </Badge>
            ),
        },
        {
            key: 'borrow_count' as const,
            header: 'Borrows',
            render: (member: MemberWithStats) => (
                <span className="text-gray-700 dark:text-gray-300">{member.borrow_count}</span>
            ),
        },
        {
            key: 'fine_count' as const,
            header: 'Active Fines',
            render: (member: MemberWithStats) => (
                <span className={member.fine_count > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {member.fine_count}
                </span>
            ),
        },
        {
            key: 'created_at' as const,
            header: 'Joined',
            render: (member: MemberWithStats) => (
                <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(member.created_at).toLocaleDateString()}
                </span>
            ),
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (member: MemberWithStats) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setMemberToEdit(member)
                        setNewRole(member.role)
                        setEditModalOpen(true)
                    }}
                >
                    Change Role
                </Button>
            ),
        },
    ]

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Member Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View and manage library members
                </p>
            </div>

            {/* Filters */}
            <Card padding="sm">
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <Select
                            placeholder="All Roles"
                            value={roleFilter}
                            onChange={setRoleFilter}
                            options={[
                                { value: '', label: 'All Roles' },
                                { value: 'admin', label: 'Admin' },
                                { value: 'member', label: 'Member' },
                                { value: 'viewer', label: 'Viewer' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {members.length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Admins</p>
                        <p className="text-2xl font-bold text-red-600">
                            {members.filter((m) => m.role === 'admin').length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Members</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {members.filter((m) => m.role === 'member').length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">With Fines</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {members.filter((m) => m.fine_count > 0).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Table
                data={filteredMembers}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No members found."
            />

            {/* Edit Role Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Change Member Role"
                description="Update the role and permissions for this member"
            >
                <div className="space-y-4">
                    {memberToEdit && (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                    {memberToEdit.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {memberToEdit.name}
                                </p>
                                <p className="text-sm text-gray-500">{memberToEdit.email}</p>
                            </div>
                        </div>
                    )}

                    <Select
                        label="Select Role"
                        value={newRole}
                        onChange={(value) => setNewRole(value as UserRole)}
                        options={[
                            { value: 'admin', label: 'Admin - Full access to manage library' },
                            { value: 'member', label: 'Member - Can borrow books and view history' },
                            { value: 'viewer', label: 'Viewer - Can only browse catalog' },
                        ]}
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button loading={updating} onClick={handleUpdateRole}>
                            Update Role
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
