import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY.replace(/"/g, '') // Remove quotes if present
});

export const askQuestion = async (req, res) => {
  try {
    const { question, language } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        message: language === 'ar' 
          ? "الرجاء إدخال سؤال صالح"
          : "Please enter a valid question"
      });
    }

    // Check if question is Islamic
    const isIslamicResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in Islamic topics. Determine if the following question is related to Islam, Islamic teachings, or Muslim practices. Respond with only 'yes' or 'no'."
        },
        { role: "user", content: question }
      ]
    });

    const isIslamic = isIslamicResponse.choices[0].message.content.toLowerCase().includes('yes');

    if (!isIslamic) {
      return res.status(400).json({
        message: language === 'ar'
          ? "عذراً، هذا السؤال لا يتعلق بالإسلام. يرجى طرح سؤال يتعلق بالإسلام أو التعاليم الإسلامية."
          : "Sorry, this question is not related to Islam. Please ask a question about Islam or Islamic teachings."
      });
    }

    // Get Quranic reference
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an Islamic scholar. Provide a relevant Quranic reference for the question. 
          Response must be in this exact format without any markdown or additional text:
          {
            "Surah": number,
            "StartAyah": number,
            "EndAyah": number,
            "Verses": "Arabic text of the verses"
          }`
        },
        { role: "user", content: question }
      ]
    });

    // Parse the response carefully
    let answer;
    try {
      const cleanedContent = response.choices[0].message.content.trim();
      answer = JSON.parse(cleanedContent);
      
      // Validate the parsed JSON structure
      if (!answer.Surah || !answer.StartAyah || !answer.EndAyah || !answer.Verses) {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return res.status(500).json({
        message: language === 'ar'
          ? "عذراً، حدث خطأ في معالجة الإجابة. يرجى المحاولة مرة أخرى."
          : "Sorry, there was an error processing the answer. Please try again."
      });
    }

    return res.json({
      explanation: answer.Verses,
      verses: answer.Verses,
      surahNumber: answer.Surah,
      startAyah: answer.StartAyah,
      endAyah: answer.EndAyah
    });

  } catch (error) {
    console.error('Error in askQuestion:', error);
    
    // Handle specific OpenAI API errors
    if (error.response?.status === 429) {
      return res.status(429).json({
        message: language === 'ar'
          ? "عذراً، النظام مشغول حالياً. يرجى المحاولة بعد قليل."
          : "System is currently busy. Please try again in a moment."
      });
    }

    return res.status(500).json({
      message: language === 'ar'
        ? "عذراً، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى."
        : "Sorry, an error occurred while processing your question. Please try again."
    });
  }
};