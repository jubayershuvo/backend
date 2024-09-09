import nodemailer from 'nodemailer';
import { smtp_password, smtp_username } from '../constans.js';

const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: smtp_username,
            pass: smtp_password
        }
    });

export const sendEmail = async (options) => {
    try {
        const { to, subject, html } = options;
        const mailOptions = {
            from: smtp_username,
            to,
            subject,
            html
        };
    
         await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        return false;
    }
};