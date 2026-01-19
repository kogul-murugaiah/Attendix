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
        const startScanner = async () => {
            try {
                // Determine if we are already running
                if (scannerRef.current?.isScanning) {
                    await scannerRef.current.stop()
                }

                // Initialize if not exists
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(elementId)
                }

                await scannerRef.current.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1
                    },
                    (decodedText) => {
                        onScan(decodedText)
                    },
                    (errorMessage) => {
                        // Ignore standard scanning errors as they happen every frame no code is found
                        // Only report if needed, or filter specifically
                    }
                )
            } catch (err) {
                console.error("Failed to start scanner", err)
                if (onError) onError(err)
            }
        }

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(startScanner, 100)

        return () => {
            clearTimeout(timeoutId)
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { }).finally(() => {
                    scannerRef.current?.clear()
                })
            }
        }
    }, [onScan, onError])

    return (
        <div id={elementId} className="w-full h-full bg-black"></div>
    )
}
