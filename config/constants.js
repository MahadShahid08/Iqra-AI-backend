// config/constants.js
export const AUTH_CONSTANTS = {
  JWT_EXPIRY: '24h',
  REMEMBER_ME_EXPIRY: '30d',
  VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
};

export const EMAIL_TEMPLATES = {
  VERIFICATION: {
    subject: 'Verify Your Iqra AI Account',
    template: (token) => `
      <h1>Welcome to Iqra AI</h1>
      <p>Please verify your email address by entering the following code:</p>
      <h2 style="color: #82368C; font-size: 24px;">${token}</h2>
      <p>This code will expire in 24 hours.</p>
    `
  },
  RESET_PASSWORD: {
    subject: 'Reset Your Iqra AI Password',
    template: (token) => `
      <h1>Password Reset Request</h1>
      <p>Use the following code to reset your password:</p>
      <h2 style="color: #82368C; font-size: 24px;">${token}</h2>
      <p>This code will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  }
};

// utils/validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 letter, and 1 number
  const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return re.test(password);
};

// utils/tokens.js
import crypto from 'crypto';

export const generateToken = (length = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};