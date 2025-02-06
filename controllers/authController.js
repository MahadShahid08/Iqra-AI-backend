import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();



// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
  }
});
// Add this after creating the transporter
transporter.verify(function(error, success) {
  if (error) {
    console.log("Server connection error: ", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

// Helper function to generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to verify token
const verifyAuthToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const verificationCode = generateVerificationCode();
      const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);

      // Create new user with all required fields properly initialized
      const user = new User({
        name,
        email,
        password,
        verificationCode: hashedVerificationCode,
        verificationCodeExpiry: Date.now() + 3600000, // 1 hour
        isVerified: false,
        favoriteReciter: {
          id: null,
          name: null,
          nameAr: null,
          baseUrl: null
        }
      });

      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your Iqra AI account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #82368C;">Welcome to Iqra AI</h1>
            <p>Your verification code is:</p>
            <h2 style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${verificationCode}
            </h2>
            <p>Enter this code in your Iqra AI app to verify your account.</p>
            <p>This code will expire in 1 hour.</p>
          </div>
        `
      });

      res.status(201).json({ 
        message: 'Registration successful. Please check your email for verification code.',
        userId: user._id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ 
          message: 'Please verify your email first',
          userId: user._id
        });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          favoriteReciter: user.favoriteReciter
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  },

  // Verify email with code
  verifyEmail: async (req, res) => {
    try {
      const { userId, code } = req.body;
      const user = await User.findById(userId);

      if (!user || !user.verificationCode) {
        return res.status(400).json({ message: 'Invalid verification request' });
      }

      if (user.verificationCodeExpiry < Date.now()) {
        return res.status(400).json({ message: 'Verification code has expired' });
      }

      const isValidCode = await bcrypt.compare(code, user.verificationCode);
      if (!isValidCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpiry = undefined;
      await user.save();

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          favoriteReciter: user.favoriteReciter
        }
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  },

  // Resend verification code
  resendVerificationCode: async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'User is already verified' });
      }

      const newVerificationCode = generateVerificationCode();
      const hashedVerificationCode = await bcrypt.hash(newVerificationCode, 10);

      user.verificationCode = hashedVerificationCode;
      user.verificationCodeExpiry = Date.now() + 3600000;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'New Verification Code - Iqra AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #82368C;">Iqra AI Verification</h1>
            <p>Your new verification code is:</p>
            <h2 style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${newVerificationCode}
            </h2>
            <p>This code will expire in 1 hour.</p>
          </div>
        `
      });

      res.json({ message: 'New verification code sent successfully' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification code' });
    }
  },

  // Request password reset
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const resetCode = generateVerificationCode();
      const hashedResetCode = await bcrypt.hash(resetCode, 10);

      user.resetCode = hashedResetCode;
      user.resetCodeExpiry = Date.now() + 3600000;
      await user.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Iqra AI Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #82368C;">Password Reset Code</h1>
            <p>Your password reset code is:</p>
            <h2 style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${resetCode}
            </h2>
            <p>Enter this code in your Iqra AI app to reset your password.</p>
            <p>This code will expire in 1 hour.</p>
          </div>
        `
      });

      res.json({ 
        message: 'Password reset code sent to your email',
        userId: user._id
      });
    } catch (error) {
      console.error('Reset request error:', error);
      res.status(500).json({ message: 'Failed to process reset request' });
    }
  },

  // Reset password with code
  resetPassword: async (req, res) => {
    try {
      const { userId, code, newPassword } = req.body;

      const user = await User.findOne({
        _id: userId,
        resetCodeExpiry: { $gt: Date.now() }
      });

      if (!user || !user.resetCode) {
        return res.status(400).json({ message: 'Invalid or expired reset code' });
      }

      const isValidCode = await bcrypt.compare(code, user.resetCode);
      if (!isValidCode) {
        return res.status(400).json({ message: 'Invalid reset code' });
      }

      user.password = newPassword;
      user.resetCode = undefined;
      user.resetCodeExpiry = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  },

  // Update favorite reciter
  updateReciter: async (req, res) => {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ message: 'Authentication required' });
      }
  
      const { reciter } = req.body;
      console.log('Received reciter data:', reciter); // Add this log
  
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Make sure all fields are being set
      user.favoriteReciter = {
        id: reciter.id,
        name: reciter.name,
        nameAr: reciter.nameAr,
        baseUrl: reciter.baseUrl
      };
  
      console.log('Saving user with reciter:', user.favoriteReciter); // Add this log
      await user.save();
  
      res.json({
        message: 'Reciter updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          favoriteReciter: user.favoriteReciter
        }
      });
    } catch (error) {
      console.error('Update reciter error:', error);
      res.status(500).json({ message: 'Failed to update reciter' });
    }
  },

  // Verify auth token
  verifyToken: async (req, res) => {
    try {
      const decoded = verifyAuthToken(req);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          favoriteReciter: user.favoriteReciter
        }
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({ message: 'Token verification failed' });
    }
  }
};