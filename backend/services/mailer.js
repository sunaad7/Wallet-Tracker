const nodemailer = require("nodemailer");
const { Resend } = require("resend");

let transporter = null;
let resend = null;

const isSmtpConfigured = () =>
    Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );

const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY);

const isMailConfigured = () => isSmtpConfigured() || isResendConfigured();

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: (process.env.SMTP_SECURE || "").toLowerCase() === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return transporter;
};

const getResend = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const fromAddress = () =>
    process.env.MAIL_FROM || "Wallet Tracker <noreply@wallettracker.app>";

const buildResetEmail = (to, name, code) => ({
    to,
    subject: "Your Wallet Tracker password reset code",
    text:
        `Hi ${name || "there"},\n\n` +
        `We received a request to reset your Wallet Tracker password.\n\n` +
        `Your reset code is: ${code}\n\n` +
        `This code expires in 10 minutes. If you didn't request a reset, you can safely ignore this email — your password won't change.\n\n` +
        `— The Wallet Tracker team`,
    html:
        `<p>Hi ${name || "there"},</p>` +
        `<p>We received a request to reset your Wallet Tracker password. Enter this code to continue:</p>` +
        `<p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0;">${code}</p>` +
        `<p>This code expires in <strong>10 minutes</strong>. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>` +
        `<p>— The Wallet Tracker team</p>`
});

const sendViaSmtp = async (to, name, code) => {
    const message = buildResetEmail(to, name, code);
    await getTransporter().sendMail({
        from: fromAddress(),
        ...message
    });
    return true;
};

const sendViaResend = async (to, name, code) => {
    const message = buildResetEmail(to, name, code);
    const { error } = await getResend().emails.send({
        from: fromAddress(),
        ...message
    });
    if (error) {
        console.error("Failed to send reset email via Resend:", error.message);
        return false;
    }
    return true;
};

const sendResetCodeEmail = async (to, name, code) => {
    if (!isMailConfigured()) {
        return false;
    }

    // Prefer SMTP when configured; fall back to Resend.
    if (isSmtpConfigured()) {
        try {
            return await sendViaSmtp(to, name, code);
        } catch (err) {
            console.error("Failed to send reset email via SMTP:", err.message);
            return false;
        }
    }

    try {
        return await sendViaResend(to, name, code);
    } catch (err) {
        console.error("Failed to send reset email via Resend:", err.message);
        return false;
    }
};

module.exports = { isMailConfigured, sendResetCodeEmail };