# Protocolo 7614 — Boletim de notas da turma no Diário (CT-BOLETIM-001 a 033)

Pacote BDD dos cenários **CT-BOLETIM-001 a 033**, com o resultado real da homologação. Cada pasta `NN-descricao/` corresponde ao CT-BOLETIM-0NN e contém o `cenario.feature` e a evidência `pen7614-NN-descricao.png`.

O pacote anterior do mesmo protocolo (cenários 01 a 31) continua em [`../README.md`](../README.md).

**Atualização (01/10/2026, tarde):** os cenários 016, 019, 029 e 032 foram executados com uma **massa QA** criada para o teste (ver "Massa QA" abaixo). Também entrou o cenário **034**, de padronização do layout entre o Boletim de notas e o Boletim individual.

- **Execução:** 01/10/2026, na homologação (`http://veramendes.local`).
- **Exploração:** passo a passo com Playwright, com o navegador visível. O navegador do MCP Playwright estava ocupado por outra sessão ("Browser is already in use"), por isso a exploração foi feita com scripts Playwright, que usam o mesmo motor.
- **Automação:** [`e2e/protocolo7614/boletimNotasTurma.spec.ts`](../../../e2e/protocolo7614/boletimNotasTurma.spec.ts), com os helpers em [`e2e/protocolo7614/boletim.ts`](../../../e2e/protocolo7614/boletim.ts).
  - Comando: `npx playwright test e2e/protocolo7614/boletimNotasTurma.spec.ts --workers=1`.
  - Os cenários estão em dois specs:
    - `boletimNotasTurma.spec.ts`: massa real da homologação, 30 testes (24 passam, 5 `test.fail` e 1 `test.skip`, o 025);
    - `boletimMassaQA.spec.ts`: massa QA, 9 testes, incluindo o cenário 21 do pacote anterior (7 passam e 2 `test.fail`: 019 e 032).
  - Última execução (01/10/2026, 15h): suíte completa de `e2e/protocolo7614` (3 specs) com **62 ok e 1 pulado** em 8,8 min, com o navegador visível e 1 worker. Dos 62, 13 são `test.fail` que documentam defeitos.
  - **Atenção:** o CT-012/026 grava uma nota na homologação (AV1 do 1º Bimestre de Biologia do Alberto: 9,00 → 7,50) e devolve o 9,00 no final, mesmo se o teste falhar.

**Resultado:** **26 PASSOU**, **7 FALHOU** e **1 NÃO EXECUTADO** (sem massa de teste), em 34 cenários.

## Perfis considerados

Os testes consideram apenas os tipos de usuário **T.I, Gestor, Super Administrador, Profissional, Professor e Aluno**.

| Perfil | Regra de acesso | Usuário de teste |
|---|---|---|
| T.I | Imprime pela listagem de Diários e dentro de cada Diário | qa.ti.7614@caju.com.br |
| Gestor | Imprime pela listagem de Diários e dentro de cada Diário | qa.diretor.7614@caju.com.br |
| Super Administrador | Imprime pela listagem de Diários e dentro de cada Diário | playwright@caju.com.br |
| Profissional | Imprime pela listagem de Diários e dentro de cada Diário | qa.prof.7614@caju.com.br |
| Professor | Imprime no diário que pertence a ele | qa.professor.7614@caju.com.br (titular dos diários das turmas QA) · qa.restrito@caju.com.br (não titular) |
| Aluno | Imprime somente o boletim da própria matrícula | qa.aluno.7614@caju.com.br (sem vínculo) · qa.duas.7614@caju.com.br (criado pelo cadastro do aluno, com matrícula) |
| T.I restrito | Sem acesso ao Colégio Apoio (cenário 019) | qa.tirestr.7614@caju.com.br (Escolas Permitidas = QA-Escola 7614) |

O cargo "Secretaria", citado no CT-BOLETIM-017, não existe no sistema.

## Massa de teste (protocolo × sistema)

O protocolo usa dados de exemplo. Como eles não existem na homologação, foram usados dados reais do sistema:

| No protocolo | Na homologação |
|---|---|
| Escola Municipal Exemplo | Colégio Apoio (única escola) |
| Turma 5º Ano A, ano letivo 2026 | **3SER-M-2026 — 3º Série** (circuito 9, 8 disciplinas, 24 alunos) |
| Turma 5º Ano B | **9ANO-M-2026 — 9º Ano** (circuito 6, 4 disciplinas, 31 matrículas) |
| Circuito "Bimestral" | Circuito 9 "Sistema de Notas": 4 bimestres (AV1, AV2, REC), 2 semestres (REC) e Etapa Final (N1, N2) |
| Circuito "Trimestral" (1ª Série A) | Não existe. O CT-024 compara o circuito 9 (3ª Série) com o circuito 6 (9º Ano) |
| Língua Portuguesa, Matemática, Ciências | Biologia, Física, Química |
| Inglês (fora da turma) | Biologia e Inglês, que não fazem parte do 9º Ano |
| Ana Beatriz Souza (aprovada) | Alberto do Nascimento Ferreira Neto (9,00 e 8,00 → 8,50) |
| Aluno com recuperação | Florenço Ferreira da Silva Junior (5,00 e 6,00 + REC 8,00 → 8,00) |
| Carla Mendes (sem AV2) | Ingrid Maria do Nascimento dos Santos (só AV1 8,00) |
| Bruno Lima (nota zero) | Davi Silva Lima (0,00) |
| Diego Alves (sem registro) | Yasmim da Silva Rocha |
| Gabriel Nunes (outra turma) | Vitor Bruno Diniz Bergamine de Sousa (9º Ano) |
| Nome longo com apóstrofo | Carlos Alexandre Cardozo da Silva Fonseca (41 caracteres). Nenhum aluno tem apóstrofo |
| 200 aulas / 10 faltas | 2 aulas registradas na turma (Biologia e Física), com faltas para 4 alunos |

As notas vêm de `e2e/lancamentos/notas3Serie.spec.ts` (uma condição por aluno, a mesma em todas as disciplinas e bimestres). O CT-012/026 altera **uma** nota (AV1 do 1º Bimestre de Biologia do Alberto, de 9,00 para 7,50), gera o boletim e devolve o 9,00 no final.

## Massa QA (criada em 01/10/2026 para os cenários 016, 019, 029, 032 e para o 21 do pacote anterior)

Todos os registros têm o prefixo **QA** e ficam separados das turmas reais:

| Registro | Detalhe |
|---|---|
| Turmas | QA-7614-A (id 15), QA-7614-B (16) e QA-7614-V (17, vazia), na etapa "Ensino médio - 3ª Série" (circuito 9), ano 2026 |
| Professor | "QA Professor 7614" (profissional 46, usuário 72), titular de Biologia: diários 61 (A), 62 (B) e 63 (V) |
| Aluno em duas turmas | "QA Aluno Duas Turmas 7614" (aluno 883, usuário 73): matrículas 189 (A) e 190 (B). Uma aula em 30/09 em cada diário (3º Bimestre); a falta é só em B. AV1/AV2: 8,00 em A e 5,00 em B |
| Aluno remanejado | "QA Aluno Remanejado 7614" (aluno 884, usuário 74): matrícula 191 em B (6,00) com situação **Remanejado** e matrícula 192 em A (9,00) |
| Escola e T.I restrito | "QA-Escola 7614" (id 5) e o usuário "QA T.I Restrito 7614" (id 75, cargo T.I), com acesso só a essa escola |

As credenciais estão no `.env` (`QA_7614_PROFESSOR_EMAIL`, `QA_7614_TI_RESTRITO_*` e `QA_7614_ALUNO_MATRICULADO_EMAIL`). A senha do professor e do aluno é `QA_7614_PASSWORD`.

## Índice

| # | Cenário | Severidade sugerida | Resultado | Pasta |
|---|---------|---------------------|-----------|-------|
| 01 | Gerar boletim de notas pelo Diário com cada tipo de usuário | Alta | ❌ FALHOU | `FALHOU/01-gerar-boletim-pelo-diario-por-perfil/` |
| 02 | Boletim apresenta somente os alunos da turma | Alta | ✅ PASSOU | `PASSOU/02-somente-alunos-da-turma/` |
| 03 | Alunos apresentados na ordem da chamada | Média | ❌ FALHOU | `FALHOU/03-ordem-da-chamada/` |
| 04 | Boletim considera o ano letivo da turma acessada | Média | ✅ PASSOU | `PASSOU/04-ano-letivo-da-turma/` |
| 05 | Cabeçalho exibe Escola, Ano letivo e Turma | Baixa | ✅ PASSOU | `PASSOU/05-cabecalho-escola-ano-turma/` |
| 06 | Boletim apresenta as disciplinas ministradas na turma | Alta | ✅ PASSOU | `PASSOU/06-disciplinas-da-turma/` |
| 07 | Estrutura inicial com um aluno por linha | Baixa | ✅ PASSOU | `PASSOU/07-um-aluno-por-linha/` |
| 08 | Colunas de avaliações montadas conforme o Circuito de Notas | Alta | ✅ PASSOU | `PASSOU/08-colunas-conforme-circuito/` |
| 09 | Exibir médias, recuperações e faltas por período | Alta | ✅ PASSOU | `PASSOU/09-medias-recuperacoes-e-faltas/` |
| 10 | Exibir resultados semestrais e finais conforme o Circuito | Alta | ✅ PASSOU | `PASSOU/10-resultados-semestrais-e-finais/` |
| 11 | Exibir percentual anual de frequência do aluno | Média | ✅ PASSOU | `PASSOU/11-frequencia-anual/` |
| 12 | Dados acadêmicos exibidos na posição correspondente | Alta | ✅ PASSOU | `PASSOU/12-dados-na-posicao-correspondente/` |
| 13 | Avaliação sem nota registrada não exibe valor inexistente | Alta | ✅ PASSOU | `PASSOU/13-avaliacao-sem-nota/` |
| 14 | Disciplina fora da composição da turma não é apresentada | Alta | ✅ PASSOU | `PASSOU/14-disciplina-fora-da-turma/` |
| 15 | Aluno de outra turma não é apresentado | Alta | ✅ PASSOU | `PASSOU/15-aluno-de-outra-turma/` |
| 16 | Frequência de outra turma não compõe o percentual | Média | ✅ PASSOU | `PASSOU/16-frequencia-de-outra-turma/` |
| 17 | Usuário sem vínculo com o diário não visualiza a opção Boletim de notas | Alta | ✅ PASSOU | `PASSOU/17-sem-vinculo-nao-ve-a-opcao/` |
| 18 | Usuário sem vínculo não gera o boletim por acesso direto | Baixa | ❌ FALHOU | `FALHOU/18-acesso-direto-negado/` |
| 19 | Usuário T.I sem permissão na turma não gera o boletim | Alta | ❌ FALHOU | `FALHOU/19-ti-sem-permissao-na-turma/` |
| 20 | Geração do boletim com sessão expirada | Média | ❌ FALHOU | `FALHOU/20-sessao-expirada/` |
| 21 | Feedback visual durante a geração do PDF | Baixa | ❌ FALHOU | `FALHOU/21-feedback-e-sem-duplicidade/` |
| 22 | Legibilidade do PDF com muitas colunas | Baixa | ✅ PASSOU | `PASSOU/22-legibilidade-muitas-colunas/` |
| 23 | Períodos com avaliações diferentes respeitam a configuração de cada período | Média | ✅ PASSOU | `PASSOU/23-avaliacoes-por-periodo/` |
| 24 | Turmas de etapas diferentes geram estruturas conforme o próprio Circuito | Alta | ✅ PASSOU | `PASSOU/24-estrutura-por-circuito/` |
| 25 | Boletim de turma de ano letivo anterior | Média | ⏸️ NÃO EXECUTADO | `NAO-EXECUTADO/25-ano-letivo-anterior/` |
| 26 | Boletim reflete alteração recente de nota | Alta | ✅ PASSOU | `PASSOU/26-alteracao-recente-de-nota/` |
| 27 | Nota zero registrada é exibida como informação válida | Média | ✅ PASSOU | `PASSOU/27-nota-zero/` |
| 28 | Aluno sem nenhum registro acadêmico no ano | Média | ✅ PASSOU | `PASSOU/28-aluno-sem-registro/` |
| 29 | Aluno remanejado durante o ano letivo | Média | ✅ PASSOU | `PASSOU/29-aluno-remanejado/` |
| 30 | Nomes longos e caracteres especiais | Baixa | ✅ PASSOU | `PASSOU/30-nomes-longos-e-acentos/` |
| 31 | Turma com grande volume de alunos e disciplinas | Média | ✅ PASSOU | `PASSOU/31-grande-volume-de-alunos-e-disciplinas/` |
| 32 | Turma sem alunos enturmados | Baixa | ❌ FALHOU | `FALHOU/32-turma-sem-alunos/` |
| 33 | Limites do percentual de frequência | Média | ✅ PASSOU | `PASSOU/33-limites-da-frequencia/` |
| 34 | Padronizar o layout de boletins para Boletim de notas e Boletim individual | Baixa | ✅ PASSOU | `PASSOU/34-layout-padronizado-dos-boletins/` |

## Resumo de falhas

| # | Falha | Severidade |
|---|-------|------------|
| 01 | **Aluno não imprime o próprio boletim.** O cargo Aluno não tem nenhuma permissão de boletim, não tem "Diários" no menu e recebe 403 nas rotas do diário. Os demais perfis geram o boletim; o do Professor foi confirmado só pela configuração do cargo. | Alta |
| 19 | **T.I de outra escola gera o boletim.** O usuário T.I com acesso só à "QA-Escola 7614" não vê os diários do Colégio Apoio na lista. Mesmo assim, abre /diarios/3 (200) e gera o boletim da 3SER-M-2026 (POST 202): o PDF sai completo, com "Gerado por: QA T.I Restrito 7614". | Alta |
| 03 | **Nº não segue a chamada.** O "Nº" é a posição na lista: no 9º Ano, a matrícula sem nº de chamada ("Sem nome") vira Nº 1 e desloca a numeração de todos. | Média |
| 20 | **Sessão expirada não redireciona para o login.** Nenhum PDF é gerado (POST 401), mas a tela fica no diário com "Sua sessão expirou. Entre novamente para gerar o documento." e o botão "Tentar novamente". | Média |
| 18 | **Mensagem diferente da especificada.** O acesso direto é negado (403), mas a mensagem é "Acesso Negado — Você não tem permissão para acessar esta página." em vez de "Acesso não permitido". | Baixa |
| 21 | **Clique duplo fecha o indicador.** Não há geração duplicada (1 pedido só), mas o 2º clique cai em "Fechar e avisar quando ficar pronto", que abre na mesma posição do "Gerar". O indicador some e o aviso chega só pelo toast/sino. | Baixa |
| 32 | **Turma sem alunos não gera PDF.** O diálogo mostra "0 de 0" e "Nenhum aluno encontrado para “”." (mensagem de busca com aspas vazias), e o botão fica desabilitado. Não sai o PDF com o cabeçalho e "Nenhum aluno encontrado para esta turma". | Baixa |

## Cenário não executado (sem massa)

| # | O que falta na homologação |
|---|---|
| 25 | Ano letivo anterior. Só existe 2026 e, por decisão do QA, a massa de 2025 não foi criada |

## Execuções parciais (limites da massa)

- **CT-004:** só existe 2026, então não dá para provar que notas de 2025 ficam de fora.
- **CT-023 e 024:** não há bimestre com avaliações diferentes (ex.: AV3) nem circuito trimestral. A diferença testada é a da Etapa Final (N1 e N2 × só N1).
- **CT-030:** nenhum aluno tem apóstrofo no nome.
- **CT-031:** a maior turma com circuito tem 24 alunos e 8 disciplinas, não 45 e 12.
- **CT-033:** só os limites 100% e 0% têm massa. O PDF mostra o percentual inteiro, então o caso "66,7%" do protocolo apareceria como "67".

## Observações

- **Matrícula em duas turmas:** o sistema aceitou o mesmo aluno "Cursando" em duas turmas do mesmo ano (QA-7614-A e B).
- **Remanejado no PDF:** a turma de origem continua listando o aluno remanejado. O diálogo mostra "· Remanejado", mas o PDF não indica a situação.
- **Lançamento de aula pela API:** `POST /diarios/<built-in function id>/aulas` sem a lista de presença grava 1 falta para todos os alunos (visto na Auditoria). Na massa QA, as faltas indevidas foram zeradas.
- **Layout (cenário 034):** os títulos, a linha "Escola", o formato da frequência e o prefixo do nome do arquivo são diferentes entre os dois boletins. Os detalhes estão no `.feature`.

- **Continuação de tabela (pacote anterior, cenário 25):** a tabela que continua na página seguinte repete os títulos das colunas, mas não o nome da disciplina.
- **Etapa Final do 9º Ano:** mostra a Média (ex.: 8,50) com a N1 vazia. Na 3ª Série, a Etapa Final fica toda vazia. Vale confirmar a regra da Etapa Final do circuito 6.
- **Nome da matrícula sem nome:** o PDF mostra "Sem nome", e a lista de alunos do diário mostra "Aluno sem nome".

## Árvore

```
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
```
