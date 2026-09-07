import nodemailer from "nodemailer";

const hasMailConfig = !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;

const transporter = hasMailConfig
  ? nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    })
  : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.warn("Email not sent: Gmail credentials are not configured.");
    return { accepted: [to] };
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
}

export async function sendInvitationEmail(email: string, token: string) {
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl.replace(/\/$/, "")}/accept-invitation?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "You have been invited to StudyPal",
    html: `
      <h2>Welcome to StudyPal</h2>
      <p>Your account has been created.</p>
      <p>Click the button below to set your password and activate your account.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Set my password</a></p>
      <p>This invitation will expire in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const appUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Reset your StudyPal password",
    html: `
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your StudyPal account.</p>
      <p>Click the button below to choose a new password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p>This link expires in 60 minutes.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
}
