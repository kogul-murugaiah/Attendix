import { NextRequest, NextResponse } from 'next/server'
import * as brevo from '@getbrevo/brevo'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, subject, message } = body

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Initialize Brevo API
        const apiInstance = new brevo.TransactionalEmailsApi()
        apiInstance.setApiKey(
            brevo.TransactionalEmailsApiApiKeys.apiKey,
            process.env.BREVO_API_KEY!
        )

        // Prepare email to Admin
        const sendSmtpEmail = new brevo.SendSmtpEmail()
        sendSmtpEmail.subject = `[Inquiry] ${subject || 'New Contact Form Submission'}`
        sendSmtpEmail.sender = {
            name: "Attendix Contact Form",
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@attendix.com'
        }
        sendSmtpEmail.to = [{ email: 'teamattendix@gmail.com', name: 'Attendix Team' }]
        sendSmtpEmail.replyTo = { email: email, name: name }
        sendSmtpEmail.htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #333;">New Message from ${name}</h2>
                <p style="color: #666;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                    <p style="white-space: pre-wrap; margin: 0; color: #444;">${message}</p>
                </div>
            </div>
        `

        await apiInstance.sendTransacEmail(sendSmtpEmail)

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Contact API error:', err)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }
}
