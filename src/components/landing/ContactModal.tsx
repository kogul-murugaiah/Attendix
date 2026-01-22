"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

interface ContactModalProps {
    children: React.ReactNode
    subject?: string
    className?: string
    asChild?: boolean
}

export function ContactModal({ children, subject = "General Inquiry", className, asChild }: ContactModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
        subject: subject
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) throw new Error("Failed to send")

            toast.success("Message sent successfully!", {
                description: "We'll get back to you shortly."
            })
            setOpen(false)
            setFormData({ name: "", email: "", message: "", subject: subject })
        } catch (error) {
            toast.error("Failed to send message. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild={asChild} className={className}>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#0a0a0f] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Contact Support</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Send us a message and we'll reply to your email.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            required
                            placeholder="Your name"
                            className="bg-white/5 border-white/10 focus:border-purple-500/50"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="bg-white/5 border-white/10 focus:border-purple-500/50"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            required
                            placeholder="How can we help?"
                            className="min-h-[100px] bg-white/5 border-white/10 focus:border-purple-500/50 resize-none"
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Send Message
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
