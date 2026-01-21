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
import { MoreHorizontal, Settings, ExternalLink } from "lucide-react"

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
            case 'trial': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
            case 'suspended': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            default: return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
        }
    }

    return (
        <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-400">Organization</TableHead>
                        <TableHead className="text-gray-400">Code</TableHead>
                        <TableHead className="text-gray-400">Plan</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.map((org) => (
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
                    {organizations.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                No organizations found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
