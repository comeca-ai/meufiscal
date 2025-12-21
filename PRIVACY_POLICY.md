# Política de Privacidade - Fiscal BR

**Última atualização:** 21 de dezembro de 2025

## 1. Introdução

O **Fiscal BR** é um assistente fiscal brasileiro que oferece ferramentas para validação de documentos, consultas cadastrais e cálculos tributários. Esta política descreve como tratamos seus dados.

## 2. Dados que Coletamos

### 2.1 Dados Fornecidos pelo Usuário
- **CPF/CNPJ**: Apenas para validação matemática ou consulta cadastral
- **Valores monetários**: Para cálculos de impostos
- **Códigos fiscais**: NCM, CFOP, chaves de NFe

### 2.2 Dados que NÃO Coletamos
- Endereço IP
- Identificadores de dispositivo
- Cookies ou rastreadores
- Dados de localização
- Informações pessoais do usuário
- Histórico de navegação

## 3. Como Usamos os Dados

| Finalidade | Base Legal (LGPD) |
|------------|-------------------|
| Validar documentos fiscais | Execução de serviço solicitado |
| Consultar dados públicos de empresas | Legítimo interesse declarado |
| Calcular impostos | Execução de serviço solicitado |
| Auditoria anônima de consultas | Legítimo interesse do controlador |

## 4. Consulta de CNPJ

Ao solicitar consulta de CNPJ, você declara:
- Possuir **legítimo interesse** na informação (Art. 7º, IX da LGPD)
- Que o uso é para fins lícitos (comercial, jurídico, crédito, etc.)

### Fonte dos Dados
- **API**: ReceitaWS (https://receitaws.com.br)
- **Origem**: Dados públicos da Receita Federal do Brasil
- **Natureza**: Informações cadastrais de pessoas jurídicas (dados públicos)

## 5. Auditoria e Logs

Mantemos registros anônimos de consultas contendo:
- ID único da requisição (UUID aleatório)
- Data e hora
- Tipo de operação (ex: consultar_cnpj)
- CNPJ consultado
- Hash da resposta (para integridade)
- Status (sucesso/erro)

**Não registramos** nenhum dado que identifique o usuário.

## 6. Compartilhamento de Dados

| Destinatário | Dados | Motivo |
|--------------|-------|--------|
| ReceitaWS | CNPJ consultado | Obter dados cadastrais |
| Cloudflare | Logs anônimos | Infraestrutura e observabilidade |

**Não vendemos, alugamos ou compartilhamos dados pessoais.**

## 7. Armazenamento e Retenção

- **Dados de consulta**: Não armazenados (processamento em tempo real)
- **Logs de auditoria**: Retidos por 30 dias para fins de segurança
- **Localização**: Cloudflare Workers (edge computing global)

## 8. Segurança

Implementamos medidas de segurança incluindo:
- Criptografia em trânsito (HTTPS/TLS)
- Arquitetura Privacy by Design
- Sem armazenamento de dados pessoais
- Hashing de respostas para integridade

## 9. Seus Direitos (LGPD)

Você tem direito a:
- **Confirmação** da existência de tratamento
- **Acesso** aos dados (não mantemos dados pessoais)
- **Correção** de dados incompletos ou inexatos
- **Eliminação** de dados desnecessários
- **Informação** sobre compartilhamento
- **Revogação** do consentimento

## 10. Dados de Menores

Este serviço é destinado a uso profissional/empresarial. Não coletamos intencionalmente dados de menores de 18 anos.

## 11. Alterações nesta Política

Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas através do aplicativo.

## 12. Contato

Para questões sobre privacidade:

- **Desenvolvedor**: Jhonata Emerick Ramos
- **E-mail**: jhonata.emerick@gmail.com

## 13. Disposições Finais

Esta política é regida pelas leis brasileiras, em especial a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

---

**Fiscal BR** - Assistente Fiscal Brasileiro
Desenvolvido por Jhonata Emerick Ramos
