import { QrCode, BarChart3, Users, Zap, Shield, Globe } from "lucide-react"

const features = [
    {
        title: "Instant QR Check-in",
        description: "Scan attendees in milliseconds using our specialized high-speed scanner. Works completely offline.",
        icon: QrCode,
        className: "md:col-span-2 bg-gradient-to-br from-purple-500/10 via-[#1a1a2e] to-black"
    },
    {
        title: "Real-time Analytics",
        description: "Watch your event fill up in real-time. Track peak hours instantly.",
        icon: BarChart3,
        className: "md:col-span-1 bg-[#0f0f16]"
    },
    {
        title: "Custom Reg Forms",
        description: "Build beautiful registration forms with our drag-and-drop builder.",
        icon: Users,
        className: "md:col-span-1 bg-[#0f0f16]"
    },
    {
        title: "Multi-Org Support",
        description: "Manage multiple college clubs or departments from a single super-admin dashboard.",
        icon: Globe,
        className: "md:col-span-2 bg-gradient-to-br from-cyan-500/10 via-[#1a2e2e] to-black"
    },
    {
        title: "Enterprise Security",
        description: "Bank-grade encryption for all data.",
        icon: Shield,
        className: "md:col-span-1 bg-[#0f0f16]"
    },
    {
        title: "Zero Latency",
        description: "Built on edge infrastructure.",
        icon: Zap,
        className: "md:col-span-2 bg-[#0f0f16]"
    },
]

export function Features() {
    return (
        <section id="features" className="py-24 px-6 relative">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-bold text-white">
                        Everything you need to <br />
                        <span className="text-purple-400">run perfect events</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Powerful tools for organizers who demand excellence. Designed for scale, built for speed.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={`p-8 rounded-3xl border border-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 group relative overflow-hidden ${feature.className}`}
                        >
                            {/* Hover Gradient Reveal */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform relative z-10 shadow-lg shadow-black/20">
                                <feature.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 relative z-10">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm relative z-10">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
