import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL MOCK] To:", to, "Subject:", subject);
    return { id: "mock-email-id" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || "Viaje Lite <bookings@viaje-lite.com>",
      to,
      subject,
      html,
    });
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Email send failed:", e);
    return null;
  }
}
