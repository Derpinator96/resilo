import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'
import Jimp from 'jimp'
import axios from 'axios'
import mongoose from 'mongoose'
import Institute from './models/Institute.js'
import { CentreData } from './models/centredata.model.js'
import { Telemetry } from './models/telemetry.model.js'
import Report from './models/Report.js'
import RoleRequest from './models/RoleRequest.js'
import AuditLog from './models/AuditLog.js'
import { requireAuth, requireStaffContext, requireRole } from './middleware/auth.js'
import { logAudit } from './utils/audit.js'
import { clerkClient } from '@clerk/clerk-sdk-node'
import centredataRoutes from './routes/centredata.route.js'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env') })

// Connect to MongoDB
async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI
  
  if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not set in environment variables.')
    process.exit(1)
  }

  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log(`Connected to MongoDB securely`)
    })
    .catch(err => {
      console.error('MongoDB connection error:', err)
      process.exit(1)
    })
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

    let parsedResult;
    try {
      // Process Llama's Markdown and conversational text wrapper to find the JSON
      // 1. Try to find content within ```json ... ``` blocks
      let extracted = resultString;
      const jsonMatch = extracted.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        extracted = jsonMatch[1];
      } else {
        // 2. If no code blocks, blindly find the first { and last }
        const startIndex = extracted.indexOf('{');
        const endIndex = extracted.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
          extracted = extracted.substring(startIndex, endIndex + 1);
        }
      }
      parsedResult = JSON.parse(extracted);
    } catch (parseError) {
      console.error("Failed to parse JSON from AI response:", resultString);
      // Fallback response if the AI refuses or returns invalid format
      parsedResult = {
        hygieneStatus: "AI Analysis Unclear (Possible Refusal)",
        visibleContaminants: ["Unable to detect correctly from AI response"],
        potentialDiseases: []
      };
    }

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

// Fetch all unique districts dynamically from CentreData
app.get('/api/districts', async (req, res) => {
  try {
    const districts = await CentreData.distinct('district')
    res.json(districts.filter(Boolean).map(d => d.trim()).sort())
  } catch (error) {
    console.error("Districts Fetch Error:", error)
    res.status(500).json({ error: 'Failed to fetch districts' })
  }
})

// Fetch Institutes Route (now dynamically from CentreData)
app.get('/api/institutes', async (req, res) => {
  try {
    const { district } = req.query
    
    if (!district) {
      return res.status(400).json({ error: 'District parameter is required' })
    }

    const centres = await CentreData.find({
      district: { $regex: new RegExp(`^${district}$`, 'i') }
    }).select('_id centreName district').lean()

    const formatted = centres.map(c => ({
      _id: c._id,
      name: c.centreName || 'Unnamed Centre',
      type: 'Solar Centre',
      district: c.district
    }))

    res.json(formatted)
    
  } catch (error) {
    console.error("Institute Fetch Error:", error)
    res.status(500).json({ error: 'Failed to fetch institutes' })
  }
})

// Fetch Single Institute by ID
app.get('/api/institutes/:id', async (req, res) => {
  try {
    const institute = await CentreData.findById(req.params.id).lean()
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' })
    }
    const formatted = {
      ...institute,
      name: institute.centreName || 'Unnamed Centre',
      type: 'Solar Centre'
    }
    res.json(formatted)
  } catch (error) {
    console.error("Single Institute Fetch Error:", error)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid Institute ID format' })
    }
    res.status(500).json({ error: 'Failed to fetch institute details' })
  }
})
app.use(express.json()) // allow JSON parsing

// --- Centredata API (Protected) ---
app.use('/api/centredata', requireAuth, requireRole(['super_admin', 'admin']), centredataRoutes);

// --- IoT Telemetry Routes ---
// POST /api/telemetry  — called by ESP32/IoT device
app.post('/api/telemetry', async (req, res) => {
  try {
    const { voltage, current, realPower, apparentPower, reactivePower, powerFactor } = req.body;
    if (voltage === undefined) return res.status(400).json({ error: "Missing fields" });

    const doc = await Telemetry.findOneAndReplace(
      {},
      { voltage, current, realPower, apparentPower, reactivePower, powerFactor, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (error) {
    console.error("Telemetry Ingestion Error:", error);
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
});

// GET /api/telemetry/latest
app.get('/api/telemetry/latest', async (req, res) => {
  try {
    const doc = await Telemetry.findOne();
    if (!doc) return res.status(404).json({ error: "No telemetry yet" });
    res.json(doc);
  } catch (error) {
    console.error("Telemetry Fetch Error:", error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// GET /api/telemetry/history
app.get('/api/telemetry/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const docs = await Telemetry.find().sort({ createdAt: -1 }).limit(limit);
    res.json(docs.reverse());
  } catch (error) {
    console.error("Telemetry History Error:", error);
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

// --- ML Forecast & Analytics Routes ---
app.get('/api/mlforecast/predict', requireAuth, async (req, res) => {
  try {
    const { centreName, district, instituteId } = req.query;

    let centre;
    if (instituteId) {
      centre = await CentreData.findById(instituteId).select("latitude longitude pvRating noOfPanels centreName district");
    } else if (centreName && district) {
      centre = await CentreData.findOne({
        centreName: { $regex: new RegExp(`^${centreName.trim()}$`, "i") },
        district:   { $regex: new RegExp(`^${district.trim()}$`, "i") }
      }).select("latitude longitude pvRating noOfPanels centreName district");
    }

    if (!centre) return res.status(404).json({ error: "Centre not found" });

    const hfUrl = process.env.HF_SPACE_URL;
    if (!hfUrl) {
      console.error("HF_SPACE_URL is undefined in .env fallback triggered");
      return res.status(500).json({ error: "HF_SPACE_URL not configured" });
    }

    const hfResp = await axios.post(
      `${hfUrl}/predict`,
      {
          latitude:   centre.latitude,
          longitude:  centre.longitude,
          pvRating:   centre.pvRating,
          noOfPanels: centre.noOfPanels
      },
      { timeout: 30000 }
    );

    res.json({
      centre: {
          name:     centre.centreName,
          district: centre.district
      },
      forecast: hfResp.data
    });

  } catch (error) {
    console.error("ML Forecast Error:", error);
    res.status(500).json({ error: 'Failed to fetch solar forecast' });
  }
});

app.get('/api/mlforecast/equipment', requireAuth, async (req, res) => {
  try {
    const { centreName, district, instituteId } = req.query;

    let centre;
    if (instituteId) {
      centre = await CentreData.findById(instituteId).select("centreName district loadsConnected");
    } else if (centreName && district) {
      centre = await CentreData.findOne({
        centreName: { $regex: new RegExp(`^${centreName.trim()}$`, "i") },
        district:   { $regex: new RegExp(`^${district.trim()}$`, "i") }
      }).select("centreName district loadsConnected");
    }

    if (!centre) return res.status(404).json({ error: "Centre not found" });

    const loads = centre.loadsConnected || [];

    const shadowlessLamp = loads.find(l =>
        l.typeOfLoad?.toLowerCase().includes("shadowless") ||
        l.typeOfLoad?.toLowerCase().includes("shadow less") ||
        l.typeOfLoad?.toLowerCase().includes("ot light") ||
        l.typeOfLoad?.toLowerCase().includes("operation theatre lamp")
    );

    const babyWarmer = loads.find(l =>
        l.typeOfLoad?.toLowerCase().includes("baby warmer") ||
        l.typeOfLoad?.toLowerCase().includes("infant warmer") ||
        l.typeOfLoad?.toLowerCase().includes("radiant warmer")
    );

    res.json({
        centre: {
            name:     centre.centreName,
            district: centre.district
        },
        equipment: {
            shadowlessLamp: shadowlessLamp ? {
                typeOfLoad:       shadowlessLamp.typeOfLoad,
                ratingOfLoad:     shadowlessLamp.ratingOfLoad,
                numberOfLoad:     shadowlessLamp.numberOfLoad,
                hoursPerDelivery: 2
            } : null,
            babyWarmer: babyWarmer ? {
                typeOfLoad:       babyWarmer.typeOfLoad,
                ratingOfLoad:     babyWarmer.ratingOfLoad,
                numberOfLoad:     babyWarmer.numberOfLoad,
                hoursPerDelivery: 6
            } : null
        },
        allLoads: loads.map(l => ({
            typeOfLoad:   l.typeOfLoad,
            ratingOfLoad: l.ratingOfLoad,
            numberOfLoad: l.numberOfLoad,
            criticalLoad: l.criticalLoad
        }))
    });

  } catch (error) {
    console.error("Equipment Data Error:", error);
    res.status(500).json({ error: 'Failed to fetch equipment data' });
  }
});

// --- Reports / Alert Ticketing Routes ---
app.get('/api/reports', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', requireAuth, requireStaffContext, async (req, res) => {
  try {
    if (req.body.type === 'Auto') {
      // Prevent flood vectors: Check if an Active auto-report for this component already exists
      const existing = await Report.findOne({
        instituteId: req.body.instituteId,
        component: req.body.component,
        status: 'Active',
        type: 'Auto'
      });
      if (existing) {
        return res.json({ message: "Active report already exists, skipping." });
      }
    }
    const report = await Report.create(req.body);
    
    // Audit Log creation
    await logAudit(req.user.id, "CREATE", "Reports", report._id, null, report);
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id/resolve', requireAuth, requireStaffContext, async (req, res) => {
  try {
    const originalReport = await Report.findById(req.params.id);
    if (!originalReport) return res.status(404).json({ error: 'Report not found' });
    
    // Enforce facility mismatch here if staff is trying to resolve report for another facility
    if (req.user.role === 'staff' && req.user.facility_id !== originalReport.instituteId?.toString()) {
      return res.status(403).json({ error: 'Forbidden: Facility mismatch for this report' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id, 
      { status: 'Resolved', resolvedAt: new Date() }, 
      { new: true }
    );
    
    // Audit Log resolution
    await logAudit(req.user.id, "RESOLVE", "Reports", report._id, originalReport, report);
    
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

// --- Global Chatbot Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Valid messages array is required' });
    }

    const systemPrompt = "You are the 'Resilo' Crisis Expert for Chhattisgarh. RESPONSE RULES: 1. LANGUAGE: Respond in the SAME language as the user's question (Hindi/English/Hinglish). 2. STRUCTURE: 🚀 RELIEF: Immediate safety step. ⚠️ DANGER: Health risks (e.g. Cholera, Typhoid). 🛠️ ACTION: Instant fix. 📞 CALL: Use real CG numbers: PHED 1800-233-0008, Health 108, CSEB 1912. 3. STYLE: Use BIG icons. Bold text. NO MARKDOWN symbols like asterisks. Max 60 words.";

    // Prepend the system prompt invisibly to the user messages array
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const targetModel = isNvidiaKey ? "meta/llama-3.2-90b-vision-instruct" : "gpt-4o";

    const response = await openai.chat.completions.create({
      model: targetModel,
      messages: apiMessages,
      max_tokens: 200, // Keep short as requested
      temperature: 0.3 // Keep factual
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("Chat API Error:", err);
    res.status(500).json({ error: 'Failed to process chat response' });
  }
});

// --- Audit Logs Route ---
app.get('/api/audit-logs', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Role Request Routes ---
app.post('/api/role-requests', requireAuth, async (req, res) => {
  try {
    const { requestedRole, requestedInstituteId, clerkUserEmail } = req.body;
    
    const existing = await RoleRequest.findOne({ clerkUserId: req.user.id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending access request.' });
    }

    const request = await RoleRequest.create({
      clerkUserId: req.user.id,
      clerkUserEmail,
      requestedRole,
      requestedInstituteId
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/role-requests', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    let query = { status: 'pending' };
    
    if (req.user.role === 'admin') {
      if (!req.user.facility_id) {
        return res.status(403).json({ error: 'Admin has no assigned facility context' });
      }
      query.requestedInstituteId = req.user.facility_id;
      query.requestedRole = { $ne: 'admin' };
    }

    const requests = await RoleRequest.find(query).populate('requestedInstituteId', 'centreName district').sort({ createdAt: -1 });
    const mappedRequests = requests.map(r => {
      const doc = r.toObject();
      if (doc.requestedInstituteId) {
        doc.requestedInstituteId.name = doc.requestedInstituteId.centreName || 'Unnamed Centre';
      }
      return doc;
    });
    res.json(mappedRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/role-requests/:id/resolve', requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await RoleRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request is already resolved' });

    if (req.user.role === 'admin') {
      if (request.requestedRole === 'admin') {
        return res.status(403).json({ error: 'Only super_admin can approve admin requests' });
      }
      if (request.requestedInstituteId.toString() !== req.user.facility_id) {
        return res.status(403).json({ error: 'Facility mismatch. Cannot approve requests for other facilities.' });
      }
    }

    request.status = status;
    request.reviewedBy = req.user.id;
    await request.save();

    if (status === 'approved') {
      await clerkClient.users.updateUserMetadata(request.clerkUserId, {
        publicMetadata: {
          role: request.requestedRole,
          facility_id: request.requestedInstituteId.toString()
        }
      });
      await logAudit(req.user.id, "UPDATE", "Users (Clerk)", request.clerkUserId, null, { role: request.requestedRole, facility_id: request.requestedInstituteId });
    }

    await logAudit(req.user.id, "RESOLVE", "RoleRequests", request._id, { status: 'pending' }, { status });

    res.json(request);
  } catch (err) {
    console.error("Resolve Error:", err);
    res.status(500).json({ error: err.message });
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
