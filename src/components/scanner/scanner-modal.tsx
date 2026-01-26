"use client"

import { useState, useRef, useEffect } from "react"
import QRScanner from "@/components/qr-scanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Camera, Upload, CheckCircle, XCircle } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { toast } from "sonner"

interface ScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onScan: (code: string) => Promise<void>
    scanResult: { status: 'success' | 'error', message: string, participant?: any } | null
    processing: boolean
}

export function ScannerModal({ isOpen, onClose, onScan, scanResult, processing }: ScannerModalProps) {
    const [manualCode, setManualCode] = useState("")

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#0a0118]/80 w-full max-w-md rounded-3xl border border-primary/20 shadow-[0_0_50px_rgba(139,92,246,0.2)] relative overflow-hidden flex flex-col max-h-[90vh]">

                {/* HUD Header */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse"></div>
                <div className="absolute top-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

                <div className="p-4 flex justify-between items-center border-b border-white/5 relative z-10">
                    <h3 className="font-heading font-bold text-lg flex items-center gap-2 text-primary tracking-widest uppercase">
                        <Camera className="w-5 h-5" /> Scanner Active
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto relative z-10">

                    {/* Viewfinder */}
                    <div className="relative rounded-lg overflow-hidden border border-primary/30 shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] bg-black aspect-square mb-6 group">
                        <QRScanner onScan={onScan} />

                        {/* Sci-Fi Overlay Grid */}
                        <div className="absolute inset-0 pointer-events-none opacity-20"
                            style={{ backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                        </div>

                        {/* Animated Scanning Line */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="w-full h-1 bg-accent/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                        </div>

                        {/* Corner Brackets */}
                        <div className="absolute inset-0 pointer-events-none p-4">
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent rounded-tl-lg shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent rounded-tr-lg shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent rounded-bl-lg shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent rounded-br-lg shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        </div>

                        {/* Processing Indicator */}
                        {processing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-mono text-xs text-primary animate-pulse">PROCESSING_DATA...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scan Result Panel */}
                    {scanResult && (
                        <div className={`p-4 rounded-xl mb-4 border relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300 ${scanResult.status === 'success'
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-destructive/10 border-destructive/30'
                            }`}>
                            {/* Result Glow */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${scanResult.status === 'success' ? 'bg-green-500' : 'bg-destructive'}`}></div>

                            <div className="flex items-center gap-3">
                                {scanResult.status === 'success'
                                    ? <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                                    : <XCircle className="w-6 h-6 text-destructive shrink-0" />}

                                <div className="flex-1 min-w-0">
                                    <p className={`font-heading font-bold text-lg leading-tight ${scanResult.status === 'success' ? 'text-green-400' : 'text-destructive'}`}>
                                        {scanResult.message}
                                    </p>
                                    {scanResult.participant && (
                                        <div className="mt-1 font-mono text-xs text-muted-foreground/80">
                                            <p className="truncate text-white">{scanResult.participant.name}</p>
                                            <p className="opacity-70">ID: {scanResult.participant.participant_code}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual Entry Section */}
                    <div className="flex flex-col gap-3 mt-auto">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                <span className="bg-[#0a0118] px-2 text-muted-foreground">Manual Override</span>
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => { e.preventDefault(); onScan(manualCode); }}
                            className="flex gap-2"
                        >
                            <Input
                                placeholder="ENTER CODE..."
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value)}
                                className="bg-black/40 border-primary/20 text-white font-mono placeholder:text-muted-foreground/50 focus-visible:ring-primary/50"
                                disabled={!!scanResult || processing}
                            />
                            <Button
                                type="submit"
                                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                                disabled={!!scanResult || processing}
                            >
                                EXECUTE
                            </Button>
                        </form>

                        <div className="relative group">
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="qr-image-upload"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return

                                    try {
                                        const html5QrCode = new Html5Qrcode("qr-file-reader-hidden-modal")
                                        const decodedText = await html5QrCode.scanFile(file, true)
                                        await onScan(decodedText)
                                    } catch (err) {
                                        console.error("File scan error", err)
                                        // Ideally bubble this error up, but for now we rely on the parent or localized toast if needed, 
                                        // BUT ScannerModal props doesn't have a setError way unless we fake a result. 
                                        // For now, let's assume parent handles toast if we called onScan('') or similar, 
                                        // or we just toast here.
                                        toast.error("Could not read QR from image")
                                    }
                                }}
                                disabled={!!scanResult || processing}
                            />
                            <Button
                                variant="outline"
                                type="button"
                                className="w-full border-dashed border-white/10 hover:bg-white/5 hover:border-accent/50 text-muted-foreground hover:text-accent transition-all"
                                onClick={() => document.getElementById('qr-image-upload')?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                                UPLOAD IMAGE
                            </Button>
                            {/* Hidden element for Html5Qrcode */}
                            <div id="qr-file-reader-hidden-modal" className="hidden"></div>
                        </div>
                    </div>
                </div>

                {/* Decorative footer line */}
                <div className="h-1 w-full bg-white/5 flex">
                    <div className="h-full w-1/3 bg-primary/20"></div>
                    <div className="h-full w-1/3 bg-transparent"></div>
                    <div className="h-full w-1/3 bg-accent/20"></div>
                </div>
            </div>
        </div>
    )
}
