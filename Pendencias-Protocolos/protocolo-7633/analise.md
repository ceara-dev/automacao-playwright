# Análise de QA — Protocolo 7633

## 1. Escopo

| Origem | Campo | Tela | `id` |
|---|---|---|---|
| Cenário 1 | Login de acesso | `/login` | `login.input_email` |
| Cenário 2 | E-mail | `/profissionais/criar` e `/profissionais/{id}` | `profissional.email` |
| Complemento | Nome, Filiação 1, Filiação 2 (+ contador no E-mail) | mesmas telas do profissional | `profissional.nome`, `profissional.filiacao1`, `profissional.filiacao2` |
| Alinhamento feito pelo dev | Login de acesso (Usuários) e E-mail (Aluno) | `/usuarios/criar` e `/alunos/criar` | `usuario.email`, `aluno.email` |

**Situação antes da mudança:**

| Campo | Tela | Servidor |
|---|---|---|
| Login | 30 em produção e 255 em homologação, onde o #7614 já tinha mudado o valor | 255 |
| E-mail do profissional | sem limite | 100 |
| Nome do profissional | 120 | 120 |
| Filiações | 100 | 100 |

## 2. Regras verificadas

| # | Regra | Como foi verificada | CT |
|---|---|---|---|
| R1 | O campo aceita até 50 caracteres | atributo `maxlength="50"` | 01, 06, 14, 16, 17 |
| R2 | Aceita qualquer quantidade dentro do limite | valores de 1, 20, 30, 31 e 50 caracteres ficam iguais ao digitado, sem erro | 02, 13 |
| R3 | Não permite passar de 50 | `pressSequentially` de 55 caracteres: o valor final tem 50 | 03, 06, 14 |
| R4 | O limite também vale no servidor | remove o `maxlength` do DOM, envia 51 e confere a mensagem do servidor | 04, 08, 11, 15 |
| R5 | O E-mail do profissional tem o mesmo limite do login | compara o `maxlength` das duas telas | 07 |
| R6 | 50 caracteres funcionam de ponta a ponta | cadastra o profissional com e-mail de 50 e entra no sistema com ele | 09, 10 |
| R7 | O contador mostra `N / 50` o tempo todo, sem exigir o limite | `.v-counter` com `0 / 50`, `20 / 50` e `50 / 50` | 11, 12, 13, 14 |
| R8 | Emoji não entra no login | colar `jo😀o@qa.com` resulta em `joo@qa.com` | 05 |

## 3. Técnica

- **Valor-limite:** 49, 50 e 51 caracteres, além de valores pequenos (1, 20, 30 e 31). O 30 e o 31 provam que o limite antigo de 30 caiu.
- **Duas camadas:** primeiro a tela (`maxlength` e digitação real) e depois o servidor, com o limite removido do DOM. Assim fica provado que o limite não é só visual.
- **Ponta a ponta:** o cenário 2 só faz sentido se o login gerado pelo cadastro funcionar. Por isso o CT-10 entra no sistema com o e-mail de 50 caracteres.
- **Massa:** CPF válido aleatório e e-mail único `qa7633<timestamp>…@qa.com`, então a suíte pode ser repetida. No `afterAll`, os profissionais "QA-7633 …" são excluídos.

## 4. Mensagens do servidor

| Campo | Mensagem |
|---|---|
| Login | O login de acesso não pode ter mais de 50 caracteres. |
| E-mail do profissional | O e-mail não pode ter mais de 50 caracteres. |
| Nome | O nome não pode ter mais de 50 caracteres. |
| Filiação 1 | A filiação 1 não pode ter mais de 50 caracteres. |
| Filiação 2 | A filiação 2 não pode ter mais de 50 caracteres. |

As mensagens aparecem abaixo do campo e também em toast (ver evidência 04).

## 5. Riscos e o que não foi coberto

| Item | Motivo |
|---|---|
| Registros já gravados com mais de 50 caracteres (login, e-mail, nome, filiação) | Não existem na massa local. Na edição, esses registros vão ser recusados até que o texto seja encurtado. Recomendação: rodar a consulta pré-deploy do desenvolvedor (`.docs/7633/analise.md` §3 D1 e §8). |
| Login pelo app mobile | O app usa o mesmo validador do login (`AuthNotifiqController`). Não foi testado pela tela do app. |
| Homologação oficial | A suíte rodou no ambiente local, na branch do ticket. Precisa ser repetida depois do deploy. |
| Gravação de Usuários e Aluno com 50 e 51 caracteres | Na tela, só foi conferido o `maxlength`. O servidor está coberto pelos testes Pest do desenvolvedor (`UsuariosEmailTest`, `AlunosEmailTest`). |

## 6. Observações

- O campo E-mail do profissional é `type="email"`, e o servidor também valida o formato. Um e-mail com emoji é recusado tanto pelo formato quanto pela regra de emoji.
- O botão do formulário de profissional se chama "Salvar" no cadastro e "Atualizar" na edição.
- Excluir pela listagem só manda para a lixeira. O modal de confirmação pede o id do registro e diz "apagar este cargo", mesmo sendo um profissional (defeito de texto já conhecido em outros módulos).
