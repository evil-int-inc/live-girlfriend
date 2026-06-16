import { useState, useCallback } from 'react'

const MOCK_AUDIO_URL = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
// Note: This is a silent operational wav. For real testing, user should provide a valid audio URL.

const MOCK_VISEMES = {
    metadata: { duration: 1 },
    mouthCues: [
        { start: 0, end: 0.2, value: 'X' },
        { start: 0.2, end: 0.5, value: 'B' },
        { start: 0.5, end: 0.8, value: 'A' },
        { start: 0.8, end: 1.0, value: 'X' },
    ]
}

export const useChat = () => {
    const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
    const [loading, setLoading] = useState(false)

    const sendMessage = useCallback(async (text: string) => {
        setLoading(true)
        setMessages((prev) => [...prev, { role: 'user', content: text }])

        // Simulate API delay
        setTimeout(() => {
            const responseText = 'Echo: ' + text
            setMessages((prev) => [...prev, { role: 'assistant', content: responseText }])
            setLoading(false)

            // Dispatch logic for Avatar to speak
            const event = new CustomEvent('ai-speak', {
                detail: {
                    audioUrl: MOCK_AUDIO_URL,
                    visemes: MOCK_VISEMES,
                    text: responseText
                }
            })
            window.dispatchEvent(event)
        }, 1000)
    }, [])

    return { messages, sendMessage, loading }
}
