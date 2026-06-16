import { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import { useChat } from './hooks/useChat'

function App() {
  const { messages, sendMessage, loading } = useChat()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const input = form.elements.namedItem('message') as HTMLInputElement
    if (input.value.trim()) {
      sendMessage(input.value)
      input.value = ''
    }
  }

  return (
    <div className="flex flex-col h-screen bg-base-200 overflow-hidden">
      {/* 3D Scene - Takes remaining top space */}
      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 30 }}>
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay - Static at bottom */}
      <div className="w-full backdrop-blur-md p-4 z-10">
        <div className="w-full max-w-lg mx-auto">
          <div ref={chatContainerRef} className="h-20 overflow-y-auto mb-2 space-y-2 p-2 rounded-lg scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
            {messages.map((msg, i) => (
              <div key={i} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'} text-xs min-h-0 py-1 px-2`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {messages.length === 0 && <div className="text-center opacity-50 text-[10px] py-1">Say hello!</div>}
            {loading && <div className="text-center text-[10px] opacity-50">Thinking...</div>}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              name="message"
              type="text"
              placeholder="Type a message..."
              className="input input-xs input-bordered w-full"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-xs btn-primary" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
