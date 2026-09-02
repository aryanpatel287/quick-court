import { google } from 'googleapis';
import envConfig from '../../config/env.config.js';

let gmail;

try {
    const oauth2Client = new google.auth.OAuth2(
        envConfig.GOOGLE_CLIENT_ID,
        envConfig.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
        refresh_token: envConfig.GOOGLE_REFRESH_TOKEN,
    });

    gmail = google.gmail({
        version: 'v1',
        auth: oauth2Client,
    });

    console.log('Gmail API client initialized');
} catch (error) {
    console.error('Error initializing Gmail API client: ', error);
    throw error;
}

export const sendEmailUsingGmailAPI = async ({ to, subject, html, text }) => {
    try {
        if (!gmail) {
            throw new Error('Gmail API client is not initialized');
        }

        const messageParts = [
            `From: ${envConfig.GOOGLE_SENDER_EMAIL}`,
            `To: ${to}`,
            'Content-Type: text/html; charset=UTF-8',
            'MIME-Version: 1.0',
            `Subject: ${subject}`,
            '',
            html || text,
        ];

        const message = messageParts.join('\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        return {
            success: true,
            messageId: response.data.id,
            message: 'email sent successfully to ' + to,
        };
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error;
    }
};
