import envConfig from '../../config/env.config.js';
import nodemailer from 'nodemailer';

// NodeMailer Service Using the GmailApi
let nodeMailerTransporter;
const shouldInitNodeMailer = process.env.NODE_ENV === 'development';

if (shouldInitNodeMailer) {
    nodeMailerTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: envConfig.GOOGLE_SENDER_EMAIL,
            clientId: envConfig.GOOGLE_CLIENT_ID,
            clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
            refreshToken: envConfig.GOOGLE_REFRESH_TOKEN,
        },
    });

    nodeMailerTransporter
        .verify()
        .then(() => {
            console.log('email server is ready to send email');
        })
        .catch((error) => {
            console.error('Error connecting to the email server', error);
        });
}

async function sendEmailWithNodeMailer({ to, subject, html, text }) {
    if (!nodeMailerTransporter) {
        throw new Error('NodeMailer is not initialized. NODE_ENV must be "development".');
    }

    const mailOptions = {
        from: envConfig.GOOGLE_SENDER_EMAIL,
        to,
        subject,
        html,
        text,
    };

    await nodeMailerTransporter.sendMail(mailOptions);
    console.log('email sent successfully');
    return {
        message: 'email sent successfully to ' + to,
    };
}

export { sendEmailWithNodeMailer };
