"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SectionCard } from "@/components/dashboard/section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const SENHA_TAMANHO_MIN = 6

function iniciais(nome: string, email: string): string {
  const base = nome.trim() || email.split("@")[0] || ""
  const partes = base.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase()
  return (partes[0]![0] + partes[partes.length - 1]![0]).toUpperCase()
}

export function MinhaContaCard({ email, fullName }: { email: string; fullName: string }) {
  const [nome, setNome] = useState(fullName)
  const [salvandoNome, setSalvandoNome] = useState(false)

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const nomeAlterado = nome.trim() !== fullName.trim()

  async function handleSalvarNome() {
    const nomeAparado = nome.trim()
    if (!nomeAparado) {
      toast.error("Informe um nome de exibição.")
      return
    }

    setSalvandoNome(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { full_name: nomeAparado } })
      if (error) {
        toast.error("Não foi possível salvar. Tente novamente.")
        return
      }
      setNome(nomeAparado)
      toast.success("Dados atualizados.")
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.")
    } finally {
      setSalvandoNome(false)
    }
  }

  async function handleAlterarSenha() {
    if (novaSenha.length < SENHA_TAMANHO_MIN) {
      toast.error(`A senha precisa ter pelo menos ${SENHA_TAMANHO_MIN} caracteres.`)
      return
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.")
      return
    }

    setSalvandoSenha(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) {
        toast.error("Não foi possível alterar a senha. Tente novamente.")
        return
      }
      setNovaSenha("")
      setConfirmarSenha("")
      toast.success("Senha alterada.")
    } catch {
      toast.error("Não foi possível alterar a senha. Tente novamente.")
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <SectionCard title="Minha conta" description="Seus dados de acesso ao painel">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white"
          aria-hidden="true"
        >
          {iniciais(nome, email)}
        </div>

        <div className="flex w-full max-w-sm flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conta-nome">Nome de exibição</Label>
              <Input
                id="conta-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conta-email" className="text-muted-foreground">
                E-mail
              </Label>
              <Input id="conta-email" value={email} readOnly disabled />
            </div>

            <Button
              type="button"
              size="sm"
              className="w-fit gap-1.5"
              disabled={!nomeAlterado || salvandoNome}
              onClick={handleSalvarNome}
            >
              {salvandoNome ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Salvar
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">Alterar senha</p>
              <p className="text-xs text-muted-foreground">Mínimo de {SENHA_TAMANHO_MIN} caracteres.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conta-nova-senha">Nova senha</Label>
              <Input
                id="conta-nova-senha"
                type="password"
                autoComplete="new-password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="conta-confirmar-senha">Confirmar nova senha</Label>
              <Input
                id="conta-confirmar-senha"
                type="password"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit gap-1.5"
              disabled={!novaSenha || !confirmarSenha || salvandoSenha}
              onClick={handleAlterarSenha}
            >
              {salvandoSenha ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Alterar senha
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
