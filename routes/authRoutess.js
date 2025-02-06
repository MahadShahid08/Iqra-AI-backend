import express from 'express';
import { authController } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/reset-request', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-verification', authController.resendVerificationCode);


// Protected routes
router.get('/verify-token', authController.verifyToken);
router.put('/update-reciter', authController.updateReciter);

export default router;