import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Helper to mock if no key
const isMock = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your-resend-key');
const resend = isMock ? null : new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
    try {
        const { to, subject, html, attachments } = await request.json();

        if (isMock || !resend) {
            console.log('--- EMAIL MOCK ---');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Attachments:', attachments ? `${attachments.length} files` : 'none');
            return NextResponse.json({ success: true, mocked: true });
        }

        const data = await resend.emails.send({
            from: 'Attendix <onboarding@resend.dev>', // Change if you have a domain
            to,
            subject,
            html,
            attachments
        });

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
