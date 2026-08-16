/**
 * Configuração da integração WhatsApp (Evolution API) usada pela página
 * /configuracoes. Nomes de instância e rotas centralizados aqui, no mesmo
 * espírito de config/dashboard.ts — nunca hardcoded dentro dos componentes.
 */

/**
 * Uma instância só atende as duas unidades (decisão final registrada em
 * docs/prd/EPICO_MVP.md — "lavateria-guararapes" chegou a ser criada mas
 * nunca foi pareada). O dash não gerencia nem expõe nenhuma outra
 * instância da Evolution API (ex: instâncias de teste) — só esta.
 */
export const WHATSAPP_INSTANCIA = 'lavateria-cambeba'

export const WHATSAPP_STATUS_API_ROUTE = '/api/integracao/whatsapp/status'
export const WHATSAPP_CONECTAR_API_ROUTE = '/api/integracao/whatsapp/conectar'
export const WHATSAPP_DESCONECTAR_API_ROUTE = '/api/integracao/whatsapp/desconectar'

/** Polling do status enquanto o card de pareamento está expandido aguardando escaneio. */
export const WHATSAPP_POLL_INTERVAL_MS = 3000

/** QR Code tem sessão curta por natureza — depois disso, tratamos como expirado em vez de deixar a imagem morta em tela. */
export const WHATSAPP_QR_TIMEOUT_MS = 90_000
