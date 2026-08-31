const { Resend } = require("resend");

let resend = null;

const isMailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const getResend = () => {
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
};

const fromAddress = () =>
    process.env.MAIL_FROM || "Wallet Tracker <onboarding@resend.dev>";

const sendResetCodeEmail = async (to, name, code) => {
    if (!isMailConfigured()) {
        return false;
    }

    try {
        const { error } = await getResend().emails.send({
            from: fromAddress(),
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
        if (error) {
            console.error("Failed to send reset email via Resend:", error.message);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Failed to send reset email via Resend:", err.message);
        return false;
    }
};

module.exports = { isMailConfigured, sendResetCodeEmail };
