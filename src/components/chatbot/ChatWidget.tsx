'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm LibraryBot 📚 I can help you discover and find books. What kind of books are you interested in?",
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content: userMessage }],
                }),
            })

            const data = await response.json()

            if (data.message) {
                setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
                ])
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Sorry, I could not connect to the server. Please try again later.' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center group"
            >
                <MessageSquare className="w-6 h-6" />
                <span className="absolute -top-10 right-0 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Need book recommendations?
                </span>
            </button>
        )
    }

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 bg-indigo-600 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">LibraryBot</p>
                        {!isMinimized && (
                            <p className="text-xs text-indigo-200">AI Book Recommendations</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        {isMinimized ? (
                            <Maximize2 className="w-4 h-4" />
                        ) : (
                            <Minimize2 className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[380px]">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    {message.role === 'user' ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[75%] p-3 rounded-2xl text-sm ${message.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-md'
                                        }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl rounded-bl-md">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about books..."
                                className="flex-1 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-full text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
