import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bot, Send } from "lucide-react"

export default function AIChat() {

    const navigate = useNavigate()

    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hello! I am your sustainability AI assistant. Ask me anything." }
    ])

    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const sendMessage = async () => {

        if (!input.trim()) return

        const updatedMessages = [
            ...messages,
            { role: "user", content: input }
        ]

        setMessages(updatedMessages)
        setInput("")
        setLoading(true)

        try {

            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: updatedMessages
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
                { role: "assistant", content: "AI service unavailable." }
            ])

        }

        setLoading(false)
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") sendMessage()
    }

    return (
        <div className="min-h-screen px-4 py-8 bg-gray-50 lg:px-8">

            <div className="max-w-xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-2 mb-8 text-sm font-medium text-gray-500 transition-colors hover:text-slate-800"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        AI Sustainability Assistant
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Smart insights powered by AI
                    </p>
                </header>

                {/* Chat Card */}
                <div className="flex flex-col h-[520px] bg-white border border-gray-100 shadow-sm rounded-3xl">

                    {/* Messages */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">

                        {messages.map((msg, index) => (

                            <div
                                key={index}
                                className={`flex ${msg.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                            >

                                <div
                                    className={`px-4 py-3 text-sm rounded-2xl max-w-xs shadow ${msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-slate-800"
                                        }`}
                                >
                                    {msg.content}
                                </div>

                            </div>

                        ))}

                        {loading && (
                            <p className="text-sm text-gray-400">
                                AI is thinking...
                            </p>
                        )}

                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100">

                        <div className="flex gap-2">

                            <input
                                type="text"
                                placeholder="Ask about energy, water, sanitation..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <button
                                onClick={sendMessage}
                                className="flex items-center justify-center px-4 text-white transition bg-blue-600 rounded-xl hover:bg-blue-700"
                            >
                                <Send size={18} />
                            </button>

                        </div>

                    </div>

                </div>

                {/* Info Card */}
                <div className="flex items-center gap-4 p-5 mt-6 bg-white border border-gray-100 rounded-2xl">

                    <Bot className="text-purple-500" size={28} />

                    <div>
                        <p className="text-xs font-semibold tracking-wider text-gray-400">
                            AI CAPABILITY
                        </p>

                        <p className="font-semibold text-slate-800">
                            Energy, sanitation & sustainability insights
                        </p>
                    </div>

                </div>

            </div>

        </div>
    )
}