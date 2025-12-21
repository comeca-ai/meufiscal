interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const tools = [
  { name: 'validar_cpf', icon: '👤', label: 'Validar CPF' },
  { name: 'validar_cnpj', icon: '🏢', label: 'Validar CNPJ' },
  { name: 'consultar_cnpj', icon: '🔍', label: 'Consultar CNPJ' },
  { name: 'calcular_icms', icon: '📊', label: 'Calcular ICMS' },
  { name: 'calcular_pis_cofins', icon: '💰', label: 'PIS/COFINS' },
  { name: 'calcular_simples', icon: '📋', label: 'Simples Nacional' },
  { name: 'calcular_iss', icon: '🏛️', label: 'Calcular ISS' },
  { name: 'consultar_ncm', icon: '📦', label: 'Consultar NCM' },
  { name: 'consultar_cfop', icon: '🔢', label: 'Consultar CFOP' },
  { name: 'validar_nfe', icon: '📄', label: 'Validar NFe' },
  { name: 'calcular_nf', icon: '🧮', label: 'Impostos NF' },
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-72 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-fiscal-500 to-fiscal-700 rounded-xl flex items-center justify-center shadow-lg shadow-fiscal-500/20">
                <span className="text-white font-bold">BR</span>
              </div>
              <span className="text-white font-semibold">Fiscal BR</span>
            </div>
            <button onClick={onToggle} className="p-2 hover:bg-slate-700/50 rounded-lg lg:hidden">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tools list */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Ferramentas Disponíveis
              </h3>
            </div>
            <nav className="px-2 space-y-1">
              {tools.map(tool => (
                <button
                  key={tool.name}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-slate-700/50 transition-colors group"
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                    {tool.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="bg-fiscal-500/10 border border-fiscal-500/30 rounded-xl p-4">
              <h4 className="text-fiscal-400 font-medium text-sm mb-1">Dica do dia</h4>
              <p className="text-slate-400 text-xs">
                Digite naturalmente! Ex: "Valide o CPF 123.456.789-00" ou "Calcule ICMS de R$1000 de SP para RJ"
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
