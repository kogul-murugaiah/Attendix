'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
    onScan: (decodedText: string) => void
    onError?: (error: any) => void
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const elementId = "qr-scanner-view"

    useEffect(() => {
        let isMounted = true

        const startScanner = async () => {
            // Wait slightly for DOM
            await new Promise(r => setTimeout(r, 100))
            if (!isMounted) return

            try {
                // Completely reset: If an instance exists, try to clean it up and discard it
                if (scannerRef.current) {
                    try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop()
                        }
                        await scannerRef.current.clear()
                    } catch (e) {
                        // ignore cleanup errors on old instance
                    }
                    scannerRef.current = null
                }

                // Create fresh instance
                const el = document.getElementById(elementId)
                if (el) {
                    const scanner = new Html5Qrcode(elementId)
                    scannerRef.current = scanner

                    if (isMounted) {
                        await scanner.start(
                            { facingMode: "environment" },
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                                aspectRatio: 1
                            },
                            (decodedText) => {
                                if (isMounted) onScan(decodedText)
                            },
                            (errorMessage) => {
                                // ignore
                            }
                        )
                    }
                }
            } catch (err) {
                // Suppress "already under transition" if it happens during rapid hot-reloads
                const msg = (err as any)?.message || ""
                if (msg.includes("already under transition") || msg.includes("interrupted") || (err as any)?.name === 'AbortError') {
                    console.log("Scanner start interrupted (benign)")
                    return
                }
                console.error("Failed to start scanner", err)
                if (isMounted && onError) onError(err)
            }
        }

        startScanner()

        return () => {
            isMounted = false
            const scanner = scannerRef.current

            if (scanner) {
                // FORCE CLEANUP: Attempt to stop camera tracks manually if accessible via DOM
                // html5-qrcode creates a video element inside the container
                try {
                    const videoElement = document.querySelector(`#${elementId} video`) as HTMLVideoElement
                    if (videoElement && videoElement.srcObject) {
                        const stream = videoElement.srcObject as MediaStream
                        stream.getTracks().forEach(track => track.stop())
                    }
                } catch (e) {
                    // ignore DOM errors
                }

                if (scanner.isScanning) {
                    scanner.stop()
                        .catch((err) => console.debug('Scanner cleanup stop error:', err))
                        .finally(() => {
                            try { scanner.clear() } catch (e) { /* ignore */ }
                        })
                } else {
                    try { scanner.clear() } catch (e) { /* ignore */ }
                }
            }
        }
    }, [onScan, onError])

    return (
        <div id={elementId} className="w-full h-full bg-black"></div>
    )
}
