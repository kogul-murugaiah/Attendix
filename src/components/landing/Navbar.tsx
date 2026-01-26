import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ContactModal } from "@/components/landing/ContactModal"

export function Navbar() {
    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
            <header className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-purple-900/10 w-full max-w-5xl">
                <div className="flex items-center justify-between p-3 px-6 w-full">
                    <div className="flex items-center gap-0">
                        <div className="relative w-12 h-12">
                            <Image
                                src="/logo.png"
                                alt="Attendix"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 -ml-2">Attendix</span>
                    </div>

                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <ContactModal subject="Support Request" className="hover:text-white transition-colors cursor-pointer" asChild>
                            <span className="hover:text-white transition-colors cursor-pointer">Support</span>
                        </ContactModal>
                    </nav>

                    <div className="flex gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">Login</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 border-0 rounded-full px-6 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>
        </div>
    )
}
