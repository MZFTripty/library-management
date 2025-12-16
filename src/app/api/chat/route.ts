import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            )
        }

        // Fetch available books for context
        const supabase = await createClient()
        const { data: books } = await supabase
            .from('books')
            .select('name, author, categories')
            .gt('available_copies', 0)
            .limit(100)

        const availableBooks = books || []

        const response = await chatWithAssistant(messages, availableBooks)

        return NextResponse.json({ message: response })
    } catch (error) {
        console.error('Chat API error:', error)
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        )
    }
}
