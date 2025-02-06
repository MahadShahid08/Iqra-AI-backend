import express from 'express';
import { getAudioUrls } from '../controllers/audioController.js';

const router = express.Router();

router.post('/urls', getAudioUrls);

export default router;