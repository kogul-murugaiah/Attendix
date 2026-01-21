import QRCode from 'qrcode'

export async function generateQRCode(text: string): Promise<string> {
    try {
        // Generate QR code as a Data URL (base64 image)
        const url = await QRCode.toDataURL(text, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'H', // High error correction
        })
        return url
    } catch (err) {
        console.error('QR Code generation failed:', err)
        throw new Error('Failed to generate QR code')
    }
}
