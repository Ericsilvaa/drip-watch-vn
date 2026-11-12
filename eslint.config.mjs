import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Regra nova do eslint-plugin-react-hooks v6. Marca o padrão já usado em 3
    // componentes (ligar o "carregando" antes de uma busca assíncrona dentro do
    // efeito). Fica como aviso até esses efeitos serem refeitos com teste.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"]),
])
