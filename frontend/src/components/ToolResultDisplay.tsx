interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  result?: unknown
  status: 'pending' | 'running' | 'completed' | 'error'
}

interface ToolResultDisplayProps {
  toolCall: ToolCall
}

const toolIcons: Record<string, string> = {
  validar_cpf: '👤',
  validar_cnpj: '🏢',
  consultar_cnpj: '🔍',
  calcular_icms: '📊',
  calcular_pis_cofins: '💰',
  calcular_simples_nacional: '📋',
  calcular_iss: '🏛️',
  consultar_ncm: '📦',
  consultar_cfop: '🔢',
  validar_chave_nfe: '📄',
  calcular_impostos_nf: '🧮',
}

const toolLabels: Record<string, string> = {
  validar_cpf: 'Validação de CPF',
  validar_cnpj: 'Validação de CNPJ',
  consultar_cnpj: 'Consulta CNPJ',
  calcular_icms: 'Cálculo de ICMS',
  calcular_pis_cofins: 'Cálculo PIS/COFINS',
  calcular_simples_nacional: 'Cálculo Simples Nacional',
  calcular_iss: 'Cálculo de ISS',
  consultar_ncm: 'Consulta NCM',
  consultar_cfop: 'Consulta CFOP',
  validar_chave_nfe: 'Validação Chave NFe',
  calcular_impostos_nf: 'Cálculo Impostos NF',
}

export default function ToolResultDisplay({ toolCall }: ToolResultDisplayProps) {
  const icon = toolIcons[toolCall.name] || '🔧'
  const label = toolLabels[toolCall.name] || toolCall.name

  if (toolCall.status === 'pending' || toolCall.status === 'running') {
    return (
      <div className="tool-result ml-11 animate-pulse">
        <div className="tool-result-header">
          <span>{icon}</span>
          <span>{label}</span>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-fiscal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tool-result ml-11">
      <div className="tool-result-header">
        <span>{icon}</span>
        <span>{label}</span>
        {toolCall.status === 'completed' && (
          <span className="ml-auto text-green-400 text-xs flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Concluído
          </span>
        )}
        {toolCall.status === 'error' && (
          <span className="ml-auto text-red-400 text-xs flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Erro
          </span>
        )}
      </div>
      <div className="tool-result-content">
        <ResultRenderer result={toolCall.result} toolName={toolCall.name} />
      </div>
    </div>
  )
}

function ResultRenderer({ result, toolName }: { result: unknown; toolName: string }) {
  if (!result) return <span className="text-slate-500">Sem resultado</span>

  const data = result as Record<string, unknown>

  // Custom rendering for specific tools
  if (toolName === 'validar_cpf' || toolName === 'validar_cnpj') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            data.valido ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {data.valido ? 'Válido' : 'Inválido'}
          </span>
          <span className="font-mono">{data.formatado as string}</span>
        </div>
        {data.erro && <p className="text-red-400 text-sm">{data.erro as string}</p>}
      </div>
    )
  }

  if (toolName === 'consultar_cnpj' && data.sucesso) {
    const empresa = data.dados as Record<string, unknown>
    return (
      <div className="space-y-3">
        <div>
          <p className="text-fiscal-400 text-xs uppercase tracking-wider">Razão Social</p>
          <p className="text-white font-medium">{empresa.razao_social as string}</p>
        </div>
        {empresa.nome_fantasia && (
          <div>
            <p className="text-fiscal-400 text-xs uppercase tracking-wider">Nome Fantasia</p>
            <p>{empresa.nome_fantasia as string}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-fiscal-400 text-xs uppercase tracking-wider">Situação</p>
            <p className={empresa.situacao === 'ATIVA' ? 'text-green-400' : 'text-yellow-400'}>
              {empresa.situacao as string}
            </p>
          </div>
          <div>
            <p className="text-fiscal-400 text-xs uppercase tracking-wider">Porte</p>
            <p>{empresa.porte as string}</p>
          </div>
        </div>
        {empresa.atividade_principal && (
          <div>
            <p className="text-fiscal-400 text-xs uppercase tracking-wider">Atividade Principal</p>
            <p className="text-sm">
              {(empresa.atividade_principal as Record<string, string>).codigo} - {(empresa.atividade_principal as Record<string, string>).descricao}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (toolName === 'calcular_icms') {
    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-fiscal-400 text-xs uppercase tracking-wider mb-1">Alíquota</p>
          <p className="text-2xl font-bold text-white">{data.aliquota}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-fiscal-400 text-xs uppercase tracking-wider mb-1">Valor ICMS</p>
          <p className="text-2xl font-bold text-green-400">R$ {(data.valor_icms as number).toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-fiscal-400 text-xs uppercase tracking-wider mb-1">Tipo</p>
          <p className="text-sm text-white">{data.tipo_operacao}</p>
        </div>
      </div>
    )
  }

  if (toolName === 'calcular_simples_nacional') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-fiscal-400 text-xs uppercase tracking-wider mb-1">Faixa</p>
            <p className="text-2xl font-bold text-white">{data.faixa}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <p className="text-fiscal-400 text-xs uppercase tracking-wider mb-1">Alíquota Efetiva</p>
            <p className="text-2xl font-bold text-fiscal-400">{data.aliquota_efetiva}%</p>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-green-400 text-xs uppercase tracking-wider mb-1">Imposto do Mês</p>
          <p className="text-3xl font-bold text-green-400">
            R$ {(data.valor_imposto as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    )
  }

  // Default JSON display
  return (
    <pre className="text-xs overflow-x-auto">
      {JSON.stringify(result, null, 2)}
    </pre>
  )
}
