import express from 'express';
import { askQuestion } from '../controllers/questionController.js';

const router = express.Router();

router.post('/ask', askQuestion);

export default router;