/**
 * Fiscal BR - MCP Server para Cloudflare Workers
 *
 * Remote MCP Server usando o padrão oficial Cloudflare McpAgent
 * Tools para operações fiscais brasileiras
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// ============================================================================
// DADOS FISCAIS BRASILEIROS
// ============================================================================

const ICMS_ALIQUOTAS: Record<string, number> = {
  'AC': 19, 'AL': 19, 'AP': 18, 'AM': 20, 'BA': 20.5,
  'CE': 20, 'DF': 20, 'ES': 17, 'GO': 19, 'MA': 22,
  'MT': 17, 'MS': 17, 'MG': 18, 'PA': 19, 'PB': 20,
  'PR': 19.5, 'PE': 20.5, 'PI': 21, 'RJ': 22, 'RN': 20,
  'RS': 17, 'RO': 19.5, 'RR': 20, 'SC': 17, 'SP': 18,
  'SE': 19, 'TO': 20
};

const ESTADOS_NORTE_NE_CO = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'PA', 'PB', 'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'];

const SIMPLES_NACIONAL_COMERCIO = [
  { min: 0, max: 180000, aliquota: 4.00, deducao: 0 },
  { min: 180000.01, max: 360000, aliquota: 7.30, deducao: 5940 },
  { min: 360000.01, max: 720000, aliquota: 9.50, deducao: 13860 },
  { min: 720000.01, max: 1800000, aliquota: 10.70, deducao: 22500 },
  { min: 1800000.01, max: 3600000, aliquota: 14.30, deducao: 87300 },
  { min: 3600000.01, max: 4800000, aliquota: 19.00, deducao: 378000 }
];

const NCM_DATABASE: Record<string, { descricao: string; ipi: number; pis: number; cofins: number }> = {
  '84713019': { descricao: 'Computadores portáteis (notebooks)', ipi: 0, pis: 1.65, cofins: 7.6 },
  '85171231': { descricao: 'Telefones celulares', ipi: 0, pis: 1.65, cofins: 7.6 },
  '85287200': { descricao: 'Televisores LED/LCD', ipi: 5, pis: 1.65, cofins: 7.6 },
  '64039990': { descricao: 'Calçados de couro', ipi: 10, pis: 1.65, cofins: 7.6 },
  '22030000': { descricao: 'Cerveja de malte', ipi: 6, pis: 2.5, cofins: 11.75 },
  '21069010': { descricao: 'Preparações alimentícias (suplementos)', ipi: 0, pis: 1.65, cofins: 7.6 },
  '33049990': { descricao: 'Cosméticos e produtos de beleza', ipi: 7, pis: 1.65, cofins: 7.6 },
  '94032000': { descricao: 'Móveis de metal', ipi: 5, pis: 1.65, cofins: 7.6 },
  '02011000': { descricao: 'Carne bovina fresca (carcaças)', ipi: 0, pis: 0, cofins: 0 },
  '10059010': { descricao: 'Milho em grão', ipi: 0, pis: 0, cofins: 0 }
};

const CFOP_DATABASE: Record<string, { descricao: string; tipo: string; natureza: string }> = {
  '5101': { descricao: 'Venda de produção do estabelecimento', tipo: 'Saída', natureza: 'Estadual' },
  '5102': { descricao: 'Venda de mercadoria adquirida', tipo: 'Saída', natureza: 'Estadual' },
  '5405': { descricao: 'Venda de mercadoria sujeita a ST', tipo: 'Saída', natureza: 'Estadual' },
  '5910': { descricao: 'Remessa em bonificação', tipo: 'Saída', natureza: 'Estadual' },
  '5949': { descricao: 'Outra saída não especificada', tipo: 'Saída', natureza: 'Estadual' },
  '6101': { descricao: 'Venda de produção do estabelecimento', tipo: 'Saída', natureza: 'Interestadual' },
  '6102': { descricao: 'Venda de mercadoria adquirida', tipo: 'Saída', natureza: 'Interestadual' },
  '6108': { descricao: 'Venda a consumidor final', tipo: 'Saída', natureza: 'Interestadual' },
  '1101': { descricao: 'Compra para industrialização', tipo: 'Entrada', natureza: 'Estadual' },
  '1102': { descricao: 'Compra para comercialização', tipo: 'Entrada', natureza: 'Estadual' },
  '2101': { descricao: 'Compra para industrialização', tipo: 'Entrada', natureza: 'Interestadual' },
  '2102': { descricao: 'Compra para comercialização', tipo: 'Entrada', natureza: 'Interestadual' }
};

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO E CÁLCULO
// ============================================================================

function limparDocumento(doc: string): string {
  return doc.replace(/[^\d]/g, '');
}

function validarCPF(cpf: string): { valido: boolean; formatado: string; erro?: string } {
  const cpfLimpo = limparDocumento(cpf);

  if (cpfLimpo.length !== 11) {
    return { valido: false, formatado: cpfLimpo, erro: 'CPF deve ter 11 dígitos' };
  }

  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return { valido: false, formatado: cpfLimpo, erro: 'CPF inválido (dígitos repetidos)' };
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(9))) {
    return { valido: false, formatado: cpfLimpo, erro: 'Primeiro dígito verificador inválido' };
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.charAt(10))) {
    return { valido: false, formatado: cpfLimpo, erro: 'Segundo dígito verificador inválido' };
  }

  const formatado = cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return { valido: true, formatado };
}

function validarCNPJ(cnpj: string): { valido: boolean; formatado: string; erro?: string } {
  const cnpjLimpo = limparDocumento(cnpj);

  if (cnpjLimpo.length !== 14) {
    return { valido: false, formatado: cnpjLimpo, erro: 'CNPJ deve ter 14 dígitos' };
  }

  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return { valido: false, formatado: cnpjLimpo, erro: 'CNPJ inválido (dígitos repetidos)' };
  }

  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return { valido: false, formatado: cnpjLimpo, erro: 'Primeiro dígito verificador inválido' };
  }

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return { valido: false, formatado: cnpjLimpo, erro: 'Segundo dígito verificador inválido' };
  }

  const formatado = cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return { valido: true, formatado };
}

function validarChaveNFe(chave: string) {
  const chaveLimpa = limparDocumento(chave);

  if (chaveLimpa.length !== 44) {
    return { valido: false, erro: 'Chave deve ter 44 dígitos' };
  }

  const uf = chaveLimpa.substring(0, 2);
  const aamm = chaveLimpa.substring(2, 6);
  const cnpj = chaveLimpa.substring(6, 20);
  const modelo = chaveLimpa.substring(20, 22);
  const serie = chaveLimpa.substring(22, 25);
  const numero = chaveLimpa.substring(25, 34);
  const tipoEmissao = chaveLimpa.substring(34, 35);
  const codigoNumerico = chaveLimpa.substring(35, 43);
  const dv = chaveLimpa.substring(43, 44);

  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIndex = 0;

  for (let i = 42; i >= 0; i--) {
    soma += parseInt(chaveLimpa.charAt(i)) * pesos[pesoIndex];
    pesoIndex = (pesoIndex + 1) % 8;
  }

  const resto = soma % 11;
  const dvCalculado = resto < 2 ? 0 : 11 - resto;

  if (dvCalculado !== parseInt(dv)) {
    return { valido: false, erro: 'Dígito verificador inválido' };
  }

  const cnpjValidacao = validarCNPJ(cnpj);
  if (!cnpjValidacao.valido) {
    return { valido: false, erro: 'CNPJ do emitente inválido na chave' };
  }

  const ano = parseInt(aamm.substring(0, 2)) + 2000;
  const mes = aamm.substring(2, 4);

  return {
    valido: true,
    detalhes: {
      uf,
      dataEmissao: `${mes}/${ano}`,
      cnpjEmitente: cnpjValidacao.formatado,
      modelo: modelo === '55' ? 'NFe' : modelo === '65' ? 'NFCe' : modelo,
      serie,
      numero: parseInt(numero).toString(),
      tipoEmissao,
      codigoNumerico,
      digitoVerificador: dv
    }
  };
}

function calcularICMS(valor: number, ufOrigem: string, ufDestino: string, consumidorFinal: boolean = false) {
  const ufOrigemUpper = ufOrigem.toUpperCase();
  const ufDestinoUpper = ufDestino.toUpperCase();

  if (ufOrigemUpper === ufDestinoUpper) {
    const aliquota = ICMS_ALIQUOTAS[ufOrigemUpper] || 18;
    return {
      aliquota,
      valor_icms: Math.round(valor * (aliquota / 100) * 100) / 100,
      tipo_operacao: 'Interna'
    };
  }

  const isDestinoNorteNeCo = ESTADOS_NORTE_NE_CO.includes(ufDestinoUpper);
  let aliquotaInterestadual = isDestinoNorteNeCo ? 7 : 12;

  if (ESTADOS_NORTE_NE_CO.includes(ufOrigemUpper)) {
    aliquotaInterestadual = 12;
  }

  const valorIcms = Math.round(valor * (aliquotaInterestadual / 100) * 100) / 100;

  if (consumidorFinal) {
    const aliquotaInterna = ICMS_ALIQUOTAS[ufDestinoUpper] || 18;
    const difal = Math.round(valor * ((aliquotaInterna - aliquotaInterestadual) / 100) * 100) / 100;

    return {
      aliquota: aliquotaInterestadual,
      valor_icms: valorIcms,
      tipo_operacao: 'Interestadual (Consumidor Final)',
      difal: {
        aliquota_interestadual: aliquotaInterestadual,
        aliquota_interna: aliquotaInterna,
        valor_difal: difal
      }
    };
  }

  return {
    aliquota: aliquotaInterestadual,
    valor_icms: valorIcms,
    tipo_operacao: 'Interestadual'
  };
}

function calcularPisCofins(valor: number, regime: 'cumulativo' | 'nao_cumulativo', ncm?: string) {
  let aliquotaPis: number = 0;
  let aliquotaCofins: number = 0;

  if (ncm) {
    const ncmLimpo = ncm.replace(/[^\d]/g, '');
    const ncmInfo = NCM_DATABASE[ncmLimpo];
    if (ncmInfo) {
      aliquotaPis = ncmInfo.pis;
      aliquotaCofins = ncmInfo.cofins;
    }
  }

  if (!aliquotaPis || !aliquotaCofins) {
    if (regime === 'cumulativo') {
      aliquotaPis = 0.65;
      aliquotaCofins = 3.00;
    } else {
      aliquotaPis = 1.65;
      aliquotaCofins = 7.60;
    }
  }

  const valorPis = Math.round(valor * (aliquotaPis / 100) * 100) / 100;
  const valorCofins = Math.round(valor * (aliquotaCofins / 100) * 100) / 100;

  return {
    pis: { aliquota: aliquotaPis, valor: valorPis },
    cofins: { aliquota: aliquotaCofins, valor: valorCofins },
    total: Math.round((valorPis + valorCofins) * 100) / 100,
    regime: regime === 'cumulativo' ? 'Cumulativo (Lucro Presumido)' : 'Não-Cumulativo (Lucro Real)'
  };
}

function calcularSimplesNacional(receitaBruta12m: number, receitaMes: number) {
  if (receitaBruta12m > 4800000) {
    return {
      faixa: 0,
      aliquota_nominal: 0,
      aliquota_efetiva: 0,
      valor_imposto: 0,
      limite_excedido: true,
      observacao: 'Receita excede o limite do Simples Nacional (R$ 4.800.000,00). Empresa deve migrar para Lucro Presumido ou Real.'
    };
  }

  const faixa = SIMPLES_NACIONAL_COMERCIO.find(f => receitaBruta12m >= f.min && receitaBruta12m <= f.max);

  if (!faixa) {
    return {
      faixa: 1,
      aliquota_nominal: 4.00,
      aliquota_efetiva: 4.00,
      valor_imposto: Math.round(receitaMes * 0.04 * 100) / 100,
      limite_excedido: false
    };
  }

  const aliquotaEfetiva = ((receitaBruta12m * (faixa.aliquota / 100)) - faixa.deducao) / receitaBruta12m * 100;
  const valorImposto = receitaMes * (aliquotaEfetiva / 100);

  return {
    faixa: SIMPLES_NACIONAL_COMERCIO.indexOf(faixa) + 1,
    aliquota_nominal: faixa.aliquota,
    aliquota_efetiva: Math.round(aliquotaEfetiva * 100) / 100,
    valor_imposto: Math.round(valorImposto * 100) / 100,
    limite_excedido: false
  };
}

function calcularISS(valor: number, aliquota: number, municipio?: string) {
  const aliquotaValidada = Math.min(Math.max(aliquota, 2), 5);

  return {
    aliquota: aliquotaValidada,
    valor_iss: Math.round(valor * (aliquotaValidada / 100) * 100) / 100,
    municipio,
    observacao: aliquota !== aliquotaValidada
      ? `Alíquota ajustada para ${aliquotaValidada}% (limites legais: 2% a 5%)`
      : 'Cálculo baseado na alíquota informada. Verifique a legislação municipal.'
  };
}

function calcularImpostosNF(
  valorProduto: number,
  valorFrete: number = 0,
  ufOrigem: string,
  ufDestino: string,
  ncm: string | undefined,
  regime: 'simples' | 'lucro_presumido' | 'lucro_real'
) {
  const baseCalculo = valorProduto + valorFrete;
  const icmsCalc = calcularICMS(baseCalculo, ufOrigem, ufDestino);

  let pisCofinsCalc;
  if (regime === 'simples') {
    pisCofinsCalc = { pis: { aliquota: 0, valor: 0 }, cofins: { aliquota: 0, valor: 0 }, total: 0, regime: 'Simples Nacional' };
  } else {
    const regimePisCofins = regime === 'lucro_presumido' ? 'cumulativo' : 'nao_cumulativo';
    pisCofinsCalc = calcularPisCofins(baseCalculo, regimePisCofins, ncm);
  }

  let ipi = { aliquota: 0, valor: 0 };
  if (ncm) {
    const ncmLimpo = ncm.replace(/[^\d]/g, '');
    const ncmInfo = NCM_DATABASE[ncmLimpo];
    if (ncmInfo) {
      ipi = { aliquota: ncmInfo.ipi, valor: Math.round(baseCalculo * (ncmInfo.ipi / 100) * 100) / 100 };
    }
  }

  const totalImpostos = icmsCalc.valor_icms + pisCofinsCalc.pis.valor + pisCofinsCalc.cofins.valor + ipi.valor;

  return {
    base_calculo: baseCalculo,
    icms: { aliquota: icmsCalc.aliquota, valor: icmsCalc.valor_icms, tipo: icmsCalc.tipo_operacao },
    pis: pisCofinsCalc.pis,
    cofins: pisCofinsCalc.cofins,
    ipi: ipi.valor > 0 ? ipi : undefined,
    total_impostos: Math.round(totalImpostos * 100) / 100,
    valor_total_nf: Math.round((baseCalculo + ipi.valor) * 100) / 100,
    regime: regime === 'simples' ? 'Simples Nacional' : regime === 'lucro_presumido' ? 'Lucro Presumido' : 'Lucro Real'
  };
}

// ============================================================================
// MCP AGENT - PADRÃO CLOUDFLARE
// ============================================================================

export class FiscalBRMCP extends McpAgent {
  server = new McpServer({
    name: "Fiscal BR",
    version: "1.0.0",
  });

  async init() {
    // Tool: Validar CPF
    this.server.tool(
      "validar_cpf",
      "Valida se um CPF brasileiro é válido (verifica dígitos verificadores)",
      { cpf: z.string().describe("CPF a ser validado (apenas números ou formatado)") },
      async ({ cpf }) => ({
        content: [{ type: "text", text: JSON.stringify(validarCPF(cpf), null, 2) }],
      })
    );

    // Tool: Validar CNPJ
    this.server.tool(
      "validar_cnpj",
      "Valida se um CNPJ brasileiro é válido (verifica dígitos verificadores)",
      { cnpj: z.string().describe("CNPJ a ser validado (apenas números ou formatado)") },
      async ({ cnpj }) => ({
        content: [{ type: "text", text: JSON.stringify(validarCNPJ(cnpj), null, 2) }],
      })
    );

    // Tool: Consultar CNPJ (via ReceitaWS - termos de uso claros)
    this.server.tool(
      "consultar_cnpj",
      "Consulta dados de uma empresa pelo CNPJ na Receita Federal (razão social, endereço, situação cadastral, atividades)",
      { cnpj: z.string().describe("CNPJ da empresa (apenas números)") },
      async ({ cnpj }) => {
        const cnpjLimpo = limparDocumento(cnpj);
        const validacao = validarCNPJ(cnpjLimpo);

        if (!validacao.valido) {
          return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: validacao.erro }, null, 2) }] };
        }

        try {
          const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`);

          if (!response.ok) {
            if (response.status === 404) {
              return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: 'CNPJ não encontrado' }, null, 2) }] };
            }
            if (response.status === 429) {
              return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: 'Limite de consultas excedido. Aguarde alguns segundos.' }, null, 2) }] };
            }
            return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: `Erro: ${response.status}` }, null, 2) }] };
          }

          const data = await response.json() as any;

          if (data.status === 'ERROR') {
            return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: data.message || 'Erro na consulta' }, null, 2) }] };
          }

          const atividadePrincipal = data.atividade_principal?.[0] || {};

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                sucesso: true,
                dados: {
                  cnpj: validacao.formatado,
                  razao_social: data.nome || '',
                  nome_fantasia: data.fantasia || '',
                  situacao: data.situacao || '',
                  porte: data.porte || '',
                  capital_social: parseFloat(data.capital_social) || 0,
                  atividade_principal: {
                    codigo: atividadePrincipal.code || '',
                    descricao: atividadePrincipal.text || ''
                  },
                  endereco: {
                    logradouro: data.logradouro || '',
                    numero: data.numero || '',
                    bairro: data.bairro || '',
                    municipio: data.municipio || '',
                    uf: data.uf || '',
                    cep: data.cep || ''
                  },
                  data_abertura: data.abertura || ''
                },
                nota: "Fonte: ReceitaWS (dados públicos da Receita Federal). Ao consultar, você declara legítimo interesse conforme LGPD."
              }, null, 2)
            }]
          };
        } catch (error) {
          return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: `Erro ao consultar API: ${error}` }, null, 2) }] };
        }
      }
    );

    // Tool: Calcular ICMS
    this.server.tool(
      "calcular_icms",
      "Calcula o ICMS de uma operação (interna ou interestadual)",
      {
        valor: z.number().describe("Valor da mercadoria em reais"),
        uf_origem: z.string().describe("UF de origem (ex: SP, RJ, MG)"),
        uf_destino: z.string().describe("UF de destino (ex: SP, RJ, MG)"),
        consumidor_final: z.boolean().optional().describe("Se o destinatário é consumidor final")
      },
      async ({ valor, uf_origem, uf_destino, consumidor_final }) => ({
        content: [{ type: "text", text: JSON.stringify(calcularICMS(valor, uf_origem, uf_destino, consumidor_final || false), null, 2) }],
      })
    );

    // Tool: Calcular PIS/COFINS
    this.server.tool(
      "calcular_pis_cofins",
      "Calcula PIS e COFINS sobre uma operação (regime cumulativo ou não-cumulativo)",
      {
        valor: z.number().describe("Valor da operação em reais"),
        regime: z.enum(["cumulativo", "nao_cumulativo"]).describe("Regime tributário"),
        ncm: z.string().optional().describe("Código NCM do produto")
      },
      async ({ valor, regime, ncm }) => ({
        content: [{ type: "text", text: JSON.stringify(calcularPisCofins(valor, regime, ncm), null, 2) }],
      })
    );

    // Tool: Calcular Simples Nacional
    this.server.tool(
      "calcular_simples_nacional",
      "Calcula o imposto do Simples Nacional baseado no faturamento (Anexo I - Comércio)",
      {
        receita_bruta_12m: z.number().describe("Receita bruta dos últimos 12 meses em reais"),
        receita_mes: z.number().describe("Receita do mês atual em reais")
      },
      async ({ receita_bruta_12m, receita_mes }) => ({
        content: [{ type: "text", text: JSON.stringify(calcularSimplesNacional(receita_bruta_12m, receita_mes), null, 2) }],
      })
    );

    // Tool: Calcular ISS
    this.server.tool(
      "calcular_iss",
      "Calcula o ISS (Imposto Sobre Serviços) de uma prestação de serviço",
      {
        valor: z.number().describe("Valor do serviço em reais"),
        aliquota: z.number().describe("Alíquota do ISS (entre 2% e 5%)"),
        municipio: z.string().optional().describe("Município da prestação")
      },
      async ({ valor, aliquota, municipio }) => ({
        content: [{ type: "text", text: JSON.stringify(calcularISS(valor, aliquota, municipio), null, 2) }],
      })
    );

    // Tool: Consultar NCM
    this.server.tool(
      "consultar_ncm",
      "Consulta informações sobre um código NCM incluindo descrição e alíquotas",
      { ncm: z.string().describe("Código NCM (8 dígitos)") },
      async ({ ncm }) => {
        const ncmLimpo = ncm.replace(/[^\d]/g, '');

        if (ncmLimpo.length !== 8) {
          return { content: [{ type: "text", text: JSON.stringify({ sucesso: false, erro: 'NCM deve ter 8 dígitos' }, null, 2) }] };
        }

        const ncmInfo = NCM_DATABASE[ncmLimpo];
        if (ncmInfo) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                sucesso: true,
                dados: {
                  codigo: ncmLimpo,
                  descricao: ncmInfo.descricao,
                  ipi: ncmInfo.ipi,
                  pis: ncmInfo.pis,
                  cofins: ncmInfo.cofins,
                  origem: 'Base local'
                }
              }, null, 2)
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              sucesso: false,
              erro: 'NCM não encontrado na base local. NCMs disponíveis: 84713019, 85171231, 85287200, 64039990, 22030000, 21069010, 33049990, 94032000, 02011000, 10059010'
            }, null, 2)
          }]
        };
      }
    );

    // Tool: Consultar CFOP
    this.server.tool(
      "consultar_cfop",
      "Consulta a descrição de um CFOP (Código Fiscal de Operações e Prestações)",
      { cfop: z.string().describe("Código CFOP (4 dígitos)") },
      async ({ cfop }) => {
        const cfopInfo = CFOP_DATABASE[cfop];
        if (cfopInfo) {
          return { content: [{ type: "text", text: JSON.stringify({ codigo: cfop, ...cfopInfo }, null, 2) }] };
        }
        return { content: [{ type: "text", text: JSON.stringify({ erro: `CFOP ${cfop} não encontrado` }, null, 2) }] };
      }
    );

    // Tool: Validar Chave NFe
    this.server.tool(
      "validar_chave_nfe",
      "Valida a estrutura de uma chave de acesso de NFe (44 dígitos)",
      { chave: z.string().describe("Chave de acesso da NFe (44 dígitos)") },
      async ({ chave }) => ({
        content: [{ type: "text", text: JSON.stringify(validarChaveNFe(chave), null, 2) }],
      })
    );

    // Tool: Calcular Impostos NF
    this.server.tool(
      "calcular_impostos_nf",
      "Calcula todos os impostos de uma nota fiscal de produto (ICMS, PIS, COFINS, IPI)",
      {
        valor_produto: z.number().describe("Valor total dos produtos"),
        valor_frete: z.number().optional().describe("Valor do frete"),
        uf_origem: z.string().describe("UF de origem"),
        uf_destino: z.string().describe("UF de destino"),
        ncm: z.string().optional().describe("Código NCM do produto principal"),
        regime: z.enum(["simples", "lucro_presumido", "lucro_real"]).describe("Regime tributário da empresa")
      },
      async ({ valor_produto, valor_frete, uf_origem, uf_destino, ncm, regime }) => ({
        content: [{ type: "text", text: JSON.stringify(calcularImpostosNF(valor_produto, valor_frete || 0, uf_origem, uf_destino, ncm, regime), null, 2) }],
      })
    );
  }
}

// ============================================================================
// LANDING PAGE HTML
// ============================================================================

const LANDING_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiscal BR - MCP Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: #00d9ff; font-size: 1.2rem; margin-bottom: 2rem; }
    .card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .card h2 { color: #00d9ff; margin-bottom: 1rem; font-size: 1.3rem; }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(0,217,255,0.1);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .method {
      background: #00d9ff;
      color: #1a1a2e;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.8rem;
    }
    .path { font-family: monospace; color: #fff; }
    .tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .tool {
      background: rgba(0,217,255,0.05);
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid rgba(0,217,255,0.2);
    }
    .tool-name { color: #00d9ff; font-weight: bold; font-size: 0.9rem; }
    .tool-desc { color: #aaa; font-size: 0.8rem; margin-top: 0.25rem; }
    code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 0.9rem; }
    a { color: #00d9ff; }
    .status { display: inline-flex; align-items: center; gap: 0.5rem; }
    .status-dot { width: 8px; height: 8px; background: #00ff88; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>Fiscal BR</h1>
    <p class="subtitle">MCP Server - Assistente Fiscal Brasileiro</p>

    <div class="card">
      <h2><span class="status"><span class="status-dot"></span> Status: Online</span></h2>
      <p>Servidor MCP remoto para operações fiscais brasileiras. Compatível com OpenAI App Store e Claude Desktop.</p>
    </div>

    <div class="card">
      <h2>Endpoints</h2>
      <div class="endpoint"><span class="method">SSE</span><span class="path">/sse</span> - Conexão SSE para MCP</div>
      <div class="endpoint"><span class="method">POST</span><span class="path">/mcp</span> - HTTP Transport</div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/health</span> - Health Check</div>
    </div>

    <div class="card">
      <h2>Tools Disponíveis</h2>
      <div class="tools-grid">
        <div class="tool"><div class="tool-name">validar_cpf</div><div class="tool-desc">Valida CPF brasileiro</div></div>
        <div class="tool"><div class="tool-name">validar_cnpj</div><div class="tool-desc">Valida CNPJ brasileiro</div></div>
        <div class="tool"><div class="tool-name">consultar_cnpj</div><div class="tool-desc">Consulta dados Receita Federal</div></div>
        <div class="tool"><div class="tool-name">calcular_icms</div><div class="tool-desc">Cálculo ICMS estadual/interestadual</div></div>
        <div class="tool"><div class="tool-name">calcular_pis_cofins</div><div class="tool-desc">Cálculo PIS e COFINS</div></div>
        <div class="tool"><div class="tool-name">calcular_simples_nacional</div><div class="tool-desc">Cálculo Simples Nacional</div></div>
        <div class="tool"><div class="tool-name">calcular_iss</div><div class="tool-desc">Cálculo ISS municipal</div></div>
        <div class="tool"><div class="tool-name">consultar_ncm</div><div class="tool-desc">Consulta NCM e alíquotas</div></div>
        <div class="tool"><div class="tool-name">consultar_cfop</div><div class="tool-desc">Consulta CFOP</div></div>
        <div class="tool"><div class="tool-name">validar_chave_nfe</div><div class="tool-desc">Valida chave NFe</div></div>
        <div class="tool"><div class="tool-name">calcular_impostos_nf</div><div class="tool-desc">Cálculo completo de NF</div></div>
      </div>
    </div>

    <div class="card">
      <h2>Como usar</h2>
      <p style="margin-bottom: 1rem;">Adicione este servidor no Claude Desktop ou OpenAI:</p>
      <code>{ "mcpServers": { "fiscal-br": { "url": "https://YOUR_WORKER.workers.dev/sse" } } }</code>
    </div>
  </div>
</body>
</html>`;

// ============================================================================
// WORKER HANDLER
// ============================================================================

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Landing page
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(LANDING_PAGE, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "healthy",
        server: "Fiscal BR",
        version: "1.0.0",
        timestamp: new Date().toISOString()
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // SSE endpoint
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return FiscalBRMCP.serveSSE("/sse").fetch(request, env, ctx);
    }

    // HTTP MCP endpoint
    if (url.pathname === "/mcp") {
      return FiscalBRMCP.serve("/mcp").fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
};
