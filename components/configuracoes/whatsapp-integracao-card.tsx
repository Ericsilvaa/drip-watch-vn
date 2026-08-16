import { SectionCard } from "@/components/dashboard/section-card"
import { WhatsappConexaoRow } from "@/components/configuracoes/whatsapp-conexao-row"

/**
 * Uma integração só, "Lavateria Fast": uma instância WhatsApp atende as
 * duas unidades (decisão final em docs/prd/EPICO_MVP.md), então é um card
 * com uma única linha de conexão — não uma por unidade.
 */
export function WhatsappIntegracaoCard() {
  return (
    <SectionCard title="Lavateria Fast" description="Integração WhatsApp — mesmo número para as duas unidades">
      <WhatsappConexaoRow />
    </SectionCard>
  )
}
