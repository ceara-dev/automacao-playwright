# AGENTS.md — Memória do projeto

Automação de testes E2E (Playwright + TypeScript) do SaaS **Apoio** (homologação).

## Ambiente

- Node 20+ (`nvm use 22`); o Playwright 1.63 não roda no Node 18.
- URL base: `http://veramendes.local`
- Stack: Vue 3 + Vuetify + Inertia + Laravel (SPA). Autenticado como Super Administrador.
- Execução: `npx playwright test` (config `headless: false`, `testDir: ./e2e`, `fullyParallel: true`).
- Para não sobrecarregar o servidor de homologação, rodar com `--workers=1`.
- O servidor **não responde ao Chromium headless** (navegação trava até o timeout) — manter `headless: false`.
- **Monitor do navegador:** `PW_MONITOR=2 npx playwright test …` (ou `PW_MONITOR=2` no `.env`) abre as janelas no 2º monitor. A posição vem do `xrandr --listmonitors` (aqui: monitor 1 em x=0 e monitor 2 em x=1920, GNOME/Wayland). Sem a variável, a janela abre na posição padrão.

## Credenciais (.env)

```
USER_EMAIL=playwright@caju.com.br          # Super Administrador (vê tudo, 0 franquias)
USER_PASSWORD=teste@060708
RESTRICTED_USER_EMAIL=qa.restrito@caju.com.br   # Professor, restrito a 1 escola (criado via UI)
RESTRICTED_USER_PASSWORD=Restrito@1234
```

## Autenticação

- Rota `/login`: textbox "Login de acesso", textbox "Senha", botão "Entrar no sistema".
- Sucesso → toast "Login efetuado com sucesso!" e redirect para `/dashboard`.
- `e2e/auth.setup.ts` salva o `storageState` em `e2e/.auth/user.json` (cookies `XSRF-TOKEN` e `saas_session_hmg`).
- **Login do professor:** "Login de acesso" = e-mail; senha = CPF.
- Usuário novo/restrito é **forçado a trocar a senha no 1º login** (`/password/change`) — a senha final do usuário restrito é `Restrito@1234`.

## Estrutura de testes

```
e2e/
├── auth.setup.ts
├── auth.ti.setup.ts
├── fixtures.ts
├── helpers/
│   ├── pdf.ts      → exportPdf(), extractStudentNames(), DEFAULT_PERIODO, ExportParams
│   └── render.ts   → renderPdfPage(), analyzePixels(), isPdfRasterizerAvailable() (usa pdftoppm)
├── Relatorios/relatoriosNotifiq/   → 12 specs do Notifiq (CT-NOTIFIQ-001 a 056)
├── regraDeNegocio/<modulo>/        → REGRAS.md (catálogo RN-<MÓD>-NN) + <modulo>.rn.spec.ts
├── protocolo7614/                  → boletim.ts (helpers) + boletimTurma / boletimNotasTurma / boletimMassaQA .spec.ts
├── protocolo7621/                  → agendaDetalhes.spec.ts (T.I. abre e publica) + relatorioColunas.spec.ts (PDF)
├── protocolo7633/                  → limites.ts (helpers) + limiteCaracteres.spec.ts (limite de 50 em login/e-mail/nome/filiações)
├── lancamentos/                    → lançamento de notas da 3ª Série e do 9º Ano (GRAVA na homologação)
├── test_dashboard.spec.ts
└── test_relatorios.spec.ts
```

- Localizadores priorizam `getByRole`; o combobox de escola usa `[id="relatorios.notifiq.escola"]` (força `click({ force: true })` pois o `v-field__input` intercepta o clique).
- `pdftoppm` (poppler) está instalado; testes visuais pulam via `test.skip` se ausente.
- Defeitos conhecidos são documentados com `test.fail(true, 'motivo')`.

## Módulo Relatórios Notifiq (`/relatorios/notifiq`)

- Abas: "Todos os relatórios" (`/relatorios?aba=todos`) e "Notifiq".
- Dashboard: Total de registros, Presenças, Saídas, Dispositivos ativos.
- Filtros: período (range), Escola, Turma, Aluno, Dispositivos Notifiq; botões "Filtrar relatórios Notifiq", "Limpar filtros", "Exportar relatórios Notifiq".
- 7 relatórios disponíveis: Registros por Período, Presença por Escola, Presença por Turma, Registros por Aluno, Registro de Entrada e Saída, Painel de Presença (Dashboard), Registros por Dispositivo.
- Tabela "Registros no período": colunas Aluno, Matrícula, Escola, Turma, Data/Hora, Dispositivo, Tipo.
- **Botão "Baixar"**: só "Registro de Entrada e Saída" tem menu PDF/CSV; os outros 5 chamam o export genérico (CSV) — ver defeitos.

## Endpoints (API)

- PDF: `/relatorios/notifiq/registro-entrada-saida/export?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&formato=pdf` (+ `turma_id`, `escola_id`, `aluno_id`, `dispositivo_id` opcionais). Header PDF: `Data: dd/mm/aaaa • Turma: ... • Escola: ... • Total de alunos: N`.
- CSV legado: `/relatorios/notifiq/export` (ainda ativo — ver defeito CT-039).
- Dados p/ preview: `/relatorios/notifiq/data?...&tipo=presenca-escola|presenca-turma|registros-aluno|registros-dispositivo|dashboard` → retorna `{indicadores, registros, resumo, dashboard}`.

## Dados do ambiente (homologação)

- **1 escola**: "Colégio Apoio" (`escola_id=1`).
- **7 turmas**: `turma_id=1` = "6º Ano" (20 alunos); demais: 7º Ano, 8º Ano, 9º Ano, 1º Série, 2º Série, 3º Série.
- **2 dispositivos**: `APOIO-1-001` e `PI-CJP-XX-14`.
- Total de registros no período padrão (~24/08 a 23/09): **5.752**; matrículas 1..186 (188 ativas).

## Defeitos confirmados (Relatório Notifiq PDF)

1. **Alta** — "Baixar" de 5 relatórios (Registros por Período, Presença por Escola/Turma, Registros por Aluno/Dispositivo) chama `relatorios.notifiq.export` e baixa `notifiq-registros-*.csv` em vez do PDF. (CT-NOTIFIQ / protocolo 17)
2. **Alta** — Usuário restrito (Professor, 1 escola) recebe **HTTP 403** ao exportar, mesmo tendo a permissão `relatorios.notifiq.export`. (CT-018 / protocolo 20)
3. **Alta** — Endpoint sem `data_inicio`/`data_fim` retorna 200 PDF (período padrão), sem rejeitar. (CT-028 / protocolo 23)
4. **Alta** — Endpoint `.csv` legado ainda ativo (200 `text/csv`), deveria ser 404/410. (CT-039 / protocolo 24)
5. **Média** — Cabeçalho "Total de alunos: 188" mas o PDF lista 183 alunos (5 ausentes). (CT-029 / protocolo 15)
6. **Média** — Datas invertidas aceitas sem validação (API retorna 200 PDF). (CT-026 / protocolo 25)
7. **Média** — Data futura retorna "Total de alunos: 188" em vez de 0. (CT-051 / protocolo 26)
8. **Baixa** — Ordenação sensível a acentos ("José" antes de "João"). (CT-031 / protocolo 16)

## Protocolo #7578 (pacote BDD)

- Local: `Pendencias-Protocolos/protocolo-7578/` (note: **"Protocolos" no plural**).
- Estrutura: `README.md` (índice + severidades), `FALHOU/` (8 cenários), `PASSOU/` (18 cenários), `_evidencias/`.
- Cada pasta `NN-descricao/` contém `cenario.feature` + `pen7578-NN-descricao.png`.
- Cenários "sem dados de teste" ficaram `test.skip` na suíte (meia-noite, dispositivo longo/vazio, matrícula com zeros, feriado, transferência, catracas, múltiplas entradas/saídas, processamento, turma desativada, registro excluído).

## Regras de negócio (`e2e/regraDeNegocio/`)

- Um diretório por módulo do menu lateral; índice em `e2e/regraDeNegocio/README.md`.
- **Comando:** `/mapear-regras-negocio <Módulo>` (`.claude/skills/mapear-regras-negocio/`) — passo a passo da técnica + `scripts/explorar.js <rota> admin|restrito` (saída em `.regras-tmp/`, ignorada no git).
- Regras extraídas de navegação + props Inertia (`<script data-page="app">`) + bundle `build/assets/<Componente>-*.js`.
- **Dashboard** (15 regras): defeitos DASH-01 (Alta — cards/atalhos visíveis sem permissão, 7/8 destinos dão 403 p/ Professor), DASH-02 (Média — `counts` globais expostos a qualquer cargo), DASH-03 (Baixa — ziggy com 321 rotas/IPs internos no payload).
- **Escolas** (`/franquias`, 22 regras): ESC-01 (**Alta** — impossível salvar CNPJ: máscara 18 chars × `maxlength=14`/backend 14), ESC-02 (Média — INEP sem validação de 8 dígitos), ESC-03..10 (Baixa — telefone/código sede sem validação, mensagens com nome técnico, CEP inexistente sem feedback, modal diz "cargo", "Carregar mais" sem próxima página, "cadastrados", Escolas×Franquia, nome sem "*"). CRUD usa escola `QA-Escola RN <ts>` com limpeza em `afterAll`; a escola real (id 1) nunca é alterada.
- Achado de outro módulo: `messages.usuarios.updated` = "Usuário atualasdasdizado com sucesso!" (verificar ao mapear Usuários).
- **Circuito de Notas** (`/circuito-notas`, 21 regras): CIR-01 (**Alta** — 2 circuitos para a mesma etapa+ano são aceitos), CIR-02 (Média — PUT troca etapa_ensino_id apesar do campo travado), CIR-03 (Média — backend aceita tipo de instrumento inválido, pontuação > escala, referência inexistente, ordem duplicada), CIR-04..09 (Baixa — mensagens técnicas, busca ignora nome, "Carregar mais", modal "cargo", a11y, edição sem toast de sucesso). Ciclo usa circuitos `QA-` na etapa 1º Ano (id 6) e limpa circuitos e modelos exportados no `afterAll`. Chamadas Inertia diretas precisam de `Accept: text/html, application/xhtml+xml`.
- **Diários** (`/diarios`, 23 regras): DIA-01 (Média — backend aceita faltas > quantidade de aulas do lançamento), DIA-02 (Média — botão "Entregar {etapa}" sem ação), DIA-03 (Média — colunas Entregue/Aulas ministradas fixas em "—"), DIA-04 (Média — quantidade de aulas sem máximo, 99 aceito), DIA-05..11 (Baixa — rodapé "Circuito: — —", mensagem errada sem circuito, nomes técnicos nas mensagens, "Diário: 60" na aba Agendas, aluno sem nº de chamada no topo, "7.50" × "7,50", a11y). Diário de leitura: id 60 (Ed. Física/6º Ano, etapa 3º Bimestre = circuito_etapa 258, lançamento 5). Nada é gravado: validação com obrigatório ausente (`conteudo`/`matricula_id`) e gravação de faltas/notas interceptada com `page.route`. Turma 2SER-M-2026 está na etapa de ensino 27 (magistério), sem circuito → 7 diários sem etapas. `GET` nas APIs de uma etapa materializa a instância (posse) do diário.
- **Turmas** (`/turmas`, 16 regras): TUR-01 (**Alta** — Professor com lista vazia abre `/turmas/{id}/show` (200) e recebe CPF completo dos alunos), TUR-02 (Média — CPF mascarado na tela mas completo nas props), TUR-03 (Média — só código e descrição obrigatórios; turma sem etapa de ensino fica sem circuito), TUR-04 (Média — término antes do início, tipo/mediação/dias fora da lista aceitos), TUR-05 (Média — lista envia CPF/e-mail dos professores e cadastro inteiro da escola), TUR-06 (Média — "Carregar mais" perde o termo da busca), TUR-07..17 (Baixa — "Carregar mais" com 7/7, "Carga Horária: —" fixo, "turmas cadastrados", turno divergente do Diário, busca ignora etapa de ensino, botão "Imprimir diário" abre a lista, modal "cargo", mensagens técnicas, dias fora de ordem, título vazio na impressão, sem toast em excluir/restaurar/fechar). Ciclo usa turmas `QA-TUR-<ts>` na etapa 1º Ano (id 6); excluir na lixeira é exclusão definitiva (limpeza no `afterAll`).

## Protocolo #7614 (boletim de notas da turma)

- **Origem:** `docs/protocolo 7614 [SAAS]-IMPLEMENTAR BOLETIM DE NOTAS DA TURMA NO DIÁRIO/`. O `README.md` tem o pedido (6 regras) e as 3 pendências de 28/10/2026; o `boletim_anual.md` é o modelo base do layout; as imagens ficam em `_evidencias/`.
- **Pacotes BDD** (em `Pendencias-Protocolos/protocolo-7614/`):
  - `PASSOU/`, `FALHOU/`: cenários 01–31, **23 PASSOU e 7 FALHOU**;
  - `ct-boletim/`: CT-BOLETIM-001 a 034, **26 PASSOU, 7 FALHOU e 1 NÃO EXECUTADO** (o 025, sem ano letivo 2025).
- **Automação** (`e2e/protocolo7614/`):
  - `boletim.ts`: helpers. Inclui `gerarBoletimPelaTela` com `item: 'Boletim de notas' | 'Boletim individual'` e `celulasDoAluno`, que lê a posição de cada valor no PDF com `pdftotext -bbox` e separa o nome do aluno por posição, porque o nome pode terminar em número;
  - `boletimTurma.spec.ts`: cenários 01–31;
  - `boletimNotasTurma.spec.ts`: CT-BOLETIM com a massa real (inclui o CT-BOLETIM-035, uma disciplina por página);
  - `boletimMassaQA.spec.ts`: 016, 019, 029, 032, 034 e o 21 do pacote anterior, com a massa QA;
  - `permissoesTi.spec.ts`: CT-BOLETIM-019 (T.I restrito a uma escola e T.I sem permissões de Diário).
  - Comando: `npx playwright test e2e/protocolo7614 --workers=1`. A geração do PDF entra numa fila assíncrona (~10 s; às vezes minutos).
- **Regra de acesso (definida pelo QA):** T.I, Gestor, Super Administrador e Profissional imprimem pela listagem de Diários (Imprimir do cartão) e dentro de cada diário; o Professor, só nos diários que são dele; o Aluno, só o boletim da própria matrícula.
- **Usuários de teste:**
  - por cargo: `qa.ti|diretor(Gestor)|prof(Profissional)|aluno .7614@caju.com.br` (senha `QA_7614_PASSWORD`). Não existem os cargos Diretor e Coordenador (os dois são Gestor);
  - da massa QA: `qa.professor.7614`, `qa.duas.7614` e `qa.tirestr.7614`, todos `@caju.com.br`. As credenciais estão no `.env` (`QA_7614_*`);
  - T.I sem Diário: `qa.ti.p.diario.7614@caju.com.br` / `Qa@7614final` (QA-TI-P-DIARIO, criado em 28/10/2026). Cargo `T.I sem Diário` = cargo T.I menos as permissões com `diario`; continua com `turmas.list`, mas não vê o menu Diários, não abre `/diarios` e não gera boletim.
- **Massa QA (criada em 01/10/2026; não foi apagada porque o `boletimMassaQA.spec.ts` depende dela):**
  - turmas QA-7614-A, B e V (ids 15, 16 e 17; a V é vazia), na etapa 22 "Ensino médio - 3ª Série" (circuito 9);
  - "QA Professor 7614" (profissional 46), titular de Biologia: diários 61, 62 e 63;
  - "QA Aluno Duas Turmas 7614" (aluno 883): matrículas 189 (A) e 190 (B);
  - "QA Aluno Remanejado 7614" (aluno 884): matrícula 191 em B, com situação Remanejado (6), e matrícula 192 em A;
  - "QA-Escola 7614" (franquia 5) e o usuário T.I 75, com Escolas Permitidas = só essa escola;
  - IDs e roteiro de criação: `.regras-tmp/massa7614.json` e `.regras-tmp/massa*.js` (fora do git).
- **Como criar registros pela tela:**
  - **Profissional:** aba "Professor" › "Adicionar turma" › Turma (localizador `exact: true`) › Função docente › Situação funcional › Componente + CH aula. Isso cria o diário, e o usuário é criado junto (login = e-mail, senha = CPF).
  - **Aluno:** "Verificar CPF" › Nome, Email, Sexo, Cor/Raça e Data de Nascimento. A data digitada se perde ao sair do campo; é preciso escolher pelo calendário. O usuário do aluno é criado automaticamente (senha = CPF).
  - **Remanejamento:** Matrículas › Ver › "Alterar Situação".
  - **Usuário:** o botão é "Enviar", e o campo "Escolas Permitidas" restringe a escola. Todo usuário novo troca a senha no 1º acesso.
- **Cuidado com aulas pela API:** `POST /diarios/{id}/aulas` sem a lista de presença grava **1 falta para todos os alunos** (visto na Auditoria). Zere com `POST /diarios/{id}/faltas` e `quantidade: 0`.
- **Correções de 28/10/2026 (e-public-saas):**
  - lista de escolas permitidas vazia (`[]`) agora significa **sem escola** — o T.I perde o acesso ao diário/boletim; `null` (legado) continua caindo na escola ativa;
  - a listagem e o `vinculo-diario` usam a escola ativa efetiva, e o `update-franquia` não amplia a lista permitida;
  - `permissoesTi.spec.ts` deixou de usar `test.fail`: CT-BOLETIM-019 passa nos dois cenários;
  - o PDF do boletim quebra a página entre disciplinas (`\clearpage`), inclusive quando a anterior ocupa várias páginas.
- **Layout do PDF visto em 29/10/2026** (`boletimMassaQA.spec.ts` ajustado: 11/11):
  - cabeçalho da escola com 2 linhas: `Avenida Senador Furtado, 632 - Nova Parnaíba` e `Fone: (86) 3323-8604`. Saíram a linha `Parnaíba/PI — CEP` e o e-mail;
  - o Boletim individual tem o título "BOLETIM INDIVIDUAL" e a linha "Escola … Nº";
  - na turma de origem, o aluno remanejado aparece como `<nome> (Remanejado)`, no PDF e na frequência anual;
  - o nome acessível do checkbox de aluno no diálogo é `<nome> Matrícula nº N · Chamada N · <situação>`.
- **Defeitos abertos:**
  - **Alta:**
    - o Aluno não tem permissão de boletim;
    - o Profissional não tem `diarios.list` e não imprime pela listagem.
  - **Média:**
    - o Nº é a posição na lista, não o nº de chamada;
    - com a sessão expirada, o sistema não leva ao login.
  - **Baixa:**
    - o clique duplo em "Gerar" fecha o indicador;
    - a mensagem é "Acesso Negado" em vez de "Acesso não permitido";
    - turma sem alunos não gera PDF;
    - a continuação da tabela não repete o nome da disciplina;
    - o arquivo se chama `…-2026-2026.pdf`;
    - os chips de disciplina não informam o estado de forma acessível.
- `browser.newContext()` dentro do teste herda o `storageState` do projeto: passe `storageState: { cookies: [], origins: [] }` para entrar com outro perfil.
- **MCP Playwright (Node):** `@playwright/mcp` instalado globalmente no Node 22 e configurado em `~/.config/opencode/opencode.jsonc` (`--browser chrome --isolated --viewport-size 1440x900`). Reinicie o opencode para carregar as ferramentas `mcp__playwright__*`. Se aparecer "Browser is already in use", outra sessão está usando o navegador. Nesse caso, explore com scripts Playwright (`headless: false`) em `.regras-tmp/`.

## Protocolo #7633 (limite de 50 caracteres em e-mail/login)

- **Pedido:** login ("Login de acesso") e e-mail do profissional com no máximo 50 caracteres e o mesmo limite nos dois. **Complemento** (combinado com o dev): contador `N / 50` + limite de 50 em Nome, E-mail, Filiação 1 e Filiação 2 do Professor/Gestor. O dev também alinhou Usuários (`usuario.email`) e Aluno (`aluno.email`) a 50.
- **Automação:** `e2e/protocolo7633/limiteCaracteres.spec.ts` (CT-01 a CT-17) + `limites.ts`. Comando: `npx playwright test e2e/protocolo7633 --workers=1` (~35 s).
- **Como valida:**
  - tela: `maxlength="50"` e `pressSequentially` de 55 caracteres, que deve parar em 50;
  - servidor: remove o `maxlength` do DOM (`removerLimiteDaTela`) e envia 51 caracteres. Mensagens: "O login de acesso não pode ter mais de 50 caracteres." e "O e-mail / O nome / A filiação 1 / A filiação 2 não pode ter mais de 50 caracteres.";
  - contador do Vuetify: `.v-counter` dentro do `.v-input` do campo, texto `N / 50`, sempre visível (`persistent-counter`).
- **Ponta a ponta (CT-09/10):** cadastra o Professor(a) "QA-7633 Professor Limite <n>" com e-mail de 50 caracteres e CPF aleatório válido, e entra com login = e-mail e senha = CPF só com dígitos.
- **Limpeza:** o `afterAll` exclui os profissionais "QA-7633 …", que vão para a lixeira. O usuário de login `qa7633<timestamp>…@qa.com` continua existindo, porque excluir o profissional não exclui o usuário.
- **Seletores:**
  - o botão do formulário de profissional é "Salvar" no cadastro e "Atualizar" na edição;
  - a edição fica em `/profissionais/{id}`, e o id sai do botão `profissionais.btn_acoes-{id}`;
  - na exclusão, o modal pede o id como código de confirmação;
  - em `/alunos/criar`, o formulário só aparece depois de "Verificar CPF".
- **Ambiente:** em 08/10/2026, `veramendes.local` era um proxy para `127.0.0.1:8000`, o `artisan serve` do `e-public-saas` local (branch `feat/#7633`). Se aparecer 503, é porque o servidor não está rodando.
- **Defeitos encontrados e corrigidos em 08/10/2026, na branch `feat/#7633`, ainda sem commit; cobertos pelos CT-18 a CT-20:**
  - PEN-7633-01: o profissional excluído continuava entrando no sistema. Agora o login dele vai para a lixeira junto com ele e volta quando ele é restaurado;
  - PEN-7633-02: o login que é só o CPF era recusado ("deve ser um endereço de e-mail válido"). Agora o login de acesso não exige formato de e-mail;
  - PEN-7633-03: o modal de exclusão dizia "apagar este cargo". O modal ganhou a prop `item`, com padrão "este registro".
- **Pacote de documentação:** `Pendencias-Protocolos/protocolo-7633/` (`protocolo-7633.md`, `analise.md`, `pendencia.md` e `_evidencias/`).

## Protocolo #7621 (agenda: detalhes/publicação e colunas do PDF)

- **Skill:** `.claude/skills/playwright-testing/SKILL.md` (estrutura, evidências e comandos).
- **Automação:** `e2e/protocolo7621/agendaDetalhes.spec.ts` (T.I. abre os detalhes da agenda e publica), `e2e/protocolo7621/relatorioColunas.spec.ts` (colunas do PDF) e `e2e/protocolo7621/responsividade.spec.ts` (UIUX-7621-01 a 07).
- **Comando:** `npx playwright test e2e/protocolo7621 --workers=1` (12 testes, incluindo os 2 setups).
- **Perfil:** T.I. (`PERFIS.ti` / projeto `ti`, storageState `e2e/.auth/ti.json`).
- **Massa:** diário 61 (Biologia · QA-7614-A), da QA-Escola 7614.
- **Evidências:** `playwright-report/7621/{ERROR|PASSOU|PENDENCIA}/`; o PDF é anexado em `PASSOU/` quando o cenário passa.
- **Correções no `e-public-saas`:**
  - `turmas.diario.agendas.show` incluída em `SincronizaCatalogoAcl::DIARIO_PERMISSIONS` (o T.I. tomava 403 nos detalhes, embora a edição abrisse);
  - colunas `Disciplina` e `Turma` separadas no template `latex.relatorio-insercao-aulas` (antes eram `Disciplina/Turma`);
  - layout/tabela sem overflow de página (768/390/320), drawer mobile fechado com scrim e botão de fechar, alvos de toque ≥ 44×44, date picker em 320 e períodos agrupados no desktop.
- **UI/UX:** 7 achados da auditoria corrigidos em 28/10/2026; `responsividade.spec.ts` passou 8/8 (inclui limpar por teclado).
- **Integração:** a skill `pendencias-protocolos` do `e-public-saas` lê `../QA/playwright-report/{numero}/` para a triagem.
