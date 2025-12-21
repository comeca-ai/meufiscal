interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors lg:hidden"
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-fiscal-500 to-fiscal-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">BR</span>
          </div>
          <div>
            <h1 className="text-white font-semibold">Fiscal BR</h1>
            <p className="text-slate-400 text-xs">Assistente Fiscal Inteligente</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 text-xs font-medium">MCP Conectado</span>
        </div>
      </div>
    </header>
  )
}
