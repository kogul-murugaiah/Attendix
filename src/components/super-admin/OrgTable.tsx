'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Search } from "lucide-react"

interface Organization {
    id: string
    org_code: string
    org_name: string
    subscription_plan: string
    subscription_status: string
    created_at: string
}

interface OrgTableProps {
    organizations: Organization[]
}

export function OrgTable({ organizations }: OrgTableProps) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
            case 'trial': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
            case 'suspended': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
        return date.toLocaleDateString()
    }

    // Filter organizations
    const filteredOrgs = organizations.filter(org => {
        const matchesSearch = org.org_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.org_code.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-black/40 border-white/10 text-white"
                    />
                </div>
                <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
                    <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All" />
                    <FilterButton active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} label="Active" />
                    <FilterButton active={statusFilter === 'trial'} onClick={() => setStatusFilter('trial')} label="Trial" />
                    <FilterButton active={statusFilter === 'suspended'} onClick={() => setStatusFilter('suspended')} label="Suspended" />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-400">Organization</TableHead>
                            <TableHead className="text-gray-400">Code</TableHead>
                            <TableHead className="text-gray-400">Plan</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Created</TableHead>
                            <TableHead className="text-gray-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrgs.map((org) => (
                            <TableRow key={org.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-gray-200">
                                    {org.org_name}
                                </TableCell>
                                <TableCell className="text-gray-400 font-mono text-xs">
                                    {org.org_code}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                                        {org.subscription_plan.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(org.subscription_status)}>
                                        {org.subscription_status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                    {formatDate(org.created_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                                        onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredOrgs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${active
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </button>
    )
}
