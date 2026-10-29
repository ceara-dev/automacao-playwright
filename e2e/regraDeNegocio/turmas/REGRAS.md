# Regras de Negócio — Turmas

- **Menu:** Acadêmico › Turmas (`[id="navbar.btn_turmas"]`, permissão `turmas.list`)
- **O que é:** o cadastro das turmas do ano letivo. Cada turma tem código, descrição, tipo, mediação, **etapa de ensino** (que liga a turma ao **circuito de notas**), horários, dias e capacidade. A tela mostra também o resumo dos diários: professores, etapas do circuito e aulas.
- **Rotas e componentes:**

  | Rota | Nome | Componente |
  |------|------|------------|
  | `GET /turmas` (`?search=`, `?trashed=1`) | `turmas.list` | `Academico/Turmas/ListTurmas` |
  | `GET/POST /turmas/criar` | `turmas.create` / `store` | `Academico/Turmas/NewEditTurmas` |
  | `GET/PUT /turmas/{id}` | `turmas.edit` / `update` | `NewEditTurmas` |
  | `GET /turmas/{id}/show` | `turmas.show` | `Academico/Turmas/ShowTurmas` |
  | `GET /turmas/{id}/imprimir` | `turmas.print` | página de impressão (Inertia) |
  | `POST /turmas/{id}/toggle-situacao` | `turmas.toggle-situacao` | — |
  | `DELETE /turmas/{id}` · `POST /turmas/{id}/restore` | `turmas.delete` / `restore` | — |
  | `POST /matriculas/reorder` · `/matriculas/reorder-alfabetica` | `matriculas.reorder*` | (tela Ver) |
- **Permissões:** `turmas.{list,create,store,edit,update,delete,restore,show,toggle-situacao,print}`, `turmas.diario` (botão Diário) e `matriculas.reorder*`.
  - O **Professor** tem só `turmas.list` e `turmas.show`.
  - A lista do Professor é filtrada pelo vínculo e vem vazia na homologação.
- **Automação:** [`turmas.rn.spec.ts`](./turmas.rn.spec.ts)
- **Levantamento:** 01/10/2026, homologação, versão 0.1.0. Perfis usados: Super Administrador e Professor restrito.

**Técnica:** comando `/mapear-regras-negocio`. Li os componentes compilados `ListTurmas`, `NewEditTurmas` (com `TimePickerField`), `ShowTurmas` e `ModalConfirmation`.

A validação do backend foi testada por chamadas Inertia diretas, sempre **sem `descricao`**, para que nada fosse criado.

Criação, edição, fechar/abrir, exclusão (lixeira), restauração e exclusão definitiva usam turmas **`QA-TUR-<ts>`** na etapa "1º Ano" (id 6), que não tem circuito nem turmas. Um `afterAll` remove essas turmas de vez: excluir na lixeira é exclusão definitiva.

As turmas reais só são lidas. Situação fechada, capacidade, lixeira e turno são simulados reescrevendo as props.

## Dados da homologação

- **7 turmas** de 2026, todas da escola "Colégio Apoio", turno da manhã e capacidade de 45: 6º Ano (20 alunos), 7º Ano (28), 8º Ano (16), 9º Ano (31), 1ª Série (31), 2ª Série (38) e 3ª Série.
- Todas têm 7 etapas de circuito, menos a **2ª Série**: ela está ligada à etapa de ensino 27 "Ensino médio - **normal/magistério** - 2ª Série", que não tem circuito, e aparece como "Sem vínculo de circuito de notas".
- Lixeira vazia.

## Props

| Página | Prop | Conteúdo |
|--------|------|----------|
| Lista | `turmas` | paginação de 15. Cada turma traz `etapa_ensino`, `matriculas_count`, `circuito_etapas_count`, `circuito_etapas_detalhes[]` (nome, período, aulas lançadas), `aulas_count`, `profissionais[]` (**cadastro completo, com CPF e e-mail**) e `franquia` (**cadastro completo da escola**) |
| Lista | `search`, `trashed`, `temLixeira` | filtro atual e se há itens na lixeira |
| Formulário | `turma`, `editando`, `etapas_ensino` (43) | — |
| Ver | `turma`, `matriculas[]` | matrícula com `aluno` (**CPF completo**), ordem, situação, transporte e AEE |

## Catálogo

### Acesso e listagem

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-01 | Acesso exige `turmas.list`. Breadcrumb: Dashboard › Turmas › Listar (ou **Lixeira**). Botões **Nova Turma** (exige `turmas.create`; some na lixeira) e **Lixeira** / **Lista**. A lista do Professor é **restrita ao vínculo** (vazia na homologação). Lista vazia: "Não existem {título em minúsculas} cadastrados"; lixeira vazia: "Nenhuma turma na lixeira". | `ListTurmas` + backend | ✅ / ❌ TUR-09 (texto) |
| RN-TUR-02 | O cartão mostra a etapa de ensino (ou "N/A", em cinza), "código — descrição" e as informações abaixo. | `ListTurmas` | ✅ (props simuladas) / ❌ TUR-10 |
| RN-TUR-03 | *(esperado)* "Carga Horária" mostra a carga da turma. | `ListTurmas` | ❌ TUR-08 |
| RN-TUR-04 | Busca com debounce de 300 ms, que vai na URL (`?search=`). Procura por **código, descrição e ano letivo**. *(esperado)* Também pela **etapa de ensino**, que é o título do cartão. | backend | ✅ / ❌ TUR-11 |
| RN-TUR-05 | O contador é "Exibindo de 1 até N de total". *(esperado)* "Carregar mais" aparece só quando há próxima página e **mantém o termo pesquisado**. | `ListTurmas` | ❌ TUR-07, TUR-06 |
| RN-TUR-06 | Ações do cartão, cada uma com a sua permissão. Ver a tabela abaixo. | `ListTurmas` + `ModalConfirmation` | ✅ / ❌ TUR-12, TUR-13 |
| RN-TUR-07 | **Lixeira** (`?trashed=1`): o cartão aparece esmaecido, com "**Expira em** Xd Yh", contados **90 dias** após a exclusão. Ver a tabela de expiração abaixo. Os botões são **Restaurar** e **Excluir permanentemente** (exclusão definitiva). | `ListTurmas` | ✅ (`page.clock` + props simuladas) |

**Detalhe da RN-TUR-02 (informações do cartão)**

| Informação | Regra |
|------------|-------|
| Professores | Os vínculos com `funcao_docente` aparecem como "Nome Docente"; sem nenhum, "—" |
| Turno | hora de início **< 12** = Manhã; **< 18** = Tarde; senão Noite; sem horário, "—" |
| Alunos | "matriculados / capacidade". A barra de ocupação marca o **excedente** quando passa da capacidade. |
| Etapas e Aulas | Quantidade de cada um |
| Situações da Etapa | Cada etapa do circuito como **Ativa**, **Encerrada** ou **Inicia em Nd**, com "(N aulas)" |
| Turma sem circuito | "Sem vínculo de circuito de notas" |

**Detalhe da RN-TUR-06 (ações do cartão)**

| Ação | Comportamento |
|------|---------------|
| **Diário** (`turmas.diario`) | Abre `/diarios?turma_id={id}` |
| **Imprimir** (`turmas.print`) | Abre `/turmas/{id}/imprimir` em nova aba |
| **Ver** | Abre `/turmas/{id}/show` |
| **Editar** | Abre `/turmas/{id}` |
| **Excluir** | Abre um modal que pede para digitar o **id** da turma; o botão Excluir só habilita com o id correto |

**Detalhe da RN-TUR-07 (expiração na lixeira)**

| Tempo restante | Exibe |
|----------------|-------|
| ≥ 1 dia | "Nd Hh" |
| < 1 dia | "Hh" |
| < 1 hora | "Nmin" |
| ≤ 0 | "Expirado" |
| Sem data de exclusão | "-" |

### Formulário e validação

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-08 | O formulário tem as abas **Básicas** e **Horários**. Os campos, as listas e as mensagens estão na tabela abaixo. | `NewEditTurmas` | ✅ |
| RN-TUR-09 | Validação do backend: **só código e descrição são obrigatórios**. Ver a tabela abaixo. | backend | ✅ |
| RN-TUR-10 | *(esperado)* Etapa de ensino, tipo de turma e mediação são obrigatórios; o término vem depois do início; tipo, mediação e dias ficam dentro das listas; as mensagens usam nomes de campo em português. | backend | ❌ TUR-03, TUR-04, TUR-14 |

**Detalhe da RN-TUR-08 (campos do formulário)**

| Campo ou elemento | Regra |
|-------------------|-------|
| Código da Turma | máx. 20 caracteres |
| Descrição | máx. 120 caracteres |
| Capacidade Máx. | número |
| Ano Letivo | **somente leitura**, igual ao ano selecionado no menu lateral |
| Tipo de Turma | Curricular (etapa de ensino), Atividade complementar, Atendimento Educacional Especializado (AEE), Escolarização |
| Tipo de Mediação | Presencial, Semipresencial, Educação a Distância (EaD) |
| Etapa de Ensino | 43 opções |
| Turma ativa | marcado por padrão |
| Horários | início e término (seletor 24 h), dias da semana de Segunda a Domingo |
| Erros | o formulário vai para a aba do campo com erro |
| Botão de envio | **Salvar** na criação, **Atualizar** na edição |
| Toasts | "Turma criada com sucesso!" / "Turma atualizada com sucesso!" |

**Detalhe da RN-TUR-09 (validação do backend)**

| Campo | Regra | Mensagem |
|-------|-------|----------|
| codigo | obrigatório; ≤ 20; único (também na edição) | "O código da turma é obrigatório." / "O código não pode ter mais de 20 caracteres." / "Este código de turma já está cadastrado." |
| descricao | obrigatório; ≤ 120 | "A descrição é obrigatória." / "A descrição não pode ter mais de 120 caracteres." |
| capacidade_maxima | inteiro ≥ 1 | "A capacidade máxima deve ser pelo menos 1." |
| etapa_ensino_id | existente | "A etapa de ensino selecionada é inválida." |
| ano_letivo | ≥ 2020 | "O ano letivo deve ser a partir de 2020." |
| horario_inicio / fim | formato H:i | "O campo horario inicio não corresponde ao formato H:i." |
| dias_semana | lista | "O campo dias semana deve ser uma matriz." |
| Turma inexistente | — | 404 |

### Visualizar

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-11 | A tela Ver mostra as informações da turma, a ocupação e os alunos. Ver a tabela abaixo. | `ShowTurmas` | ✅ / ❌ TUR-15 |
| RN-TUR-12 | **Situação** Aberta ou Fechada, com o botão **Fechar Turma** / **Abrir Turma**, sem confirmação. Com a turma aberta, as posições dos alunos podem ser alteradas: arrastando ("As posições dos alunos podem ser alteradas arrastando o ícone…") ou pelo botão **A-Z**, que reordena em ordem alfabética **sem confirmação** e recarrega a página. Fechada: "Altere para Aberta para mudar as posições dos alunos.", sem A-Z e sem arrastar. | `ShowTurmas` | ✅ (fechada simulada; A-Z não clicado) |

**Detalhe da RN-TUR-11 (tela Ver)**

| Elemento | Regra |
|----------|-------|
| Breadcrumb | Dashboard › Turmas › {descrição} |
| Informações | código, etapa, ano, tipo (Curricular / Atividade complementar / AEE / Escolarização), mediação (Presencial / Semipresencial / EaD), status Ativa/Inativa, horários HH:MM e dias (Dom…Sáb) |
| Ocupação | "N / capacidade"; sem capacidade, "Capacidade não definida." |
| Alunos | Lista numerada, com a situação da matrícula: Cursando, Transferido, Abandono, Concluído, Falecido, Remanejado, Não Compareceu |
| Selos | "Transporte escolar" e "AEE" |
| Detalhe do aluno | CPF **mascarado** ("000.\*\*\*.\*\*\*-00"), ordem, transporte e atividades AEE |
| Turma sem alunos | "Nenhum aluno matriculado nesta turma." |

### Acesso do Professor e exposição de dados

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-13 | O Professor recebe **403** em criar, editar, imprimir, fechar/abrir, excluir e reordenar. *(esperado)* Também em **Ver** uma turma fora do seu vínculo. | backend | ✅ / ❌ TUR-01 |
| RN-TUR-14 | *(esperado)* As props enviam só o necessário: CPF mascarado na tela Ver; sem CPF e e-mail dos professores e sem o cadastro inteiro da escola na lista. | backend | ❌ TUR-02, TUR-05 |

### Impressão

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-15 | A ficha de impressão traz: escola, "Emitido em dd/mm/aaaa", "código — descrição", "etapa · Ano letivo", turno, situação, "N vagas", alunos matriculados, professores com função, a tabela "Alunos (N)" (# / Nome / **CPF completo**, ou código `REF…` quando não há CPF) e o botão Imprimir. | página de impressão | ✅ / ❌ TUR-16 (título) |

### Ciclo completo (turma QA-)

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-TUR-16 | O ciclo completo funciona como descrito abaixo. *(esperado)* As ações de excluir, restaurar e fechar mostram uma mensagem de sucesso. | `NewEditTurmas`, `ShowTurmas`, `ListTurmas` + backend | ✅ / ❌ TUR-17 |

**Detalhe da RN-TUR-16 (ciclo completo)**

1. Criar pelo formulário mostra o toast "Turma criada com sucesso!" e volta para a lista. O cartão novo mostra "0 / capacidade" e "Sem vínculo de circuito de notas".
2. Editar mostra o toast "Turma atualizada com sucesso!".
3. Fechar e reabrir são feitos na tela Ver.
4. Excluir manda a turma para a lixeira: ela sai da lista e aparece na lixeira com "Expira em 89d 23h".
5. Restaurar devolve a turma à lista.
6. Excluir na lixeira remove a turma de vez; depois disso, a tela Ver responde 404.

## Defeitos encontrados

| ID | Severidade | Descrição | Evidência |
|----|------------|-----------|-----------|
| TUR-01 | **Alta** | **O Professor abre turma fora do seu vínculo.** A lista dele vem vazia, mas `/turmas/1/show` responde **200** com todos os alunos e o **CPF completo** nas props. Basta trocar o id na URL. As ações de alterar dão 403 corretamente. | RN-TUR-13 (`test.fail`) |
| TUR-02 | **Média** | A tela Ver **mascara o CPF**, mas as props trazem `matriculas[].aluno.cpf` completo. Qualquer pessoa com acesso à página lê o CPF no código-fonte. | RN-TUR-14 (`test.fail`) |
| TUR-03 | **Média** | **Etapa de ensino, tipo de turma e mediação não são obrigatórios** (só código e descrição). Uma turma sem etapa de ensino fica sem circuito de notas: o diário não tem etapas e nada pode ser lançado. | RN-TUR-10 (`test.fail`) |
| TUR-04 | **Média** | O backend aceita **término antes do início** (13:00 → 07:00), `tipo_turma` 99, `tipo_mediacao` 9 e `dias_semana` [0, 8], fora das listas. | RN-TUR-10 (`test.fail`) |
| TUR-05 | **Média** | A listagem envia, para cada turma, `profissionais[]` com **CPF e e-mail** de cada professor e o **cadastro inteiro da escola** (dependências, equipamentos, internet). Nada disso é exibido no cartão. | RN-TUR-14 (`test.fail`) |
| TUR-06 | **Média** | "Carregar mais" pede a próxima página **sem o termo da busca** (só `page` e `trashed`). Com mais de 15 turmas, a busca mistura resultados não filtrados. | RN-TUR-05 (`test.fail`, props simuladas) |
| TUR-07 | Baixa | "Carregar mais Turmas" aparece com 7 de 7 (`next_page_url = null`). É o mesmo padrão de ESC-07 e CIR-06. | RN-TUR-05 (`test.fail`) |
| TUR-08 | Baixa | "Carga Horária: —" é **texto fixo** no componente, em todos os cartões. | RN-TUR-03 (`test.fail`) |
| TUR-09 | Baixa | O estado vazio monta o texto com o título: "Não existem turmas **cadastrados**" (concordância errada). | RN-TUR-01 (`test.fail`) |
| TUR-10 | Baixa | **A regra de turno diverge da tela do Diário.** Turmas usa hora < 12 Manhã e < 18 Tarde; o Diário usa ≤ 12:00 Manhã e ≥ 17:00 Noite. Uma turma às 12:00 é "Tarde" aqui e "Manhã" no diário; às 17:30, "Tarde" aqui e "Noite" no diário. | RN-TUR-02 (`test.fail`) |
| TUR-11 | Baixa | A busca ignora a **etapa de ensino**, que é o título do cartão: "Ensino médio" retorna 0. É o mesmo padrão do CIR-05. | RN-TUR-04 (`test.fail`) |
| TUR-12 | Baixa | O botão "Diário" se anuncia como "**Imprimir** diário de X", mas abre a lista de diários filtrada pela turma. | RN-TUR-06 (`test.fail`) |
| TUR-13 | Baixa | O modal de exclusão diz "Tem certeza que deseja apagar este **cargo**?" (componente compartilhado). É o mesmo padrão de ESC-06 e CIR-07. | RN-TUR-06 (`test.fail`) |
| TUR-14 | Baixa | Mensagens com nome técnico ou formato interno: "O campo **horario inicio** não corresponde ao formato **H:i**.", "O campo **dias semana** deve ser uma **matriz**.", "O campo **capacidade maxima**…". | RN-TUR-10 (`test.fail`) |
| TUR-15 | Baixa | Os dias da semana aparecem na ordem gravada ("Seg Qua Ter Qui Sex"), não na ordem da semana. | RN-TUR-11 (`test.fail`) |
| TUR-16 | Baixa | O título da aba de impressão é " - SAAS - Homologação", sem o nome da turma. | RN-TUR-15 (`test.fail`) |
| TUR-17 | Baixa | Excluir, restaurar e fechar/abrir **não confirmam** o sucesso: não há flash nem toast. Fechar e A-Z também não pedem confirmação. | RN-TUR-16 (`test.fail`) |

## Observações

- **Cadastro da 2ª Série:** a turma `2SER-M-2026` está na etapa de ensino 27 (normal/magistério), sem circuito. Ver também o módulo [Diários](../diarios/REGRAS.md). O TUR-03 permite esse tipo de inconsistência.
- Na tela Ver, Editar, Excluir, Fechar e A-Z **não verificam permissão no front**. Para o Professor (TUR-01), essas ações aparecem, mas o backend recusa.
- A ficha de impressão mostra o **CPF completo** e, para alunos sem CPF, um código `REF0000…` na coluna CPF.
- Os textos do `ModalConfirmation` estão em Unicode **NFD** no bundle: "código" é gravado como `o` + acento combinante. Na tela parecem iguais, mas buscas por texto e leitores de tela podem tratá-los de outro jeito. O teste normaliza o texto antes de comparar.
- O resumo de etapas do cartão usa só Ativa / Encerrada / "Inicia em Nd" (sem "Último dia"), diferente do diário (RN-DIA-11).

## Não verificado

- **Reordenar alunos**, arrastando ou com A-Z: as duas ações alteram a ordem de chamada real e não foram executadas.
- **Excluir uma turma com matrículas ou diários**: só turmas QA vazias foram excluídas. Não se sabe se o backend bloqueia.
- **Turma inativa** (`ativo = false`) e o efeito dela em matrículas e diários.
- **Expiração automática** da lixeira (90 dias): só o contador foi verificado.

## Execução

```bash
npx playwright test e2e/regraDeNegocio/turmas --workers=1
```

Resultado em 01/10/2026: **47 testes ok**, sendo 30 que passam e 17 `test.fail` que documentam os defeitos TUR-01 a TUR-17. A suíte leva cerca de 5 minutos.

As falhas das primeiras execuções eram do próprio teste e foram corrigidas:

- o texto do modal vem em NFD;
- na lixeira, o cartão não tem o botão "Ver";
- na edição, o botão é "Atualizar";
- as opções do select ficam vazias em `innerText` durante a animação;
- foi preciso esperar o `POST` de restauração terminar antes de navegar;
- dois `ERR_ABORTED` foram oscilação da homologação.

Depois de cada execução, o ambiente volta ao original: 7 turmas e lixeira vazia.
