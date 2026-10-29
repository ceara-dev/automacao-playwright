# Protocolo 7633 — [SAAS] Aumentar limite de caracteres dos campos de e-mail

## Pedido

**Regra:** os campos de e-mail passam a aceitar até **50 caracteres**.

| Cenário | Campo | Esperado |
|---|---|---|
| 1 | E-mail ("Login de acesso") da tela de login do SAAS (hoje 30) | Aceitar até 50 caracteres e qualquer quantidade dentro do limite. Não deixar passar de 50. |
| 2 | E-mail no cadastro e na edição do profissional | Aceitar até 50 caracteres e qualquer quantidade dentro do limite. Não deixar passar de 50. **O limite é o mesmo do login.** |
| Complemento | Nome, E-mail, Filiação 1 e Filiação 2 do cadastro de Professor/Gestor | **Contador** de caracteres (`N / 50`) e máximo de 50, sem exigir o preenchimento completo. Pedido combinado depois com o desenvolvedor. |

## Execução

- **Data:** 08/10/2026.
- **Ambiente:** `http://veramendes.local`, que aponta para o `e-public-saas` local na branch `feat/#7633`, commits `7ce1629`, `72e5b7c`, `111f43f` e `ce7cb1e`.
- **Perfis:** Super Administrador (`playwright@caju.com.br`) e um visitante sem sessão (tela de login).
- **Automação:** [`e2e/protocolo7633/limiteCaracteres.spec.ts`](../../e2e/protocolo7633/limiteCaracteres.spec.ts), com os helpers em [`limites.ts`](../../e2e/protocolo7633/limites.ts).
  - Comando: `npx playwright test e2e/protocolo7633 --workers=1`.
  - Última execução: **20 passaram e 0 falharam**, em cerca de 47 s, com o navegador visível. São 17 casos do protocolo e 3 das correções.

## Resultado

**17 PASSOU · 0 FALHOU** nos casos do protocolo. Durante a execução apareceram **3 defeitos fora do escopo**. Os três **já foram corrigidos** e são verificados pelos CT-18 a CT-20 (ver [pendencia.md](pendencia.md)).

| CT | Cenário | Caso de teste | Resultado | Evidência |
|---|---|---|---|---|
| CT-01 | 1 — Login | O campo "Login de acesso" tem limite de 50 caracteres | ✅ PASSOU | [01](_evidencias/pen7633-01-login-limite-50.png) |
| CT-02 | 1 — Login | Aceita 1, 30, 31 e 50 caracteres (qualquer quantidade dentro do limite) | ✅ PASSOU | — |
| CT-03 | 1 — Login | Digitando 55 caracteres, o campo para no 50º | ✅ PASSOU | [01](_evidencias/pen7633-01-login-limite-50.png) |
| CT-04 | 1 — Login | Sem o limite da tela, o servidor recusa 51 caracteres: "O login de acesso não pode ter mais de 50 caracteres." | ✅ PASSOU | [02](_evidencias/pen7633-02-login-servidor-recusa-51.png) |
| CT-05 | 1 — Login | Emoji colado no login é descartado | ✅ PASSOU | — |
| CT-06 | 2 — Profissional | No cadastro, o E-mail tem limite de 50 e para no 50º caractere | ✅ PASSOU | [03](_evidencias/pen7633-03-profissional-contadores.png) |
| CT-07 | 2 — Profissional | O limite do E-mail do profissional é igual ao do login | ✅ PASSOU | — |
| CT-08 | 2 — Profissional | O servidor recusa e-mail com 51 caracteres no cadastro | ✅ PASSOU | [04](_evidencias/pen7633-04-profissional-servidor-recusa-51.png) |
| CT-09 | 2 — Profissional | Cadastra o profissional com e-mail de exatamente 50 caracteres ("Profissional cadastrado!") | ✅ PASSOU | — |
| CT-10 | 2 — Profissional | O profissional entra no sistema com o login de 50 caracteres (senha = CPF) | ✅ PASSOU | — |
| CT-11 | 2 — Profissional | Na edição, o E-mail mantém o limite (contador `50 / 50`) e o servidor recusa 51 | ✅ PASSOU | — |
| CT-12 | Complemento | Nome, E-mail, Filiação 1 e Filiação 2 mostram `0 / 50` antes do preenchimento | ✅ PASSOU | [03](_evidencias/pen7633-03-profissional-contadores.png) |
| CT-13 | Complemento | Com 20 caracteres, o contador mostra `20 / 50`, sem erro (não exige os 50) | ✅ PASSOU | [03](_evidencias/pen7633-03-profissional-contadores.png) |
| CT-14 | Complemento | Nos quatro campos, a digitação para no 50º caractere e o contador mostra `50 / 50` | ✅ PASSOU | [03](_evidencias/pen7633-03-profissional-contadores.png) |
| CT-15 | Complemento | O servidor recusa Nome, Filiação 1 e Filiação 2 com 51 caracteres, cada um com a sua mensagem | ✅ PASSOU | [04](_evidencias/pen7633-04-profissional-servidor-recusa-51.png) |
| CT-16 | Alinhamento | "Login de acesso" do cadastro de Usuários tem limite de 50 | ✅ PASSOU | [05](_evidencias/pen7633-05-usuarios-limite-50.png) |
| CT-17 | Alinhamento | E-mail do cadastro de Aluno tem limite de 50 | ✅ PASSOU | — |
| CT-18 | Correção PEN-02 | Profissional cadastrado sem e-mail entra com o CPF como login | ✅ PASSOU (após a correção) | — |
| CT-19 | Correção PEN-03 | O modal de exclusão pergunta "apagar este profissional?", sem falar em "cargo" | ✅ PASSOU (após a correção) | — |
| CT-20 | Correção PEN-01 | O profissional excluído não entra mais no sistema | ✅ PASSOU (após a correção) | — |

### Defeitos encontrados durante a execução (fora do escopo do protocolo)

| ID | Severidade | O que deu errado | Status | Evidência (antes) |
|---|---|---|---|---|
| PEN-7633-01 | **Média** | Um profissional excluído continua entrando no sistema com o login dele. | ✅ Corrigido (CT-20) | [06](_evidencias/pen7633-06-login-profissional-excluido.png) |
| PEN-7633-02 | **Média** | A tela de login recusa um login que é só o CPF ("O campo email deve ser um endereço de e-mail válido."). | ✅ Corrigido (CT-18) | [07](_evidencias/pen7633-07-login-por-cpf-recusado.png) |
| PEN-7633-03 | Baixa | O modal de exclusão diz "apagar este cargo". | ✅ Corrigido (CT-19) | — |

### Histórico da automação

| Execução | Resultado | Motivo |
|---|---|---|
| 1ª | 15 passaram e 2 falharam | Duas falhas **da automação**, não do sistema: o botão da edição se chama "Atualizar", e não "Salvar" (CT-11); e o e-mail do Aluno só aparece depois de "Verificar CPF" (CT-17). |
| 2ª | 17 passaram | Seletores corrigidos. |
| 3ª | 20 passaram | Entraram os CT-18 a CT-20, depois das correções dos PEN-7633-01 a 03. |

## Arquivos

- [analise.md](analise.md): análise de QA (escopo, técnica e cobertura).
- [pendencia.md](pendencia.md): defeitos e pendências abertas.
- [_evidencias/](_evidencias/): capturas `pen7633-NN-*.png`.
