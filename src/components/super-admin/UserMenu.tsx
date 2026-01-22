'use client'

import { createClient } from '@/lib/supabase/client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UserMenu() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 p-[1px] cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all">
                    <div className="h-full w-full rounded-full bg-[#0a0a0f] flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-300" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#13131a] border-white/10 text-gray-200">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
