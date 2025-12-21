import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import QuickActions from './QuickActions'
import ToolResultDisplay from './ToolResultDisplay'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  timestamp: Date
}

interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status: 'pending' | 'running' | 'completed' | 'error'
}

export default function ChatKitPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou o Fiscal BR, seu assistente fiscal inteligente. Posso ajudar com:\n\n• Validar CPF e CNPJ\n• Consultar dados de empresas\n• Calcular ICMS, PIS, COFINS, ISS\n• Calcular Simples Nacional\n• Consultar NCM e CFOP\n• Validar chaves de NFe\n\nComo posso ajudar você hoje?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response with tool calls
    setTimeout(() => {
      const response = simulateResponse(userMessage.content)
      setMessages(prev => [...prev, response])
      setIsLoading(false)
    }, 1000)
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map(message => (
            <div key={message.id} className="message-enter">
              <MessageBubble message={message} />
              {message.toolCalls?.map(tool => (
                <ToolResultDisplay key={tool.id} toolCall={tool} />
              ))}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm">Processando...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <QuickActions onAction={handleQuickAction} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-slate-700/50 bg-slate-800/30 p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta fiscal..."
              className="chat-input pr-12 min-h-[56px] max-h-[200px]"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-fiscal-500 hover:bg-fiscal-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </form>
      </div>
    </div>
  )
}

// Simulated response function - In production, this would call the actual API
function simulateResponse(input: string): Message {
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes('cpf')) {
    const cpfMatch = input.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Validei o CPF informado:',
      toolCalls: [{
        id: 'tc1',
        name: 'validar_cpf',
        arguments: { cpf: cpfMatch?.[0] || '123.456.789-00' },
        result: {
          valido: true,
          formatado: cpfMatch?.[0] || '123.456.789-00'
        },
        status: 'completed'
      }],
      timestamp: new Date()
    }
  }

  if (lowerInput.includes('cnpj') && lowerInput.includes('consulta')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Consultei o CNPJ na Receita Federal:',
      toolCalls: [{
        id: 'tc1',
        name: 'consultar_cnpj',
        arguments: { cnpj: '00.000.000/0001-00' },
        result: {
          sucesso: true,
          dados: {
            cnpj: '00.000.000/0001-00',
            razao_social: 'EMPRESA EXEMPLO LTDA',
            nome_fantasia: 'EXEMPLO',
            situacao: 'ATIVA',
            porte: 'PEQUENO',
            atividade_principal: {
              codigo: '6201-5',
              descricao: 'Desenvolvimento de programas de computador sob encomenda'
            },
            endereco: {
              logradouro: 'Rua Exemplo',
              numero: '100',
              bairro: 'Centro',
              municipio: 'São Paulo',
              uf: 'SP',
              cep: '01000-000'
            }
          }
        },
        status: 'completed'
      }],
      timestamp: new Date()
    }
  }

  if (lowerInput.includes('icms')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Calculei o ICMS da operação:',
      toolCalls: [{
        id: 'tc1',
        name: 'calcular_icms',
        arguments: { valor: 1000, uf_origem: 'SP', uf_destino: 'RJ' },
        result: {
          aliquota: 12,
          valor_icms: 120,
          tipo_operacao: 'Interestadual'
        },
        status: 'completed'
      }],
      timestamp: new Date()
    }
  }

  if (lowerInput.includes('simples') || lowerInput.includes('nacional')) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Calculei o Simples Nacional:',
      toolCalls: [{
        id: 'tc1',
        name: 'calcular_simples_nacional',
        arguments: { receita_bruta_12m: 500000, receita_mes: 50000 },
        result: {
          faixa: 3,
          aliquota_nominal: 9.5,
          aliquota_efetiva: 7.14,
          valor_imposto: 3570,
          limite_excedido: false
        },
        status: 'completed'
      }],
      timestamp: new Date()
    }
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: 'Entendi! Posso ajudar com várias operações fiscais. Por favor, me diga exatamente o que você precisa:\n\n• **Validar documentos**: CPF, CNPJ, Chave NFe\n• **Calcular impostos**: ICMS, PIS, COFINS, ISS, Simples Nacional\n• **Consultar**: NCM, CFOP, dados de empresas\n\nPor exemplo: "Valide o CPF 123.456.789-00" ou "Calcule o ICMS de R$1.000 de SP para RJ"',
    timestamp: new Date()
  }
}
