# Pendências — Protocolo 7633

Nos casos do protocolo, os 17 CTs passaram, e **nenhuma pendência bloqueia o #7633**. Os três defeitos encontrados durante o teste foram **corrigidos em 08/10/2026**, na branch `feat/#7633` do `e-public-saas` (ainda sem commit), e são verificados pelos CT-18 a CT-20 da automação.

## Defeitos encontrados

| ID | Severidade | Módulo | Defeito | Status | Evidência |
|---|---|---|---|---|---|
| PEN-7633-01 | **Média** | Profissionais / Acesso | Profissional excluído continua entrando no sistema | ✅ Corrigido, CT-20 | [06](_evidencias/pen7633-06-login-profissional-excluido.png) (antes) |
| PEN-7633-02 | **Média** | Login | A tela de login recusa um login que é só o CPF | ✅ Corrigido, CT-18 | [07](_evidencias/pen7633-07-login-por-cpf-recusado.png) (antes) |
| PEN-7633-03 | Baixa | Profissionais (+ todas as telas que usam o modal) | O modal de exclusão diz "apagar este cargo" | ✅ Corrigido, CT-19 | — |

### PEN-7633-01 — Profissional excluído continua com acesso

```gherkin
Dado que o profissional "QA-7633 Probe" foi cadastrado com o e-mail de 50 caracteres
E o profissional foi excluído pela listagem (foi para a lixeira)
Quando ele informar o login e a senha na tela de login
Então o sistema deveria negar o acesso
Mas o sistema exibe "Login efetuado com sucesso!" e leva para /password/change
```

- **Causa provável:** excluir o profissional não desativa nem exclui o usuário de login vinculado.
- **Impacto:** quem foi desligado mantém o acesso ao sistema.
- **Correção:** os novos métodos `ProfissionalService::excluir()` e `restaurar()`.
  - Ao excluir o profissional, o login dele também vai para a lixeira. A exceção é quando o login ainda pertence a outro profissional ativo.
  - Ao restaurar o profissional, o login volta. Se o e-mail já foi reutilizado por outro usuário ativo, o login não volta e o caso fica registrado em log.
  - Testes: `tests/Feature/Academico/Profissionais/ProfissionaisAcessoTest.php` (4 casos) e CT-20 do E2E.

### PEN-7633-02 — Login por CPF recusado

```gherkin
Dado que um profissional foi cadastrado sem e-mail
E o sistema criou o usuário com login = CPF (só dígitos)
Quando ele informar o CPF no campo "Login de acesso"
Então o sistema deveria autenticar
Mas exibe "O campo email deve ser um endereço de e-mail válido." e não envia a autenticação
```

- **Causa:** a validação do login exige o formato de e-mail. O defeito já existia antes do #7633, e o desenvolvedor também o registrou.
- **Impacto:** o profissional cadastrado sem e-mail não consegue entrar.
- **Correção:** o `LoginRequest` deixou de exigir o formato de e-mail. O login de acesso pode ser e-mail, CPF ou outro identificador livre, como já permitia o cadastro de Usuários. Continuam valendo o limite de 50 caracteres e o bloqueio de emoji.
  - Testes: o Pest "Deve logar com login de acesso que não é e-mail (CPF)" e o CT-18 do E2E, em que o profissional cadastrado sem e-mail entra com o CPF.

### PEN-7633-03 — Texto do modal de exclusão

```gherkin
Dado que estou na listagem de Profissionais
Quando escolher "Excluir" em um profissional
Então o modal deveria perguntar se desejo apagar o profissional
Mas exibe "Tem certeza que deseja apagar este cargo?"
```

- **Correção:** o `ModalConfirmation.vue` ganhou a prop `item`, com padrão "este registro".
  - Profissionais passa "este profissional", e Cargos mantém "este cargo".
  - As outras 19 telas que usam o modal deixaram de falar em "cargo" e agora dizem "este registro".
  - Testes: `tests/Js/components/ModalConfirmation.test.js` e o CT-19 do E2E.

## Ações pendentes

| # | Ação | Responsável | Status |
|---|---|---|---|
| A1 | Antes do deploy, consultar em produção os logins e e-mails com mais de 50 caracteres (há risco de o usuário perder o acesso) | Dev / DBA | ⏳ Pendente |
| A2 | Antes do deploy, consultar em produção os profissionais com nome ou filiação acima de 50 caracteres | Dev / DBA | ⏳ Pendente |
| A3 | Repetir `npx playwright test e2e/protocolo7633 --workers=1` na homologação oficial depois do deploy | QA | ⏳ Pendente |
| A4 | Decidir se as correções PEN-7633-01 a 03 seguem no #7633 ou ganham protocolo próprio (o código está na branch, ainda sem commit) | PO / Dev | ⏳ Pendente |
| A5 | Limpar a massa: profissionais "QA-7633 …" na lixeira e usuários `qa7633…@qa.com` | QA | ⏳ Pendente (a lixeira oferece "Excluir permanentemente", não testado; os usuários de login exigem a tela de Usuários) |
