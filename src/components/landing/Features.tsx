import { QrCode, BarChart3, Users, Zap, Shield, Globe } from "lucide-react"

const features = [
    {
        title: "Instant QR Check-in",
        description: "Scan attendees in milliseconds using our specialized high-speed scanner. Works offline.",
        icon: QrCode,
        className: "md:col-span-2 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20"
    },
    {
        title: "Real-time Analytics",
        description: "Watch your event fill up in real-time. Track peak hours and attendance rates instantly.",
        icon: BarChart3,
        className: "md:col-span-1 bg-white/5 border-white/10"
    },
    {
        title: "Custom Reg Forms",
        description: "Build beautiful registration forms with our drag-and-drop builder. No coding required.",
        icon: Users,
        className: "md:col-span-1 bg-white/5 border-white/10"
    },
    {
        title: "Multi-Org Support",
        description: "Manage multiple college clubs or corporate departments from a single super-admin dashboard.",
        icon: Globe,
        className: "md:col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20"
    },
    {
        title: "Enterprise Security",
        description: "Bank-grade encryption for all participant data.",
        icon: Shield,
        className: "md:col-span-1 bg-white/5 border-white/10"
    },
    {
        title: "Lightning Fast",
        description: "Built on modern edge infrastructure for zero latency.",
        icon: Zap,
        className: "md:col-span-2 bg-white/5 border-white/10"
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
                            className={`p-8 rounded-3xl border backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 group ${feature.className}`}
                        >
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
