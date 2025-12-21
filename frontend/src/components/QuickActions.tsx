interface QuickActionsProps {
  onAction: (prompt: string) => void
}

const quickActions = [
  {
    icon: '👤',
    label: 'Validar CPF',
    prompt: 'Valide o CPF ',
    color: 'from-blue-500 to-blue-700'
  },
  {
    icon: '🏢',
    label: 'Consultar CNPJ',
    prompt: 'Consulte os dados do CNPJ ',
    color: 'from-purple-500 to-purple-700'
  },
  {
    icon: '📊',
    label: 'Calcular ICMS',
    prompt: 'Calcule o ICMS de R$ 1.000 de SP para RJ',
    color: 'from-green-500 to-green-700'
  },
  {
    icon: '📋',
    label: 'Simples Nacional',
    prompt: 'Calcule o Simples Nacional para receita de R$ 500.000 nos últimos 12 meses e R$ 50.000 neste mês',
    color: 'from-orange-500 to-orange-700'
  },
  {
    icon: '📦',
    label: 'Consultar NCM',
    prompt: 'Consulte o NCM ',
    color: 'from-pink-500 to-pink-700'
  },
  {
    icon: '🧮',
    label: 'Impostos NF',
    prompt: 'Calcule todos os impostos de uma NF de R$ 5.000 de SP para MG, regime Simples Nacional',
    color: 'from-cyan-500 to-cyan-700'
  }
]

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-400 text-center">
        Sugestões rápidas
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onAction(action.prompt)}
            className={`
              group relative overflow-hidden rounded-xl p-4
              bg-gradient-to-br ${action.color} bg-opacity-10
              border border-white/10 hover:border-white/20
              transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
            `}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex flex-col items-center gap-2 text-center">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-white">{action.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
