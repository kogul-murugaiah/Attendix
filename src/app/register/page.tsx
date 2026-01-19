import RegistrationForm from "@/components/registration-form";

export default function RegisterPage() {
    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans selection:bg-purple-500/30 selection:text-white">
            {/* Ambient Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] animate-float"></div>
            </div>

            {/* Grid Overlay */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none"></div>

            <div className="w-full max-w-4xl space-y-8 relative z-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-1 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/5 backdrop-blur-sm mb-4">
                        <span className="px-4 py-1 text-xs font-medium bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-widest">
                            Official Registration
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-2xl">
                        Symposium <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 animate-gradient bg-300%">2024</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-400 font-light">
                        Secure your spot. Join the future of innovation.
                    </p>
                </div>

                <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Decorative glow behind the form */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl blur opacity-20 animate-glow" />
                    <div className="relative">
                        <RegistrationForm />
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 font-medium">
                    &copy; 2024 Symposium Team. All rights reserved.
                </p>
            </div>
        </div>
    );
}
