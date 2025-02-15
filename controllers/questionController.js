import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY.replace(/"/g, '') // Remove quotes if present
});

export const askQuestion = async (req, res) => {
  try {
    const { question, language } = req.body;

    // First, check if the question is Islamic
    const isIslamicResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Determine if the following question is related to Islam." },
        { role: "user", content: question }
      ]
    });

    const isIslamic = isIslamicResponse.choices[0].message.content.toLowerCase().includes('islam');

    if (!isIslamic) {
      return res.status(400).json({
        message: language === 'ar' 
          ? "عذراً، لا يمكنني فهم السؤال. هل يمكنك إعادة صياغته؟"
          : "Sorry, I am unable to understand. Can you please rephrase it?"
      });
    }

    // Get Islamic answer
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: 'Answer the following question with reference to the Quran in the following JSON format: {"Surah": <Surah Number>, "StartAyah": <Start Ayah>, "EndAyah": <End Ayah>, "Verses": "<Name of Surah>"}'
        },
        { role: "user", content: question }
      ]
    });

    const answer = JSON.parse(response.choices[0].message.content);

    return res.json({
      explanation: response.choices[0].message.content,
      verses: answer.Verses,
      surahNumber: answer.Surah,
      startAyah: answer.StartAyah,
      endAyah: answer.EndAyah
    });
  } catch (error) {
    console.error('Error in askQuestion:', error);
    res.status(500).json({
      message: "An error occurred while processing your question."
    });
  }
};