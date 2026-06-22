const { sql } = require('@vercel/postgres');
const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).send(`Method ${req.method} Not Allowed`);
    }

    const { hrname, email, company, message } = req.body;

    if (!hrname || !email || !message) {
        return res.status(400).send("Please fill in all required fields.");
    }

    let dbSaved = false;
    let dbError = null;

    // 1. Attempt to save to Vercel Postgres
    if (process.env.POSTGRES_URL) {
        try {
            // Create table if it doesn't exist
            await sql`
                CREATE TABLE IF NOT EXISTS hr_requests (
                    id SERIAL PRIMARY KEY,
                    hrname VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    company VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;

            // Insert HR Inquiry
            await sql`
                INSERT INTO hr_requests (hrname, email, company, message)
                VALUES (${hrname}, ${email}, ${company || ''}, ${message});
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
                replyTo: email, // Directly reply to the HR sender
                subject: `[Portfolio Inquiry] Job/Internship Request from ${hrname}`,
                text: `You have received a new HR Inquiry on your portfolio website:\n\nHR Name: ${hrname}\nCompany: ${company || 'Not provided'}\nCompany Email: ${email}\n\nMessage:\n${message}\n`
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
        return res.status(200).send("HR request sent successfully and saved to local DB!");
    } else if (dbSaved && !emailSent) {
        return res.status(200).send(`HR request saved to DB! (Email check: ${emailError})`);
    } else if (!dbSaved && emailSent) {
        return res.status(200).send(`HR inquiry notification emailed! (Database check: ${dbError})`);
    } else {
        return res.status(500).send(`Submission failed. Please connect Vercel Storage and configure EMAIL credentials. Details: DB (${dbError}) | Email (${emailError})`);
    }
};
