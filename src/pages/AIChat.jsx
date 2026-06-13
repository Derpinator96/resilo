import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Bot, Send, MapPin, Zap, ArrowLeft } from "lucide-react"
import MeshBackground from "../components/MeshBackground"

// Build a compact summary string from the institute object for the context badge
function buildContextSummary(inst) {
    if (!inst) return null
    const name = inst.centreName || inst.name || "Unknown Facility"
    const district = inst.district || ""
    const pvKw = inst.pvRating
        ? `${((inst.pvRating * (inst.noOfPanels || 1)) / 1000).toFixed(1)} kWp`
        : null
    const panels = inst.noOfPanels ? `${inst.noOfPanels} panels` : null
    const parts = [name, district, pvKw, panels].filter(Boolean)
    return parts.join(" · ")
}

// Build a sanitized context payload to send to the backend (strip images/bulky fields)
function buildContextPayload(inst) {
    if (!inst) return null

    // Latest solar generation (last 3 months)
    const recentSolar = (inst.actualsolargeneration || []).slice(-3).map(e => `${e.month}: ${e.generation} kWh`)
    const recentIdeal = (inst.solargeneration || []).slice(-3).map(e => `${e.month}: ${e.generation} kWh`)
    const recentGrid  = (inst.gridconsumption || []).slice(-3).map(e => `${e.month}: ${e.consumption} kWh`)

    // Critical loads
    const criticalLoads = (inst.loadsConnected || [])
        .filter(l => l.criticalLoad)
        .map(l => `${l.typeOfLoad} (${l.numberOfLoad}× ${l.ratingOfLoad}W)`)

    // All loads summary
    const allLoads = (inst.loadsConnected || [])
        .filter(l => l.numberOfLoad > 0)
        .map(l => `${l.typeOfLoad}: ${l.numberOfLoad}× ${l.ratingOfLoad}W${l.criticalLoad ? ' [CRITICAL]' : ''}`)

    return {
        facilityName: inst.centreName || inst.name || "Unknown",
        district: inst.district || "Unknown",
        latitude: inst.latitude,
        longitude: inst.longitude,
        month: inst.month,
        monthlyEnergyConsumption: inst.monthlyEnergyConsumption,
        pvRatingPerPanel: inst.pvRating,
        noOfPanels: inst.noOfPanels,
        totalCapacityKwp: inst.pvRating && inst.noOfPanels
            ? ((inst.pvRating * inst.noOfPanels) / 1000).toFixed(2)
            : null,
        pvManufacturer: inst.pvSystemake,
        pvVoltage: inst.pvVoltage,
        dateOfInstallation: inst.dateOfInstallation,
        battery: inst.battery,
        inverter: inst.inverter,
        recentActualSolarGeneration: recentSolar,
        recentIdealSolarGeneration: recentIdeal,
        recentGridConsumption: recentGrid,
        criticalLoads,
        allLoads,
        additionalInfo: inst.additionalInfo || {},
        remarks: inst.remarks,
    }
}

export default function AIChat() {
    const navigate = useNavigate()
    const location = useLocation()
    const institute = location.state?.institute || null
    const contextPayload = buildContextPayload(institute)
    const contextSummary = buildContextSummary(institute)

    const messagesEndRef = useRef(null)

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: institute
                ? `Hello! I'm your AI Copilot for **${institute.centreName || institute.name || 'this facility'}**. I have full context on its solar system, battery bank, inverter, loads, and energy data. Ask me anything — what does a reading mean, is performance on track, what should be checked next?`
                : "Hello! I am your sustainability AI assistant. Ask me anything about energy, solar, or sanitation."
        }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const updatedMessages = [
            ...messages,
            { role: "user", content: input }
        ]

        setMessages(updatedMessages)
        setInput("")
        setLoading(true)

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages,
                    context: contextPayload
                })
            })

            const data = await response.json()

            setMessages([
                ...updatedMessages,
                { role: "assistant", content: data.reply }
            ])
        } catch (error) {
            setMessages([
                ...updatedMessages,
                { role: "assistant", content: "AI service unavailable. Please try again." }
            ])
        }

        setLoading(false)
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="relative min-h-[calc(100vh-36px)] flex flex-col font-sans">
            <MeshBackground />

            <div className="relative z-10 flex flex-col flex-1 pt-[92px] px-4 lg:px-8 pb-8">
                <div className="max-w-2xl w-full mx-auto flex flex-col flex-1">

                    {/* Header */}
                    <header className="mb-6 shrink-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 mb-4 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>

                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0A192F]">
                            AI Sustainability Copilot
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Context-aware insights powered by NVIDIA NIM
                        </p>
                    </header>

                    {/* Context Badge */}
                    {contextSummary && (
                        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-teal-50/80 backdrop-blur-sm border border-teal-200 rounded-xl shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 text-teal-600 shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 mb-0.5">FACILITY CONTEXT LOADED</p>
                                <p className="text-sm font-semibold text-teal-900 truncate capitalize">{contextSummary}</p>
                            </div>
                            <Zap size={14} className="shrink-0 text-teal-400 ml-auto" />
                        </div>
                    )}

                    {/* Chat Card */}
                    <div className="flex flex-col flex-1 min-h-0 bg-white/70 backdrop-blur-md border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden">

                        {/* Messages */}
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1 mr-2">
                                            <Bot size={14} className="text-teal-600" />
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-3 text-sm rounded-2xl max-w-[80%] ${
                                            msg.role === "user"
                                                ? "bg-[#0A192F] text-white rounded-br-md"
                                                : "bg-slate-100 text-slate-800 rounded-bl-md"
                                        }`}
                                    >
                                        <div className="whitespace-pre-line leading-relaxed">
                                            {msg.content.replace(/\*+/g, '')}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                                        <Bot size={14} className="text-teal-600" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-md">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-200 bg-white/50 shrink-0">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={institute ? `Ask about ${(institute.centreName || institute.name || 'this facility')}...` : "Ask about energy, water, sanitation..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 disabled:opacity-50 transition-all"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim()}
                                    className="flex items-center justify-center px-4 bg-[#0A192F] text-white rounded-xl hover:bg-[#0A192F]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Info Card */}
                    <div className="flex items-center gap-4 p-4 mt-4 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl shrink-0">
                        <Bot className="text-teal-500 shrink-0" size={24} />
                        <div>
                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">AI CAPABILITY</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {institute ? "Facility-specific diagnostics, metrics interpretation & recommendations" : "Energy, sanitation & sustainability insights"}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}