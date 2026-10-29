# Regras de Negócio — Diários

- **Menu:** Acadêmico › Diários (`[id="navbar.btn_diarios"]`, permissão `diarios.list`)
- **O que é:** um diário existe para cada **turma + professor titular + componente curricular**. Ele nasce no cadastro do profissional, ao vincular um componente a uma turma. No diário são feitos, por **etapa do circuito de notas**:
  - o registro de aulas;
  - o registro de faltas;
  - o registro de notas;
  - o pedido de prorrogação do prazo;
  - as agendas e a impressão de documentos.
- **Rotas e componentes:**

  | Rota | Nome | Tipo / componente |
  |------|------|-------------------|
  | `GET /diarios` | `diarios.list` | `Academico/Diarios/ListDiarios` |
  | `GET /diarios/{id}` | `turmas.diario` | `Academico/Turmas/DiarioPlaceholder` → `DiarioTab` + `AgendaTab` |
  | `GET/POST /diarios/{id}/aulas` · `PUT/DELETE …/aulas/{lancamento}` | `turmas.diario.aulas[.store/.update/.delete]` | JSON → `DiarioAulasTab` |
  | `GET/POST /diarios/{id}/faltas` | `turmas.diario.faltas[.store]` | JSON → `DiarioFaltasTab` |
  | `GET/POST/DELETE /diarios/{id}/notas` | `turmas.diario.notas[.store/.delete]` | JSON → `DiarioNotasTab` |
  | `GET/POST /diarios/{id}/posse` | `turmas.diario.posse[.solicitar]` | JSON (prazo e prorrogação) |
  | `GET /diarios/{id}/alunos` | `turmas.diario.alunos` | JSON (seleção de alunos do boletim) |
  | `GET|POST /diarios/{id}/imprimir/{alunos,boletim,boletim-alunos,etapa}` | `turmas.diario.print.*` | geração assíncrona de PDF |
  | `/diarios/{id}/agendas[/criar, /{agenda}, /{agenda}/editar, …]` | `turmas.diario.agendas.*` | JSON + páginas de agenda |
- **Permissões:**
  - `diarios.list`;
  - `turmas.diario`;
  - `turmas.diario.{aulas,faltas,notas}[.store/.update/.delete]`;
  - `turmas.diario.posse[.solicitar]`;
  - `turmas.diario.print.{alunos,boletim,boletim-alunos,etapa}`;
  - `turmas.diario.alunos`;
  - `turmas.diario.agendas.*`.

  O cargo **Professor** tem todas, mas é `restrito_a_vinculo`: só acessa os diários em que é titular.
- **Automação:** [`diarios.rn.spec.ts`](./diarios.rn.spec.ts)
- **Levantamento:** 01/10/2026, homologação, versão 0.1.0. Perfis usados: Super Administrador e Professor restrito.

**Técnica:** comando `/mapear-regras-negocio`. Li o componente da lista, a página do diário e os subcomponentes compilados:
- `DiarioTab`, `DiarioAulasTab`, `DiarioFaltasTab`, `DiarioNotasTab`, `AgendaTab`;
- `SelecionarAlunosDialog`, que inclui a geração de documento.

As APIs JSON foram consultadas diretamente. A validação do backend foi testada **sempre com um obrigatório ausente** (`conteudo` ou `matricula_id`), para que nada fosse gravado.

Na tela, as gravações automáticas de faltas e notas são **interceptadas** (`page.route`). Os estados de prazo e de status das etapas são simulados reescrevendo as props ou a resposta JSON.

**Nenhum lançamento, falta, nota ou pedido real foi criado.**

## Dados da homologação

- **35 diários**, 7 turmas, ano 2026. Só 3 têm aulas: 60 (Educação Física / 6º Ano, 1 aula em 10/09, conteúdo "esportes"), 3 e 9 (3ª Série).
- O **Professor restrito não é titular de nenhum diário**: a lista dele fica vazia.
- Os **7 diários da 2ª Série** (turma `2SER-M-2026`) estão sem etapas. A turma está ligada à etapa de ensino **27 "Ensino médio - normal/magistério - 2ª Série"**, mas o circuito de notas da 2ª Série usa a etapa **21 "Ensino médio - 2ª Série"**. Ver Observações.

## Props da página do diário

| Prop | Conteúdo |
|------|----------|
| `turma` | código, descrição, horários, `etapa_ensino`, `matriculas_count` |
| `diario` | componente, profissional titular, `carga_horaria` / `carga_horaria_relogio`, `aulas_ministradas`, `etapas_impressao` |
| `circuito` | circuito ativo da etapa de ensino da turma, com `versao_ativa.etapas` (períodos do calendário); `null` se a turma não tem circuito |
| `podeDiario` | `pode_lancar_aulas`, `pode_lancar_faltas`, `pode_lancar_notas` |
| `instanciasDoDiario` | por etapa do circuito: `posse_inicio`, `posse_fim`, `prorrogada`, `entregue`, `aulas_ministradas` |

## Catálogo

### Listagem

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-01 | Acesso exige `diarios.list`. O título é "Diários" com o texto "Um diário por turma, professor e componente curricular.". Para um cargo `restrito_a_vinculo` (Professor), o título é "**Meus Diários**", o texto é "Os diários em que você é o professor titular." e a lista traz **só os diários em que ele é titular**. Lista vazia do Professor: "Você ainda não tem diários. A coordenação atribui os componentes curriculares no cadastro do profissional". Breadcrumb: Dashboard › Diários. | `ListDiarios` + backend | ✅ |
| RN-DIA-02 | 15 por página, ordenados por turma e componente. Cada cartão mostra: componente (ou "Sem componente"), sigla, "código — descrição" da turma, Titular, Carga horária ("Xh aula / Yh relógio", ou "—"), Ano letivo, Etapas (instâncias materializadas) e Aulas. Sem etapa materializada, mostra "Ainda sem etapa materializada". | `ListDiarios` | ✅ |
| RN-DIA-03 | Contador "Exibindo de 1 até N de total". "Carregar mais Diários" acrescenta a página seguinte e **some na última página** (ao contrário de ESC-07/CIR-06). | `ListDiarios` | ✅ |
| RN-DIA-04 | A busca tem debounce de 350 ms e vai na URL (`?search=`). Procura por turma (código e descrição), professor titular e componente (nome e sigla), **sem diferenciar acentos nem maiúsculas**. Não procura pela escola. Sem resultado: "Nenhum diário encontrado para “termo”". Filtro de turma pela URL: `?turma_id=`. | backend | ✅ |
| RN-DIA-05 | "Abrir" leva a `/diarios/{id}`. | `ListDiarios` | ✅ |

### Impressão

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-06 | O menu **Imprimir** aparece com qualquer permissão `turmas.diario.print.*`. Itens, cada um com a sua permissão: Relação de alunos, Boletim de notas, Boletim individual ("Uma página por aluno") e um "**Diário — {etapa}**" por etapa do circuito. Detalhes dos itens de etapa abaixo. | `ListDiarios` / `DiarioTab` | ✅ |
| RN-DIA-07 | Boletim de notas e boletim individual perguntam "Para quem você quer gerar?". **Cancelar** fecha sem gerar. Gerar dispara a **geração assíncrona** do PDF, que **não foi testada** porque criaria documentos. Detalhes do diálogo e da geração abaixo. | `SelecionarAlunosDialog` | ✅ diálogo (sem gerar) |

**Detalhe da RN-DIA-06 (itens de etapa no menu Imprimir)**

| Situação | Item exibido |
|----------|--------------|
| Etapa com nome | "Diário — {nome}" |
| Etapa sem nome | "Diário (etapa N)" |
| Etapa não materializada | Item com o subtítulo "Sem lançamentos — folha em branco" |
| Turma sem circuito | Item desabilitado "Sem etapas configuradas — A turma não tem circuito de notas ativo neste ano letivo" |

**Detalhe da RN-DIA-07 (diálogo "Para quem você quer gerar?")**

| Elemento | Comportamento |
|----------|---------------|
| Padrão | "Todos os alunos (N)", com o botão "Gerar para todos (N)" |
| "Escolher alunos" | Lista com nome, "Matrícula nº", "Chamada" e situação |
| Busca | Por nome (sem acento) ou pelo **prefixo** do nº da matrícula ("nº 10" também funciona) |
| Marcação | "Marcar todos" / "Marcar os encontrados" e "Limpar" |
| Botão, nenhum aluno marcado | "Selecione ao menos um aluno" (desabilitado) |
| Botão, 1 aluno marcado | "Gerar para {nome}" |
| Botão, mais de 1 aluno marcado | "Gerar para N alunos" |

**Detalhe da RN-DIA-07 (geração assíncrona do documento, não testada)**

| Aspecto | Comportamento |
|---------|---------------|
| Fluxo | `POST` na rota de impressão → acompanhamento de `status_url` a cada 1,5 s → download de `arquivo_url` |
| Etapas exibidas | "Aguardando na fila", "Montando o documento", "Preparando para abrir" |
| Limite de espera | 180 consultas, ou 15 min em segundo plano |
| Documento pronto | Toast "{título} está pronto. Baixar documento" |
| Erro 401 | "Sua sessão expirou. Entre novamente para gerar o documento." |
| Erro 403 | "Você não tem permissão para gerar este documento." |
| Erro 404 | "Não encontramos este documento. Ele pode ter sido removido." |
| Erro 419 | "Sua sessão expirou. Recarregue a página e tente de novo." |
| Erro 503 | "O serviço de impressão está indisponível no momento. Tente de novo em alguns minutos." |

### Acesso ao diário

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-08 | O vínculo é verificado no backend. O Professor que **não é titular** recebe **403** na página do diário e em **todas** as APIs, de leitura e escrita: aulas, faltas, notas, alunos, posse, agendas e impressão. Diário inexistente → 404. | backend | ✅ |

### Tela do diário

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-09 | Título "Diário — {componente}"; breadcrumb Diários › "{componente} · {código da turma}"; abas **Diários** e **Agendas** (`?aba=agendas` abre direto em Agendas); subtítulo "{código} — {turma} · {titular}". Os botões "Enviar mensagem" e "Exportar Excel" estão sempre **desabilitados** (ainda não implementados). | `DiarioPlaceholder` / `DiarioTab` | ✅ |
| RN-DIA-10 | Dados do diário: titular, turma (com a etapa de ensino), turno, componente e carga horária. O turno vem do horário de início: até 12:00 é **Manhã**, a partir de 17:00 é **Noite**, entre os dois é **Tarde**; sem horário, mostra "—". **Carga horária cumprida** = arredonda(aulas ministradas ÷ carga horária × 100) %, com o texto "N de CH aulas". | `DiarioTab` | ✅ |
| RN-DIA-11 | Tabela de etapas do circuito ativo: período no calendário, **status** e período da posse. O status usa a **posse do diário** quando a etapa está materializada e, senão, o calendário do circuito. Detalhes abaixo. | `DiarioTab` | ✅ (`page.clock` + props simuladas) |
| RN-DIA-12 | *(esperado)* As colunas **Entregue** e **Aulas ministradas** mostram os dados da instância da etapa. | `DiarioTab` | ❌ DIA-03 |
| RN-DIA-13 | O rodapé mostra "Circuito: {etapa de ensino} — v{major}.{minor}" da versão ativa. | `DiarioTab` | ✅ versão / ❌ DIA-05 (etapa) |
| RN-DIA-14 | Turma sem circuito ativo: o diário fica sem etapas, nada pode ser lançado e a tabela mostra "Nenhuma etapa cadastrada no circuito". *(esperado)* A tela deveria dizer que **não há circuito**. | `DiarioTab` | ✅ / ❌ DIA-06 |
| RN-DIA-15 | Sub-abas: Registro de aulas, Registro de faltas e Registro de notas/conceitos, cada uma exibida só com a permissão de leitura correspondente. Material de aula, Observações e Estatísticas mostram "Em desenvolvimento". Sem nenhuma das 3 permissões: "Você não tem permissão para visualizar os registros deste diário". Os registros só carregam depois de escolher a etapa ("Selecione uma etapa no filtro acima"). | `DiarioTab` | ✅ |

**Detalhe da RN-DIA-11 (status da etapa)**

| Situação (hoje à meia-noite) | Rótulo | Cor |
|------------------------------|--------|-----|
| Sem início e sem fim | "—" | — |
| hoje < início | "Inicia em N dia(s)" | info |
| hoje > fim | "Encerrado" | cinza |
| Posse prorrogada, dentro do prazo | "Prorrogado — Faltam N dia(s)" ou "Prorrogado — Último dia" | warning |
| Dentro do período | "Ativo — Faltam N dia(s)" ou "Ativo — Último dia" | success |

### Prazo e entrega da etapa

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-16 | Depois de escolher uma etapa, um chip mostra o **prazo**. Clicar no chip abre "Prazo da etapa". Detalhes do chip e do diálogo abaixo. | `DiarioTab` + backend | ✅ (estados simulados; pedido recusado sem justificativa) |
| RN-DIA-17 | *(esperado)* "Entregar {etapa}" registra a entrega da etapa (coluna Entregue). | `DiarioTab` | ❌ DIA-02 |

**Detalhe da RN-DIA-16 (chip e diálogo de prazo)**

| Situação, por prioridade | Texto do chip |
|--------------------------|---------------|
| 1. Pedido pendente | "Prorrogação pendente desde dd/mm/aaaa" |
| 2. Último pedido indeferido | "Pedido indeferido em dd/mm/aaaa" |
| 3. Prazo vencido | "Prazo encerrado em dd/mm/aaaa" |
| 4. Prazo vindo de prorrogação | "Prazo prorrogado até dd/mm/aaaa" |
| 5. Prazo do calendário | "Prazo até dd/mm/aaaa" |
| 6. Sem prazo | "Sem prazo definido" |

| Elemento do diálogo "Prazo da etapa" | Comportamento |
|--------------------------------------|---------------|
| Informações | Prazo vigente, origem ("Calendário do circuito" ou "Prorrogação deferida") e histórico de pedidos |
| "Novo prazo até" | Começa no **limite mínimo**, o dia seguinte ao prazo vigente. O limite máximo é 31/12. |
| "Justificativa" | Obrigatória: "Explique por que precisa de mais prazo." |
| "Enviar pedido" | Faz `POST /diarios/{id}/posse` |

### Registro de aulas

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-18 | Tabela Data / Quantidade de Aulas / Conteúdo da etapa. "Novo Lançamento" (e editar/excluir) só aparece com a permissão `…aulas.store/update/delete`, **e** `podeDiario.pode_lancar_aulas`, **e** `pode_editar` da API. Detalhes da janela de datas, do formulário e da validação abaixo. | `DiarioAulasTab` + backend | ✅ (sem gravar) |
| RN-DIA-19 | *(esperado)* A quantidade de aulas por lançamento tem limite máximo, e as mensagens usam nomes de campo em português. | backend | ❌ DIA-04, DIA-07 |

**Detalhe da RN-DIA-18 (lançamento de aula)**

| Aspecto | Regra |
|---------|-------|
| Janela de datas | Do **início da etapa** até **hoje**, limitada ao **fim da etapa** (`janela.data_aula_min/max`). Quando bloqueada, aparece um aviso com o motivo. |
| Formulário | Data da aula, Quantidade de aulas (mín. 1, valor inicial 1) e Conteúdo |
| Toasts | "Lançamento criado/atualizado/removido com sucesso!" |
| Exclusão | Pede confirmação: "Deseja realmente excluir este lançamento de aula?" |
| Validação: obrigatórios | quantidade, conteudo, data_aula e etapa ("Informe a etapa.") |
| Validação: quantidade | ≥ 1 |
| Validação: data futura | "A data da aula não pode ser futura." |
| Validação: data antes do início | "A data da aula deve ser a partir de dd/mm/aaaa." |
| Validação: data depois do fim | "A data da aula deve ser até dd/mm/aaaa." |

### Registro de faltas

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-20 | Grade com aluno × lançamento ("dd/mm" e "N aula(s)"), **Total Faltas** e **% Frequência** (arredondada; abaixo de **75 %** fica em vermelho). O campo aceita só dígitos e é **limitado entre 0 e a quantidade de aulas do lançamento**. Os botões −/+ e o Enter descem para a linha de baixo. O valor é **salvo sozinho**, 400 ms depois da última alteração, e a cor do campo indica o estado (salvando, salvo, erro). Backend: os 4 campos são obrigatórios e a quantidade é ≥ 0. | `DiarioFaltasTab` + backend | ✅ (gravação interceptada) |
| RN-DIA-21 | *(esperado)* O backend também limita as faltas à quantidade de aulas, e os alunos sem nº de chamada aparecem depois dos numerados. | backend | ❌ DIA-01, DIA-09 |

### Registro de notas

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-22 | Colunas por instrumento (nome e tipo), etapas de referência ("Nota da Etapa" de cada fonte) e a **Nota da Etapa**, calculada pelo backend. Detalhes da digitação, da gravação e das mensagens abaixo. | `DiarioNotasTab` + backend | ✅ (gravação interceptada) / ❌ DIA-10 |

**Detalhe da RN-DIA-22 (registro de notas)**

| Aspecto | Regra |
|---------|-------|
| Digitação (2 casas decimais) | Sem separador, os dígitos são lidos como centésimos quando passam do número de casas: "750" → 7,50; "8" → 8,00; "10" → 10,00. "7,5" → 7,50. |
| Botões −/+ | Passo de 0,01 (10^-casas), sem ficar abaixo de 0 |
| Cor da nota | Verde se ≥ média de aprovação, vermelha abaixo |
| Gravação | Ao sair do campo |
| Campo esvaziado | Exclui a nota (`DELETE`); exige `…notas.delete`, senão o valor anterior volta |
| Backend | nota entre a escala do circuito ("A nota deve estar entre 0.00 e 10.00."); instrumento existente |
| Sem instrumentos | "O circuito vinculado a esta etapa não possui instrumentos de avaliação nem etapas de referência." |
| Sem circuito | "Nenhum circuito de notas ativo vinculado à etapa de ensino desta turma." |

### Agendas

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-DIA-23 | Aba Agendas: botão "Criar agenda", resumo por status (Rascunho / Publicada / Arquivada), busca com debounce de 300 ms ("Buscar por título, code, data ou criado por"), filtro de Status e tabela Code / Título / Criado por / Data / Aulas ("Diário inteiro" quando não tem aula vinculada) / Arquivos / Status. Sem agendas: "Nenhuma agenda cadastrada para este diário". | `AgendaTab` | ✅ / ❌ DIA-08 |

## Defeitos encontrados

| ID | Severidade | Descrição | Evidência |
|----|------------|-----------|-----------|
| DIA-01 | **Média** | **O backend aceita mais faltas do que aulas no lançamento.** `POST /diarios/60/faltas` com `quantidade: 5` numa aula de quantidade 1 só acusou `matricula_id` ausente. A tela limita o valor, mas uma chamada direta ou um cliente desatualizado grava frequência inconsistente. | RN-DIA-21 (`test.fail`) |
| DIA-02 | **Média** | **O botão "Entregar {etapa}" não faz nada.** No componente, ele não tem `onClick`; ao clicar, não há requisição nem diálogo. A coluna "Entregue" nunca muda. | RN-DIA-17 (`test.fail`) |
| DIA-03 | **Média** | As colunas **Entregue** e **Aulas ministradas** da tabela de etapas estão fixas em "—", mas `instanciasDoDiario` traz `entregue` e `aulas_ministradas` (o 3º Bimestre do diário 60 tem 1 aula). | RN-DIA-12 (`test.fail`) |
| DIA-04 | **Média** | A **quantidade de aulas** por lançamento não tem máximo: front com `min=1` sem `max`, backend com "pelo menos 1". O valor 99 passou na validação. Um erro de digitação (11 em vez de 1) infla a "Carga horária cumprida". | RN-DIA-19 (`test.fail`) |
| DIA-05 | Baixa | O rodapé mostra "Circuito: **— —** v1.6": a prop `circuito` vem sem `etapa_ensino`, e o nome do circuito não aparece. | RN-DIA-13 (`test.fail`) |
| DIA-06 | Baixa | Em diário de turma **sem circuito**, a tela diz "Nenhuma etapa cadastrada no circuito", o que sugere um circuito sem etapas. A listagem diz corretamente "A turma não tem circuito de notas ativo neste ano letivo". | RN-DIA-14 (`test.fail`) |
| DIA-07 | Baixa | Mensagens com o nome técnico do campo: "O campo **conteudo** é obrigatório.", "O campo **data aula** é obrigatório.", "O campo **matricula id** é obrigatório.", "O campo **circuito instrumento id** selecionado é inválido.". É o mesmo padrão do CIR-04. | RN-DIA-19 (`test.fail`) |
| DIA-08 | Baixa | A aba Agendas mostra "**Diário: 60**", o id interno, em vez de identificar o diário pelo componente e pela turma. | RN-DIA-23 (`test.fail`) |
| DIA-09 | Baixa | Matrícula sem nº de chamada (`ordem = null`) aparece **no topo** das listas de faltas, notas e boletim, antes do nº 1. Exemplo: "Aluno Teste Playwright 01", matrícula 188. | RN-DIA-21 (`test.fail`) |
| DIA-10 | Baixa | O formato decimal é inconsistente: os campos de nota mostram "7,50" e a **Nota da Etapa** mostra "7.50". | RN-DIA-22 (`test.fail`) |
| DIA-11 | Baixa (acessibilidade) | Os campos de nota **não têm nome acessível**. Os botões −/+ de faltas e notas se chamam "ação antes" / "ação depois", o padrão do Vuetify. | Inspeção (aria). Sem teste. |

## Observações

- **Cadastro da 2ª Série:** a turma `2SER-M-2026` (id 6) está ligada à etapa de ensino 27 "Ensino médio - **normal/magistério** - 2ª Série". O circuito da 2ª Série (id 8) é da etapa 21 "Ensino médio - 2ª Série". Por isso, os 7 diários da turma não têm etapas e nada pode ser lançado neles. Corrigir a etapa de ensino da turma, ou criar um circuito para a etapa 27.
- **Materialização ao consultar:** a instância da etapa no diário (posse) é criada **na primeira consulta** às APIs da etapa. O diário 60 passou de 6 para 7 etapas depois de `GET /diarios/60/aulas|posse?circuito_etapa_id=259` (4º Bimestre), feitos durante este levantamento. Parece ser intencional ("Ainda sem etapa materializada"), mas é um `GET` com efeito colateral.
- **Prorrogação:** nas regras do formulário, `data_solicitada` antes do limite mínimo (15/10, com prazo vigente em 31/10) **não** foi apontada; o único erro foi a justificativa ausente. A checagem pode acontecer depois da validação, mas isso não foi confirmado, porque confirmar exigiria criar um pedido real.
- Os diários 19, 20, 24, 30 e 31 não têm carga horária, e a "Carga horária cumprida" fica em 0 %.
- "Criar agenda" não verifica `turmas.diario.agendas.create` no front.

## Não verificado

- **Gravação real** de aulas, faltas, notas e pedidos de prorrogação, e o **cálculo da Nota da Etapa** (bases, recuperação, composição). Não há diário de teste (`QA-`), e os diários só nascem no cadastro do profissional. Gravar em diários reais mudaria dados de alunos.
- **Bloqueio por prazo vencido** (`janela.bloqueada`, `bloqueio` em notas) e **deferimento** em Prorrogações (outro módulo do menu).
- **Geração de PDFs** (relação, boletins e diário da etapa) e o conteúdo deles.
- **Formulários de agenda** (criar, editar, histórico, arquivos, notificar): não há agendas na homologação.

## Execução

```bash
npx playwright test e2e/regraDeNegocio/diarios --workers=1
```

Resultado em 01/10/2026: **63 testes ok**, sendo 53 que passam e 10 `test.fail` que documentam os defeitos DIA-01 a DIA-10 (DIA-11 não tem teste). A suíte leva cerca de 6 minutos.

Na 1ª execução, 2 testes falharam por ajustes do próprio teste, e passaram depois da correção:

- o estado vazio da aba Agendas aparece duas vezes, no cartão de celular e na célula da tabela, por isso o teste usa `getByRole('cell')`;
- "Diário:" e "60" ficam em spans separados, por isso o teste usa regex com `\s*`.

A suíte não grava dados: nenhum lançamento, falta, nota ou pedido de prorrogação é criado.
