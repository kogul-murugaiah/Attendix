import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

// Helper to mock if no key
const isMock = !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your-resend-key');
const resend = isMock ? null : new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
    try {
        const { to, subject, html, attachments, participantId } = await request.json();

        if (isMock || !resend) {
            console.log('--- EMAIL MOCK ---');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Attachments:', attachments ? `${attachments.length} files` : 'none');
            return NextResponse.json({ success: true, mocked: true });
        }

        const supabase = createAdminClient();

        try {
            const data = await resend.emails.send({
                from: 'Attendix <onboarding@resend.dev>', // Change if you have a domain
                to,
                subject,
                html,
                attachments
            });

            if (data.error) {
                if (participantId) {
                    await supabase
                        .from('student_registrations')
                        .update({
                            email_status: 'failed',
                            email_error: JSON.stringify(data.error)
                        })
                        .eq('id', participantId);
                }
                return NextResponse.json({ error: data.error, success: false }, { status: 400 });
            }

            if (participantId) {
                await supabase
                    .from('student_registrations')
                    .update({
                        email_status: 'sent',
                        email_sent_at: new Date().toISOString()
                    })
                    .eq('id', participantId);
            }

            return NextResponse.json({ ...data, success: true });
        } catch (emailErr: any) {
            console.error('Resend error:', emailErr);
            if (participantId) {
                await supabase
                    .from('student_registrations')
                    .update({
                        email_status: 'failed',
                        email_error: emailErr.message || 'Unknown Resend error'
                    })
                    .eq('id', participantId);
            }
            // Return success: true but with warning to avoid breaking registration flow
            return NextResponse.json({ success: true, warning: 'Email queued', error: emailErr.message });
        }
    } catch (error: any) {
        console.error('Internal API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
