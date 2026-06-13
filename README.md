# Resilo — Real-Time Solar Infrastructure Monitoring

> Climatathon 2026 | Team Luminova | NIT Raipur | Government of Chhattisgarh | UNICEF

## Project Overview
Resilo addresses a critical challenge in rural healthcare infrastructure: ensuring reliable, uninterrupted power for life-saving equipment at Primary Health Centres (PHCs), Community Health Centres (CHCs), and Civil Hospitals across Chhattisgarh. 

By integrating IoT telemetry, AI-driven climate forecasting, and automated compliance auditing, Resilo transforms passive solar infrastructure into an active, intelligent, and resilient energy grid. It proactively detects anomalies, predicts solar energy generation using XGBoost, and provides authorities with a unified state-level dashboard for real-time monitoring and resource allocation.

## Application Pages
| Route | Page | Access |
|-------|------|--------|
| `/` | Landing Page | Public |
| `/dashboard` | Global Dashboard | Authenticated |
| `/solar-forecast` | Solar Forecast & Energy Planner | Authenticated |
| `/institute/:id` | Facility IoT Detail View | Authenticated |
| `/authority` | Authority Dashboard | admin / super_admin |
| `/sanitation` | AI Sanitation Scanner | Authenticated |
| `/api-docs` | API Documentation | Public |

## Team Members
| Name | Role |
|------|------|
| Anurag Verma | Full Stack & AI/IoT Integration |
| Kalyan Deb | ML & Embedded Systems |
| Debanjan Mazumder | Hardware & IoT |
| Ketan Sharma | IoT Infrastructure & Telemetry |
| Anish Jaiswal | Frontend & UX |
| Satyam Trivedi | UI/UX Engineering |

## Tech Stack
- **Frontend Core:** Vite + React, react-router-dom
- **Styling & UI:** Tailwind CSS, GSAP (Animations), DM Sans / Inter, MeshBackground
- **Data Visualization:** recharts
- **Authentication:** Clerk
- **Backend & Database:** Node.js, Express, MongoDB
- **AI / ML & APIs:** HuggingFace XGBoost, Open-Meteo (Live Weather), NVIDIA NIM (Llama 3), OpenAI GPT-4o Vision

## Roles & Access
Resilo uses robust role-based access control managed via Clerk's `publicMetadata.role`:
- `community` — standard authenticated user, access to dashboard and facility views.
- `admin` — access to Authority Dashboard tabs including Manage Data (`UpdateCentre`).
- `super_admin` — full access including all admin capabilities.

## Installation Guide

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd resilo1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory (see the section below for details) and add your keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## Environment Variables
Ensure the following variables are present in your `.env` or `.env.local` file:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `MONGODB_URI`
- `HF_SPACE_URL`
- `NVIDIA_NIM_API_KEY`
- `OPENAI_API_KEY`
- `CLOUDINARY_URL`

## Deployment
This project is built using Vite. To create a production build:
```bash
npm run build
```
The resulting `/dist` folder can be hosted on any static hosting platform (Vercel, Netlify, AWS S3) alongside the Node/Express backend container.

## Live Demo
https://resilo.app

## API Documentation
https://resilo.app/api-docs
