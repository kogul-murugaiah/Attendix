import Link from "next/link"
import Image from "next/image"

export function Footer() {
    return (
        <footer className="relative border-t border-white/10 bg-black/40 backdrop-blur-md pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1 space-y-4">
                        <div className="flex items-center gap-0">
                            <div className="relative w-10 h-10">
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
                        <p className="text-sm text-gray-400">
                            The modern standard for event management and attendance tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#features" className="hover:text-purple-400 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a></li>
                            <li><Link href="/login" className="hover:text-purple-400 transition-colors">Login</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-purple-400 transition-colors">Status</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy</a></li>
                            <li><a href="#" className="hover:text-purple-400 transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 text-center text-sm text-gray-500">
                    <p>
                        © 2026 Attendix. All rights reserved. | Developed by <span className="text-purple-400 font-medium">Kogul Murugaiah</span>
                    </p>
                </div>
            </div>
        </footer>
    )
}
