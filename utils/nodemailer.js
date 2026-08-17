const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
dotenv.config();

// Initialize SendGrid
let useSendGrid = false;
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    useSendGrid = true;
} else {
    console.log('⚠️ SendGrid not configured, using nodemailer');
}

// Nodemailer fallback (for local development)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

const sendEmail = async (to, subject, html) => {
    try {
        if (useSendGrid) {
            // Send via SendGrid
            console.log('📧 Sending via SendGrid to:', to);

            const msg = {
                to: to,
                from: process.env.EMAIL_FROM || 'your-email@gmail.com',
                subject: subject,
                html: html,
                trackingSettings: {
                    clickTracking: { enable: false },
                    openTracking: { enable: false }
                }
            };

            const response = await sgMail.send(msg);
            console.log('✅ SendGrid sent successfully');
            return true;
        }

        // Fallback to nodemailer
        console.log('📧 Sending via Nodemailer to:', to);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Nodemailer sent:', info.messageId);
        return true;

    } catch (error) {
        console.error('❌ Email failed:');
        if (error.response) {
            console.error('SendGrid Error:', error.response.body);
        } else {
            console.error('Error:', error.message);
        }
        return false;
    }
};

module.exports = { sendEmail };