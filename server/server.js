import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'
import Jimp from 'jimp'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Institute from './models/Institute.js'
import Report from './models/Report.js'

dotenv.config()

// Connect to MongoDB
async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI
  
  if (!MONGODB_URI || MONGODB_URI.includes('127.0.0.1')) {
    console.log('Starting ephemeral in-memory MongoDB Server...')
    const mongoServer = await MongoMemoryServer.create()
    MONGODB_URI = mongoServer.getUri()
  }

  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log(`Connected to MongoDB at ${MONGODB_URI}`)
      try {
        const count = await Institute.countDocuments()
        if (count === 0) {
          console.log('Database empty, auto-seeding mock data...')
          const districts = ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"]
          const mockInstitutes = []
          for (const district of districts) {
            const basePayload = { district, isMock: true };
            mockInstitutes.push(
              { ...basePayload, name: `Mock Govt School Alpha - ${district}`, type: 'School', waterQuality: { ph: 6.5, tds: 450, turbidity: 5.5, statusDesc: 'Low/Highly Turbid' }, waterLevel: { level: 25, pumpStatus: 'Active', statusDesc: 'Low/Critical' }, solarGrid: { generation: 2, efficiency: 35, statusDesc: 'Critical: 35% efficiency' }, battery: { level: 40, health: 'Degraded' }, electricity: { isAvailable: true }, powerCuts: { history: [], frequency: 'Frequent' }, infraClimate: { temp: 32, humidity: 65 } },
              { ...basePayload, name: `Mock Govt School Beta - ${district}`, type: 'School', waterQuality: { ph: 6.9, tds: 300, turbidity: 2.5, statusDesc: 'Moderate/Slightly Turbid' }, waterLevel: { level: 45, pumpStatus: 'Inactive', statusDesc: 'Normal Level' }, solarGrid: { generation: 4, efficiency: 60, statusDesc: 'Warning: 60% efficiency' }, battery: { level: 75, health: 'Good' }, electricity: { isAvailable: true }, powerCuts: { history: [], frequency: 'Rare' }, infraClimate: { temp: 29, humidity: 55 } },
              { ...basePayload, name: `Mock District Health Centre - ${district}`, type: 'Healthcare', waterQuality: { ph: 6.2, tds: 500, turbidity: 6.0, statusDesc: 'Low/Highly Turbid' }, waterLevel: { level: 15, pumpStatus: 'Active', statusDesc: 'Critical Level' }, solarGrid: { generation: 1, efficiency: 20, statusDesc: 'Critical: 20% efficiency' }, battery: { level: 20, health: 'Replace Soon' }, electricity: { isAvailable: false }, powerCuts: { history: ['Yesterday 2PM'], frequency: 'Frequent' }, infraClimate: { temp: 34, humidity: 70 }, equipmentHealth: { medicineFridgeTemp: 9, statusDesc: 'Critical: Too Warm' } }
            )
          }
          await Institute.insertMany(mockInstitutes)
          console.log('Seeded', mockInstitutes.length, 'mock institutes')
        }
      } catch (err) {
        console.error('Auto-seed failed:', err)
      }
    })
    .catch(err => console.error('MongoDB connection error:', err))
}

connectDB()

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

    // Compress the image with Jimp to radically reduce base64 size (pure JS, safe on all OS)
    const image = await Jimp.read(req.file.buffer)
    
    // Resize down to 800px width (maintain aspect ratio) and set 80% JPEG quality
    if (image.bitmap.width > 800) {
      image.resize(800, Jimp.AUTO)
    }
    image.quality(80)

    // Jimp automatically appends the data URI prefix (data:image/jpeg;base64,...)
    const dataURI = await image.getBase64Async(Jimp.MIME_JPEG)

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
              text: "Analyze this image of any environment, object, or waste area. Identify: 1. General hygiene status. 2. Specific contaminants or pollutants visible in the image. 3. The potential waterborne or vector-borne diseases (e.g., Cholera, Typhoid, Dengue) that could outbreak if these contaminants come into contact with a local water body. Return as exactly one JSON object with keys: 'hygieneStatus' (string), 'visibleContaminants' (array of strings), and 'potentialDiseases' (array of strings). Return ONLY the JSON."
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

// Database Generation Routes
app.get('/api/institutes/seed', async (req, res) => {
  try {
    const districts = [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", 
      "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela Pendra Marwahi", "Janjgir-Champa", 
      "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur", 
      "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sakti", 
      "Sarangarh-Bilaigarh", "Sukma", "Surajpur", "Surguja", "Khairagarh-Chhuikhadan-Gandai"
    ]

    await Institute.deleteMany({ isMock: true })

    const mockInstitutes = []

    for (const district of districts) {
      // Create 2 Schools and 1 Healthcare per district
      const basePayload = { district, isMock: true };
      mockInstitutes.push(
        {
          ...basePayload,
          name: `Mock Govt School Alpha - ${district}`,
          type: 'School',
          waterQuality: { ph: 6.5, tds: 450, turbidity: 5.5, statusDesc: 'Low/Highly Turbid' },
          waterLevel: { level: 25, pumpStatus: 'Active', statusDesc: 'Low/Critical' },
          solarGrid: { generation: 2, efficiency: 35, statusDesc: 'Critical: 35% efficiency' },
          battery: { level: 40, health: 'Degraded' },
          electricity: { isAvailable: true },
          powerCuts: { history: [], frequency: 'Frequent' },
          infraClimate: { temp: 32, humidity: 65 }
        },
        {
          ...basePayload,
          name: `Mock Govt School Beta - ${district}`,
          type: 'School',
          waterQuality: { ph: 6.9, tds: 300, turbidity: 2.5, statusDesc: 'Moderate/Slightly Turbid' },
          waterLevel: { level: 45, pumpStatus: 'Inactive', statusDesc: 'Normal Level' },
          solarGrid: { generation: 4, efficiency: 60, statusDesc: 'Warning: 60% efficiency' },
          battery: { level: 75, health: 'Good' },
          electricity: { isAvailable: true },
          powerCuts: { history: [], frequency: 'Rare' },
          infraClimate: { temp: 29, humidity: 55 }
        },
        {
          ...basePayload,
          name: `Mock District Health Centre - ${district}`,
          type: 'Healthcare',
          waterQuality: { ph: 6.2, tds: 500, turbidity: 6.0, statusDesc: 'Low/Highly Turbid' },
          waterLevel: { level: 15, pumpStatus: 'Active', statusDesc: 'Critical Level' },
          solarGrid: { generation: 1, efficiency: 20, statusDesc: 'Critical: 20% efficiency' },
          battery: { level: 20, health: 'Replace Soon' },
          electricity: { isAvailable: false },
          powerCuts: { history: ['Yesterday 2PM'], frequency: 'Frequent' },
          infraClimate: { temp: 34, humidity: 70 },
          equipmentHealth: { medicineFridgeTemp: 9, statusDesc: 'Critical: Too Warm' }
        }
      )
    }

    await Institute.insertMany(mockInstitutes)

    res.json({ message: 'Successfully seeded mock institutes', count: mockInstitutes.length })
  } catch (error) {
    console.error("Seed error:", error)
    res.status(500).json({ error: 'Failed to seed database', details: error.message })
  }
})

// Fetch Institutes Route (Mock DB Data Only)
app.get('/api/institutes', async (req, res) => {
  try {
    const { district, type } = req.query
    
    if (!district) {
      return res.status(400).json({ error: 'District parameter is required' })
    }

    const query = { district }
    if (type) query.type = type

    // Fetch exclusively from MongoDB (Mocks)
    const dbInstitutes = await Institute.find(query).lean()

    res.json(dbInstitutes)
    
  } catch (error) {
    console.error("Institute Fetch Error:", error)
    res.status(500).json({ error: 'Failed to fetch institutes' })
  }
})

app.use(express.json()) // allow JSON parsing

// --- IoT Webhook Ingestion ---
app.post('/api/iot/update-data', async (req, res) => {
  try {
    const { instituteId, ...updateData } = req.body;
    if (!instituteId) return res.status(400).json({ error: 'Missing instituteId' });

    const institute = await Institute.findByIdAndUpdate(instituteId, updateData, { new: true });
    
    // Simplistic 'Auto' report logic for demonstration purposes.
    // In production, this would be a CRON job checking if a critical status persists > 7 days.
    const checkCritical = (field, componentName) => {
      if (field && field.statusDesc && field.statusDesc.toLowerCase().includes('critical')) {
        Report.findOne({ instituteId, component: componentName, status: 'Active', type: 'Auto' })
          .then(existing => {
            if (!existing) {
              Report.create({
                instituteId,
                instituteName: institute.name,
                component: componentName,
                type: 'Auto',
                description: `System auto-escalation: ${field.statusDesc} detected continuously.`,
              });
            }
          }).catch(err => console.error("Auto report error:", err))
      }
    };
    
    if (institute) {
      checkCritical(institute.waterLevel, 'Water Level');
      checkCritical(institute.waterQuality, 'Water Quality');
      checkCritical(institute.solarGrid, 'Solar Grid');
      checkCritical(institute.equipmentHealth, 'Medicine Refrigerator');
    }

    res.json({ success: true, institute });
  } catch (error) {
    console.error("IoT Update Error:", error);
    res.status(500).json({ error: 'Failed to update IoT data' });
  }
});

// --- Reports / Alert Ticketing Routes ---
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const report = await Report.create(req.body);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id/resolve', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id, 
      { status: 'Resolved', resolvedAt: new Date() }, 
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI Action Suggestion Endpoint for Tickets ---
app.post('/api/reports/:id/suggest', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    
    const targetModel = isNvidiaKey ? "meta/llama-3.2-90b-vision-instruct" : "gpt-4o";

    const response = await openai.chat.completions.create({
      model: targetModel,
      messages: [
        { role: "system", content: "You are an expert infrastructure engineer API. Provide a 2-sentence actionable diagnostic and fix for failing rural facility modules." },
        { role: "user", content: `Facility: ${report.instituteName}. Component: ${report.component}. Error: ${report.description}. What are the immediate actionable steps?` }
      ],
      max_tokens: 150
    });
    
    res.json({ suggestion: response.choices[0].message.content });
  } catch (err) {
    console.error("AI Suggestion Error:", err);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

// Global Error Handler for Express to prevent HTML stack traces and silent crashes
app.use((err, req, res, next) => {
  console.error("Global Express Error:", err)
  res.status(500).json({ error: "Server Error", details: err.message })
})

process.on('uncaughtException', err => console.error('Uncaught Exception:', err))
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err))

const PORT = 5000
app.listen(PORT, () => {
  console.log(`🚀 RESILO Backend running on http://localhost:${PORT}`)
})
