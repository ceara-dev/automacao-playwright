# Protocolo 7614 — [SAAS] Implementar boletim de notas da turma no Diário

Índice de cenários (BDD/Gherkin) com o resultado real do ambiente de homologação.

> **Pacote CT-BOLETIM-001 a 033:** os 33 cenários do roteiro "Boletim de notas da turma no Diário", feitos com a massa real do sistema e com os seis perfis (T.I, Gestor, Super Administrador, Profissional, Professor e Aluno), estão em [`ct-boletim/README.md`](ct-boletim/README.md).

- **1ª execução:** 01/10/2026, 10h.
- **Reexecução completa:** 01/10/2026, 11h, depois da atualização do ambiente.
- **Revisão da regra de acesso:** 01/10/2026, 12h. Os resultados abaixo já consideram a regra revisada.
- **Escopo:** teste de fluxo, caminho feliz e sanidade.
- **Automação:** [`e2e/protocolo7614/boletimTurma.spec.ts`](../../e2e/protocolo7614/boletimTurma.spec.ts), com helpers em `boletim.ts`. Comando: `npx playwright test e2e/protocolo7614 --workers=1`.
  - Última execução (01/10/2026, 12h30, regra revisada): **24/24 ok** em 2,9 min, com o navegador visível e 1 worker.
  - São 23 testes do protocolo mais o setup. Deles, 17 passam e 6 são `test.fail`, que documentam os defeitos ainda abertos (03, 20, 23, 24, 27 e 29).
  - Última execução (01/10/2026, 15h): suíte completa de `e2e/protocolo7614` (3 specs) com **62 ok e 1 pulado**, com 1 worker.
  - O cenário 21 (professor titular) foi executado depois com um professor de teste (`qa.professor.7614`), em [`e2e/protocolo7614/boletimMassaQA.spec.ts`](../../e2e/protocolo7614/boletimMassaQA.spec.ts).

**Resultado:** **23 PASSOU** e **7 FALHOU**.

As pastas são `PASSOU/` e `FALHOU/`. O cenário 21, que estava em `NAO-EXECUTADO/`, foi executado em 01/10/2026 à tarde com a massa QA (ver [`ct-boletim/README.md`](ct-boletim/README.md) › "Massa QA") e passou.

## Regra de acesso considerada

| Cargo | Onde pode imprimir o boletim | Escopo |
|---|---|---|
| T.I | Listagem de Diários (Imprimir do cartão) **e** dentro de cada diário (Imprimir) | Todas as turmas |
| Gestor | Listagem e dentro de cada diário | Todas as turmas |
| Super Administrador | Listagem e dentro de cada diário | Todas as turmas |
| Profissional | Listagem e dentro de cada diário | Todas as turmas |
| Professor | Os seus diários ("Meus Diários" e dentro do diário) | Só os diários que pertencem a ele |
| Aluno | O próprio boletim | Só a sua matrícula |

O sistema não tem os cargos "Diretor" e "Coordenador". Os dois são do cargo **Gestor**, e o teste usa o usuário `qa.diretor.7614`.

| # | Cenário | Severidade sugerida | Pasta |
|---|---------|---------------------|-------|
| 01 | Gerar o boletim pelo Diário | Baixa | `PASSOU/01-gerar-boletim-pelo-diario/` |
| 02 | Apresentar somente os alunos da turma | Alta | `PASSOU/02-somente-alunos-da-turma/` |
| 03 | Apresentar os alunos na ordem da chamada | Média | `FALHOU/03-ordem-da-chamada/` |
| 04 | Considerar o ano letivo da turma acessada | Média | `PASSOU/04-ano-letivo-da-turma/` |
| 05 | Exibir o cabeçalho do PDF | Baixa | `PASSOU/05-cabecalho-escola-ano-turma/` |
| 06 | Apresentar somente as disciplinas da turma | Alta | `PASSOU/06-somente-disciplinas-da-turma/` |
| 07 | Relacionar as informações acadêmicas à disciplina correta | Alta | `PASSOU/07-dados-relacionados-a-disciplina/` |
| 08 | Apresentar cada aluno em uma linha com Nº e Nome | Baixa | `PASSOU/08-linha-por-aluno-numero-e-nome/` |
| 09 | Montar as colunas dinamicamente conforme o Circuito de Notas | Alta | `PASSOU/09-colunas-dinamicas-por-circuito/` |
| 10 | Exibir médias e recuperações conforme as regras do circuito | Alta | `PASSOU/10-medias-e-recuperacoes-conforme-circuito/` |
| 11 | Exibir as faltas de cada período | Média | `PASSOU/11-faltas-por-periodo/` |
| 12 | Seguir as regras do circuito nos resultados semestrais e finais | Alta | `PASSOU/12-resultados-semestrais-e-finais/` |
| 13 | Apresentar o percentual de frequência ao final do ano letivo | Média | `PASSOU/13-frequencia-anual/` |
| 14 | Não apresentar valor inexistente quando não há registro | Alta | `PASSOU/14-sem-valor-inexistente/` |
| 15 | Gerar o boletim de turma sem circuito de notas | Média | `PASSOU/15-turma-sem-circuito-somente-frequencia/` |
| 16 | Gerar o boletim apenas para alunos escolhidos | Baixa | `PASSOU/16-gerar-para-alunos-escolhidos/` |
| 17 | Permitir ao T.I imprimir pela listagem e pelo diário | Alta | `PASSOU/17-acesso-ti-listagem-e-diario/` |
| 18 | Permitir ao Gestor imprimir pela listagem e pelo diário | Alta | `PASSOU/18-acesso-gestor-listagem-e-diario/` |
| 19 | Permitir ao Super Administrador imprimir pela listagem e pelo diário | Alta | `PASSOU/19-acesso-super-admin-listagem-e-diario/` |
| 20 | Permitir ao Profissional imprimir pela listagem e pelo diário | Alta | `FALHOU/20-acesso-profissional-listagem-e-diario/` |
| 21 | Permitir ao Professor imprimir o boletim dos diários que são dele | Alta | `PASSOU/21-acesso-professor-titular-diario-proprio/` |
| 22 | Negar ao Professor o boletim de diário que não é dele | Alta | `PASSOU/22-acesso-professor-diario-de-outro/` |
| 23 | Permitir ao Aluno imprimir o boletim da própria matrícula | Alta | `FALHOU/23-acesso-aluno-propria-matricula/` |
| 24 | Manter o título da disciplina junto da tabela na quebra de página | Baixa | `FALHOU/24-quebra-de-pagina-titulo-da-disciplina/` |
| 25 | Identificar a tabela de frequência anual | Baixa | `PASSOU/25-titulo-da-tabela-de-frequencia-anual/` |
| 26 | Seguir o modelo base do layout (docs) | Baixa | `FALHOU/26-aderencia-ao-modelo-base/` |
| 27 | Nomear o arquivo e preencher os metadados do PDF | Baixa | `FALHOU/27-nome-e-metadados-do-arquivo/` |
| 28 | Escolher as disciplinas do boletim | Média | `PASSOU/28-selecionar-disciplinas-do-boletim/` |
| 29 | Informar o estado das disciplinas selecionadas para tecnologias assistivas | Baixa | `FALHOU/29-acessibilidade-selecao-de-disciplinas/` |
| 30 | Gerar o boletim pelo menu Imprimir da listagem de Diários | Média | `PASSOU/30-gerar-pela-listagem-de-diarios/` |

## Matriz de acesso observada (regra revisada)

| Cargo | Menu "Diários" | Listagem › Imprimir › Boletim | Diário › Imprimir › Boletim | Gerar (POST) | Resultado |
|---|---|---|---|---|---|
| T.I | sim | ✅ | ✅ | 202 | ✅ PASSOU |
| Gestor | sim | ✅ | ✅ | 202 | ✅ PASSOU |
| Super Administrador | sim | ✅ | ✅ | 202 | ✅ PASSOU |
| Profissional | **não** | ❌ `/diarios` → 403 (sem `diarios.list`) | ✅ (só pela URL) | 202 | ❌ FALHOU (cenário 20) |
| Professor — diário de outro | sim ("Meus Diários") | diário de outro não aparece | 403 | 403 | ✅ PASSOU (cenário 22) |
| Professor — diário próprio | sim ("Meus Diários": só os 3 diários dele) | sim | 200 | 202 | ✅ PASSOU (cenário 21, professor de teste) |
| Aluno | não | ❌ 403 | ❌ 403 | 403 | ❌ FALHOU (cenário 23): o cargo não tem permissão de impressão |

Permissões de impressão por cargo (ACL):

| Cargo | Permissões |
|---|---|
| T.I, Gestor, Super Administrador, Professor | `diarios.list`, `turmas.diario`, `turmas.diario.print.boletim`, `turmas.diario.print.boletim-alunos` |
| Profissional | as mesmas, **sem `diarios.list`** |
| Aluno | **nenhuma** |

## O que mudou com a atualização do ambiente

| Item | Antes | Depois |
|------|-------|--------|
| Pontos de entrada | Tela do diário › Imprimir | Tela do diário **e** listagem de Diários › Imprimir do cartão: mesmo diálogo e mesmo PDF (cenário 30) |
| Diálogo | "Para quem você quer gerar?" com o rádio Todos/Escolher alunos e o botão "Cancelar" | "Boletim de notas (N alunos)": seções **Disciplinas** (Todas/Individual) e **Alunos** (todos marcados, "Marcar todos"/"Desmarcar todos"), botão "Fechar" |
| Disciplinas | Sempre todas | Escolha individual (`diarios[]` no pedido). Cenário 28 |
| Título do PDF | "Boletim de Notas da Turma" | "BOLETIM DE NOTAS DA TURMA" |
| Tabelas | Sem bordas | Com grade |
| Frequência anual | Sem título | "Frequência anual na turma". Cenário 25 |
| Local, data e assinatura | Ausentes | "Parnaíba - PI, ___ de ___ de ___" e "Assinatura do(a) Diretor(a)". Cenário 26 parcialmente corrigido |
| Nº de chamada, quebra de página, nome do arquivo | Defeitos | **Sem mudança** |

## Massa de dados e usuários

- **Turmas:**
  - **3SER-M-2026** (circuito 9, 8 disciplinas, 24 alunos);
  - **9ANO-M-2026** (circuito 6, 4 disciplinas, 31 matrículas);
  - **2SER-M-2026** (sem circuito, 38 alunos).
- **Notas:** lançadas nos 4 bimestres com 16 condições (aprovado, na média, reprovado, 6,90 / 6,80 / 6,70, 6,99 / 7,01, arredondamento, 0 e 10, recuperações, parcial e inválido). Ver `e2e/lancamentos/`.

| Cargo | Usuário de teste |
|---|---|
| T.I | qa.ti.7614@caju.com.br |
| Gestor | qa.diretor.7614@caju.com.br |
| Super Administrador | playwright@caju.com.br |
| Profissional | qa.prof.7614@caju.com.br |
| Professor (sem vínculo com a 3ª Série) | qa.restrito@caju.com.br |
| Aluno | qa.aluno.7614@caju.com.br (sem matrícula vinculada) |

Os usuários `qa.*.7614` foram criados para este teste, com senha `Qa@7614final`. O usuário `qa.coord.7614` (Gestor) também existe, mas não é mais usado.

**Regra de login do professor:** o "Login de acesso" é o **e-mail** e a senha é o **CPF**.

**Professores titulares da 3ª Série e do 9º Ano (8 pessoas):**

- **Situação das contas:**
  - nenhum deles trocou a senha ainda, então o 1º acesso deve exigir a troca;
  - **2 não conseguem entrar** por causa do limite de 30 caracteres do login, porque os e-mails têm 33 e 34 caracteres.
- **Por que o login deles não foi feito:** o login com a conta real (e-mail e CPF de um professor) foi **bloqueado pela política de proteção de dados pessoais** do ambiente de automação. Por isso o cenário 21 foi executado com a opção **(b)**: o professor de teste "QA Professor 7614" (`qa.professor.7614@caju.com.br`), titular de Biologia nas turmas QA-7614-A, B e V. No 1º acesso, o login foi e-mail + CPF e a troca de senha foi obrigatória.

## Resumo de falhas

| # | Falha | Severidade |
|---|-------|------------|
| 20 | O **Profissional** não imprime pela listagem: o menu não exibe "Diários" e `/diarios` responde 403, porque o cargo não tem `diarios.list`. Só chega ao boletim abrindo o diário pela URL. | Alta |
| 23 | O **Aluno** não imprime o próprio boletim: o cargo não tem nenhuma permissão de impressão nem de Diários (403 em tudo), e não há outro ponto de entrada do boletim para o aluno. | Alta |
| 03 | O "Nº" é a posição na lista, não o nº de chamada. Uma matrícula sem nº de chamada ("Sem nome", 9º Ano) vira Nº 1 e desloca a numeração de todos. | Média |
| 24 | A continuação de uma tabela na página seguinte não repete o nome da disciplina. A página 6 abre com uma faixa vazia com duas linhas. | Baixa |
| 26 | Diferenças em relação ao modelo base: sem razão social, sem CNPJ, telefone sem DDD/máscara. Local/data e assinatura já foram corrigidos. | Baixa |
| 27 | Nome do arquivo com o ano repetido (`boletim-3ser-m-2026-2026.pdf`), metadado Title vazio, e o título não indica quando há filtro de disciplinas. | Baixa |
| 29 | A seleção de disciplinas (chips) não informa o estado marcada/desmarcada para tecnologias assistivas: só muda a cor. | Baixa |

## Sugestões de usabilidade, redundância e padrão do sistema

1. **Redundância de entrada.** O boletim é **da turma** e traz todas as disciplinas, mas aparece no menu Imprimir de **cada diário** (8 entradas iguais na 3ª Série), tanto na listagem quanto dentro do diário. Sugestões:
   - ter também uma entrada única na tela da **Turma**;
   - ou renomear o item para "**Boletim de notas da turma**".
2. **Aluno.** Definir onde o aluno imprime o boletim (por exemplo, "Meu boletim" no menu do aluno), já filtrado pela própria matrícula, sem expor o boletim da turma.
3. **Rótulos.** "Boletim de notas" e "Boletim individual — Uma página por aluno" ficam lado a lado. Usar "Boletim da turma" e "Boletim individual (por aluno)".
4. **Padrão de diálogo.** O novo diálogo removeu "Cancelar" e deixou só o "X"/"Fechar". Os demais diálogos do sistema usam "Cancelar" ao lado da ação principal.
5. **Frequência com filtro de disciplinas.** Com só algumas disciplinas escolhidas, a "Frequência anual na turma" continua somando as aulas de todas as disciplinas. Deixe isso explícito na legenda.
6. **Quebra de página.** Repetir "{Disciplina} (continuação)" e o título da frequência anual nas páginas seguintes, e eliminar a faixa vazia no topo da página 6.
7. **Cabeçalho.** Completar com razão social, CNPJ e telefone com DDD e máscara, como no modelo base.
8. **Padrão decimal.** O PDF usa vírgula ("8,50"), mas a tela "Registro de notas/conceitos" mostra a Nota da Etapa com ponto ("8.50") — defeito DIA-10.
9. **Etapa Final vazia.** Diferenciar "etapa ainda não calculada" de "sem registro", com "—" e uma explicação na legenda.
10. **Seleção acessível.** Usar `v-chip-group` com `aria-pressed` ou checkboxes para as disciplinas, com o nome da disciplina como rótulo.
11. **Nome do arquivo.** Usar `boletim-turma-3SER-M-2026.pdf`, e incluir no título "— N disciplinas" quando houver filtro.

## Achados fora do escopo do protocolo

| Achado | Severidade |
|--------|------------|
| **Login:** o campo "Login de acesso" tem `maxlength=30`, mas o cadastro aceita e-mails maiores. Usuários com e-mail acima de 30 caracteres **não conseguem entrar**. Entre os professores titulares da 3ª Série e do 9º Ano, 2 estão nessa situação (33 e 34 caracteres). | **Alta** |
| Login: a mensagem de erro anterior ("O campo email deve ser um endereço de e-mail válido.") continua na tela junto com a nova ("Usuario/senha inválidos."). | Baixa |
| Diários: "Carregar mais Diários" aparece mesmo com página única (busca "3SER", 8 de 8). | Baixa |
| Cadastro: a matrícula 187 do 9º Ano é de um aluno sem nome ("Aluno sem nome"). | Baixa (dados) |
| Cadastro: a turma 2SER-M-2026 está ligada à etapa "Ensino médio - normal/magistério - 2ª Série", sem circuito. | Média (dados) |

## Evidências (`_evidencias/` e uma por pasta de cenário)

- `pen7614-tela-dialogo-boletim.png`: diálogo (Disciplinas Todas/Individual e Alunos).
- `pen7614-tela-documento-pronto.png`: diálogo de geração (fila → pronto).
- `pen7614-pdf-3serie-p1.png`, `-p2.png`, `-p6.png`, `-p7.png`: boletim da 3ª Série (cabeçalho, notas, continuação, frequência anual e assinatura).
- `pen7614-pdf-3serie-p1-antes-da-atualizacao.png`: a mesma página antes da atualização.
- `pen7614-pdf-9ano-p1.png`: 9º Ano (Etapa Final só com N1; "Sem nome" como Nº 1).
- `pen7614-pdf-2serie-p1.png`: turma sem circuito (aviso e só frequência).
- `pen7614-pdf-parcial-2-disciplinas-2-alunos.png`: Física e Química para 2 alunos.
- Pastas 17 a 23: tela de cada cargo na listagem e no diário.

## Árvore

```
protocolo-7614
  _evidencias
    pen7614-pdf-2serie-p1.png
    pen7614-pdf-3serie-p1-antes-da-atualizacao.png
    pen7614-pdf-3serie-p1.png
    pen7614-pdf-3serie-p2.png
    pen7614-pdf-3serie-p6.png
    pen7614-pdf-3serie-p7.png
    pen7614-pdf-9ano-p1.png
    pen7614-pdf-parcial-2-disciplinas-2-alunos.png
    pen7614-tela-dialogo-boletim.png
    pen7614-tela-documento-pronto.png
  FALHOU
    03-ordem-da-chamada
      cenario.feature
      pen7614-03-ordem-da-chamada.png
    20-acesso-profissional-listagem-e-diario
      cenario.feature
      pen7614-20-acesso-profissional-listagem-e-diario.png
    23-acesso-aluno-propria-matricula
      cenario.feature
      pen7614-23-acesso-aluno-propria-matricula.png
    24-quebra-de-pagina-titulo-da-disciplina
      cenario.feature
      pen7614-24-quebra-de-pagina-titulo-da-disciplina.png
    26-aderencia-ao-modelo-base
      cenario.feature
      pen7614-26-aderencia-ao-modelo-base.png
    27-nome-e-metadados-do-arquivo
      cenario.feature
      pen7614-27-nome-e-metadados-do-arquivo.png
    29-acessibilidade-selecao-de-disciplinas
      cenario.feature
      pen7614-29-acessibilidade-selecao-de-disciplinas.png
  PASSOU
    01-gerar-boletim-pelo-diario
      cenario.feature
      pen7614-01-gerar-boletim-pelo-diario.png
    02-somente-alunos-da-turma
      cenario.feature
      pen7614-02-somente-alunos-da-turma.png
    04-ano-letivo-da-turma
      cenario.feature
      pen7614-04-ano-letivo-da-turma.png
    05-cabecalho-escola-ano-turma
      cenario.feature
      pen7614-05-cabecalho-escola-ano-turma.png
    06-somente-disciplinas-da-turma
      cenario.feature
      pen7614-06-somente-disciplinas-da-turma.png
    07-dados-relacionados-a-disciplina
      cenario.feature
      pen7614-07-dados-relacionados-a-disciplina.png
    08-linha-por-aluno-numero-e-nome
      cenario.feature
      pen7614-08-linha-por-aluno-numero-e-nome.png
    09-colunas-dinamicas-por-circuito
      cenario.feature
      pen7614-09-colunas-dinamicas-por-circuito.png
    10-medias-e-recuperacoes-conforme-circuito
      cenario.feature
      pen7614-10-medias-e-recuperacoes-conforme-circuito.png
    11-faltas-por-periodo
      cenario.feature
      pen7614-11-faltas-por-periodo.png
    12-resultados-semestrais-e-finais
      cenario.feature
      pen7614-12-resultados-semestrais-e-finais.png
    13-frequencia-anual
      cenario.feature
      pen7614-13-frequencia-anual.png
    14-sem-valor-inexistente
      cenario.feature
      pen7614-14-sem-valor-inexistente.png
    15-turma-sem-circuito-somente-frequencia
      cenario.feature
      pen7614-15-turma-sem-circuito-somente-frequencia.png
    16-gerar-para-alunos-escolhidos
      cenario.feature
      pen7614-16-gerar-para-alunos-escolhidos.png
    17-acesso-ti-listagem-e-diario
      cenario.feature
      pen7614-17-acesso-ti-listagem-e-diario.png
    18-acesso-gestor-listagem-e-diario
      cenario.feature
      pen7614-18-acesso-gestor-listagem-e-diario.png
    19-acesso-super-admin-listagem-e-diario
      cenario.feature
      pen7614-19-acesso-super-admin-listagem-e-diario.png
    21-acesso-professor-titular-diario-proprio
      cenario.feature
      pen7614-21-acesso-professor-titular-diario-proprio.png
    22-acesso-professor-diario-de-outro
      cenario.feature
      pen7614-22-acesso-professor-diario-de-outro.png
    25-titulo-da-tabela-de-frequencia-anual
      cenario.feature
      pen7614-25-titulo-da-tabela-de-frequencia-anual.png
    28-selecionar-disciplinas-do-boletim
      cenario.feature
      pen7614-28-selecionar-disciplinas-do-boletim.png
    30-gerar-pela-listagem-de-diarios
      cenario.feature
      pen7614-30-gerar-pela-listagem-de-diarios.png
  ct-boletim
    FALHOU
      01-gerar-boletim-pelo-diario-por-perfil
        cenario.feature
        pen7614-01-gerar-boletim-pelo-diario-por-perfil.png
      03-ordem-da-chamada
        cenario.feature
        pen7614-03-ordem-da-chamada.png
      18-acesso-direto-negado
        cenario.feature
        pen7614-18-acesso-direto-negado.png
      19-ti-sem-permissao-na-turma
        cenario.feature
        pen7614-19-ti-sem-permissao-na-turma.png
      20-sessao-expirada
        cenario.feature
        pen7614-20-sessao-expirada.png
      21-feedback-e-sem-duplicidade
        cenario.feature
        pen7614-21-feedback-e-sem-duplicidade.png
      32-turma-sem-alunos
        cenario.feature
        pen7614-32-turma-sem-alunos.png
    NAO-EXECUTADO
      25-ano-letivo-anterior
        cenario.feature
    PASSOU
      02-somente-alunos-da-turma
        cenario.feature
        pen7614-02-somente-alunos-da-turma.png
      04-ano-letivo-da-turma
        cenario.feature
        pen7614-04-ano-letivo-da-turma.png
      05-cabecalho-escola-ano-turma
        cenario.feature
        pen7614-05-cabecalho-escola-ano-turma.png
      06-disciplinas-da-turma
        cenario.feature
        pen7614-06-disciplinas-da-turma.png
      07-um-aluno-por-linha
        cenario.feature
        pen7614-07-um-aluno-por-linha.png
      08-colunas-conforme-circuito
        cenario.feature
        pen7614-08-colunas-conforme-circuito.png
      09-medias-recuperacoes-e-faltas
        cenario.feature
        pen7614-09-medias-recuperacoes-e-faltas.png
      10-resultados-semestrais-e-finais
        cenario.feature
        pen7614-10-resultados-semestrais-e-finais.png
      11-frequencia-anual
        cenario.feature
        pen7614-11-frequencia-anual.png
      12-dados-na-posicao-correspondente
        cenario.feature
        pen7614-12-dados-na-posicao-correspondente.png
      13-avaliacao-sem-nota
        cenario.feature
        pen7614-13-avaliacao-sem-nota.png
      14-disciplina-fora-da-turma
        cenario.feature
        pen7614-14-disciplina-fora-da-turma.png
      15-aluno-de-outra-turma
        cenario.feature
        pen7614-15-aluno-de-outra-turma.png
      16-frequencia-de-outra-turma
        cenario.feature
        pen7614-16-frequencia-de-outra-turma.png
      17-sem-vinculo-nao-ve-a-opcao
        cenario.feature
        pen7614-17-sem-vinculo-nao-ve-a-opcao.png
      22-legibilidade-muitas-colunas
        cenario.feature
        pen7614-22-legibilidade-muitas-colunas.png
      23-avaliacoes-por-periodo
        cenario.feature
        pen7614-23-avaliacoes-por-periodo.png
      24-estrutura-por-circuito
        cenario.feature
        pen7614-24-estrutura-por-circuito.png
      26-alteracao-recente-de-nota
        cenario.feature
        pen7614-26-alteracao-recente-de-nota.png
      27-nota-zero
        cenario.feature
        pen7614-27-nota-zero.png
      28-aluno-sem-registro
        cenario.feature
        pen7614-28-aluno-sem-registro.png
      29-aluno-remanejado
        cenario.feature
        pen7614-29-aluno-remanejado.png
      30-nomes-longos-e-acentos
        cenario.feature
        pen7614-30-nomes-longos-e-acentos.png
      31-grande-volume-de-alunos-e-disciplinas
        cenario.feature
        pen7614-31-grande-volume-de-alunos-e-disciplinas.png
      33-limites-da-frequencia
        cenario.feature
        pen7614-33-limites-da-frequencia.png
      34-layout-padronizado-dos-boletins
        cenario.feature
        pen7614-34-layout-padronizado-dos-boletins.png
    README.md
  README.md
```
