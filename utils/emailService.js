// utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
const createTransporter = () => {
  // Log environment variables (without exposing actual values)
  console.log('Email Configuration:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not Set',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'Set' : 'Not Set'
  });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Changed to match .env file
    },
    debug: true
  });

  return transporter;
};

export const sendVerificationEmail = async (email, token) => {
  try {
    console.log('Sending verification email to:', email);
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Iqra AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Iqra AI Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #82368C;">Welcome to Iqra AI</h1>
          <p>Please verify your email address by entering the following code:</p>
          <h2 style="color: #82368C; font-size: 24px; padding: 10px; background-color: #f5f5f5; text-align: center; border-radius: 5px;">${token}</h2>
          <p>This code will expire in 24 hours.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Iqra AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Iqra AI Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #82368C;">Password Reset Request</h1>
          <p>Use the following code to reset your password:</p>
          <h2 style="color: #82368C; font-size: 24px; padding: 10px; background-color: #f5f5f5; text-align: center; border-radius: 5px;">${token}</h2>
          <p>This code will expire in 1 hour.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

// Test email configuration on startup
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
};

// Run test on module import
testEmailConfiguration();

export default {
  sendVerificationEmail,
  sendPasswordResetEmail
};