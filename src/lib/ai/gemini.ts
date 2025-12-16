import { GoogleGenAI } from '@google/genai'

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

export async function getBookRecommendations(
    query: string,
    availableBooks: { name: string; author: string; categories: string[] }[]
): Promise<string> {
    try {
        const bookList = availableBooks
            .map((b) => `- "${b.name}" by ${b.author} (${b.categories.join(', ')})`)
            .join('\n')

        const prompt = `You are a friendly library assistant chatbot. A user is looking for book recommendations.

Available books in our library:
${bookList}

User's request: ${query}

Based on the user's request, recommend books from the available list. If no exact matches, suggest similar options.
Keep your response friendly, concise, and helpful. Format recommendations as a list.
If the user asks something unrelated to books, politely redirect them to book-related topics.`

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
        })

        return response.text || 'I apologize, but I could not generate recommendations at this time.'
    } catch (error) {
        console.error('Gemini API error:', error)
        return 'I apologize, but I could not generate recommendations at this time.'
    }
}

export async function chatWithAssistant(
    messages: { role: 'user' | 'assistant'; content: string }[],
    availableBooks: { name: string; author: string; categories: string[] }[]
): Promise<string> {
    try {
        const bookContext = availableBooks
            .slice(0, 50)
            .map((b) => `"${b.name}" by ${b.author}`)
            .join(', ')

        const systemPrompt = `You are LibraryBot, a helpful library assistant. You help users find and discover books.
  
Available books include: ${bookContext}

Guidelines:
- Be friendly and helpful
- Recommend books based on user preferences
- Explain book genres and suggest similar titles
- If asked about library policies, explain that users should contact the library staff
- Keep responses concise but informative`

        // Get the last user message
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()
        const prompt = `${systemPrompt}\n\nUser: ${lastUserMessage?.content || 'Hello'}`

        const response = await genAI.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
        })

        return response.text || 'I apologize, but I encountered an error. Please try again.'
    } catch (error) {
        console.error('Gemini API error:', error)
        return 'I apologize, but I encountered an error. Please try again.'
    }
}
