import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await resend.emails.send({
            from: 'Visly <onboarding@yourdomain.com>',
            to: email,
            subject: 'Welcome to Visly Analytics 🚀',
            html: `
        <div style="font-family: sans-serif; color: #333;">
          <h1 style="color: #16a34a;">Welcome to Visly, ${name}!</h1>
          <p>We are thrilled to have you on board.</p>
          <p>Visly helps you track your web analytics with a clean, open-source dashboard.</p>
          <br />
          <a href="https://your-domain.com/dashboard" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
      `,
        });
        console.log(`📧 Welcome email sent to ${email}`);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}