interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center
          ${isUser
            ? 'bg-gradient-to-br from-purple-500 to-purple-700'
            : 'bg-gradient-to-br from-fiscal-500 to-fiscal-700'}
        `}>
          {isUser ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="text-white font-bold text-xs">BR</span>
          )}
        </div>

        {/* Message content */}
        <div className={`
          rounded-2xl px-4 py-3
          ${isUser
            ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white'
            : 'bg-slate-700/50 text-slate-100'}
        `}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {formatMessage(message.content)}
          </div>
          <div className={`text-xs mt-2 ${isUser ? 'text-purple-200' : 'text-slate-400'}`}>
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMessage(content: string): React.ReactNode {
  // Simple markdown-like formatting
  const parts = content.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
