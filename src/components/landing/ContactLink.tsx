"use client"

import { toast } from "sonner"
import { ReactNode } from "react"

interface ContactLinkProps {
    children: ReactNode
    className?: string
    subject?: string
}

export function ContactLink({ children, className, subject = "Inquiry" }: ContactLinkProps) {
    const email = "teamattendix@gmail.com"

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()

        // Copy to clipboard
        navigator.clipboard.writeText(email)
        toast.success("Email copied to clipboard!", {
            description: email
        })

        // Try to open mailto
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`
    }

    return (
        <a
            href={`mailto:${email}`}
            onClick={handleClick}
            className={className}
        >
            {children}
        </a>
    )
}
