import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'

dotenv.config()

const app = express()
app.use(cors())

// Use memory storage for Multer to access the file buffer directly without saving to disk
const upload = multer({ storage: multer.memoryStorage() })

// Initialize Configuration dynamically based on API Key type
const apiKey = process.env.OPENAI_API_KEY || ''
const isNvidiaKey = apiKey.startsWith('nvapi-')

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: isNvidiaKey ? "https://integrate.api.nvidia.com/v1" : undefined,
})

app.post('/api/sanitation/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    // Convert multer buffer to base64 string
    const base64Image = req.file.buffer.toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`

    // If using an NVIDIA key, we must use an NVIDIA-hosted vision model instead of gpt-4o
    const targetModel = isNvidiaKey ? "meta/llama-3.2-90b-vision-instruct" : "gpt-4o"

    // Some endpoints may not strictly support the response_format flag, but we'll try to enforce JSON via the prompt.
    // Llama 3.2 on NVIDIA NIM supports the json_object format in newer version, but passing it might throw validation errors on some non-openai models.
    const responseFormatParams = isNvidiaKey ? {} : { response_format: { type: "json_object" } }

    const response = await openai.chat.completions.create({
      model: targetModel,
      ...responseFormatParams,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this image of a rural school/health facility sanitation area. Determine its hygiene status. Return exactly one JSON object with these keys: 'hygieneScore' (number 0-100), 'status' (string), and 'detectedIssues' (array of strings). Return ONLY the JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: dataURI,
              },
            },
          ],
        },
      ],
      max_tokens: 1024,
    })

    let resultString = response.choices[0].message.content

    // Process Llama's Markdown and conversational text wrapper to find the JSON
    // 1. Try to find content within ```json ... ``` blocks
    const jsonMatch = resultString.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      resultString = jsonMatch[1];
    } else {
      // 2. If no code blocks, blindly find the first { and last }
      const startIndex = resultString.indexOf('{');
      const endIndex = resultString.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        resultString = resultString.substring(startIndex, endIndex + 1);
      }
    }

    const parsedResult = JSON.parse(resultString)

    res.json(parsedResult)

  } catch (error) {
    console.error("OpenAI API Error details:", error.response ? error.response.data : error)
    res.status(500).json({ 
      error: 'Failed to analyze image.', 
      details: error.message || error.toString()
    })
  }
})

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 RESILO Backend running on http://localhost:${PORT}`)
})
