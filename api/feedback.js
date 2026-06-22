const { sql } = require('@vercel/postgres');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).send(`Method ${req.method} Not Allowed`);
    }

    const { name, city, feedback } = req.body;

    if (!name || !feedback) {
        return res.status(400).send("Please fill in all required fields.");
    }

    let dbSaved = false;
    let dbError = null;

    // 1. Attempt to save to Vercel Postgres
    if (process.env.POSTGRES_URL) {
        try {
            // Create table if it doesn't exist
            await sql`
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    city VARCHAR(255) NOT NULL,
                    feedback TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Insert feedback
            await sql`
                INSERT INTO feedback (name, city, feedback)
                VALUES (${name}, ${city || ''}, ${feedback});
            `;
            dbSaved = true;
        } catch (err) {
            console.error("Vercel Postgres Error:", err);
            dbError = err.message;
        }
    } else {
        dbError = "Vercel Postgres database is not connected in Vercel Storage.";
    }

    // 2. Attempt to send email via SMTP (Nodemailer)
    let emailSent = false;
    let emailError = null;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            await transporter.sendMail({
                from: `"Portfolio Website" <${process.env.EMAIL_USER}>`,
                to: 'shivdattvanmane@gmail.com',
                replyTo: 'shivdattvanmane@gmail.com',
                subject: `[Portfolio Feedback] New Feedback from ${name}`,
                text: `You have received new feedback on your portfolio website:\n\nName: ${name}\nCity: ${city || 'Not provided'}\nFeedback:\n${feedback}\n`
            });
            emailSent = true;
        } catch (err) {
            console.error("Nodemailer Error:", err);
            emailError = err.message;
        }
    } else {
        emailError = "EMAIL_USER and EMAIL_PASS environment variables are not configured in Vercel settings.";
    }

    // 3. Formulate response message
    if (dbSaved && emailSent) {
        return res.status(200).send("Feedback sent successfully and saved to local DB!");
    } else if (dbSaved && !emailSent) {
        return res.status(200).send(`Feedback saved to DB! (Email check: ${emailError})`);
    } else if (!dbSaved && emailSent) {
        return res.status(200).send(`Feedback notification emailed! (Database check: ${dbError})`);
    } else {
        return res.status(500).send(`Submission failed. Please connect Vercel Storage and configure EMAIL credentials. Details: DB (${dbError}) | Email (${emailError})`);
    }
};
