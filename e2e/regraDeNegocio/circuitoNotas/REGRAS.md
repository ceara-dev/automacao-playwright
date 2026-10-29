# Regras de Negócio — Circuito de Notas

- **Menu:** Administração › Circuito de Notas (`[id="navbar.btn_circuito_notas"]`)
- **O que é:** o circuito define, para uma **etapa de ensino** (série) e um **ano letivo**:
  - a escala de notas, a média de aprovação, o mínimo para recuperação e o arredondamento;
  - as **etapas avaliativas** (bimestres, semestres, etapa final), cada uma com base de cálculo, instrumentos, modo de recuperação e etapas de referência.

  É a configuração usada no lançamento de notas dos diários.
- **Rotas e componentes:**

  | Rota | Nome | Componente |
  |------|------|------------|
  | `GET /circuito-notas` | `circuito-notas.list` | `Pedagogico/CircuitoNotas/ListCircuitoNotas` |
  | `GET/POST /circuito-notas/criar` | `create` / `store` | `NewEditCircuitoNotas` |
  | `GET /circuito-notas/{id}` | `show` | `ShowCircuitoNotas` |
  | `GET/PUT /circuito-notas/{id}/editar` | `edit` / `update` | `NewEditCircuitoNotas` |
  | `GET /circuito-notas/{id}/historico` | `historico` | `HistoricoCircuitoNotas` |
  | `PUT /circuito-notas/{id}/toggle-ativo` | `toggle-ativo` | — |
  | `GET /circuito-notas/{id}/exportar` | `export` | — |
  | `GET /circuito-notas/importar/tela` · `POST /circuito-notas/importar` | `import` / `importar.store` | `ImportCircuitoNotas` |
  | `DELETE /circuito-notas/{id}` · `DELETE /circuito-notas/modelos-exportados/{id}` | `delete` / `modelos-exportados.delete` | — |
- **Permissões:** `circuito-notas.{list,create,store,show,edit,update,delete,historico,toggle-ativo,export,import,importar.store,modelos-exportados.delete}`
- **Automação:** [`circuitoNotas.rn.spec.ts`](./circuitoNotas.rn.spec.ts)
- **Levantamento:** 30/09/2026, homologação, versão 0.1.0. Perfis usados: Super Administrador e Professor restrito.

**Técnica:** comando `/mapear-regras-negocio`. Li os 5 componentes compilados (lista, formulário, visualizar, histórico, importar). A validação do servidor foi testada por chamadas Inertia diretas ao `store`, sempre **sem `etapa_ensino_id`**, para que nada fosse criado. Criação, versionamento, ativar/desativar, exportação e exclusão usam circuitos `QA-` na etapa "1º Ano", que não tem circuito nem turmas; a limpeza fica num `afterAll`, que roda mesmo após timeout. **Nenhum circuito real é alterado.**

## Dados da homologação

7 circuitos ativos, um por série (6º Ano ao 9º Ano, 1ª a 3ª Série), todos de 2026 e com escala 0–10, média 7, mín. recuperação 0 e 7 etapas. Há 3 modelos exportados (6º Ano e 7º Ano, este em duplicidade).

## Catálogo

### Acesso e listagem

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-CIR-01 | Acesso exige `circuito-notas.list`. O Professor não tem nenhuma permissão `circuito-notas.*`: o item some do menu e lista, criar, visualizar, histórico e importar respondem **403**. Título "Circuito de Notas"; breadcrumb Dashboard › Administração (sem link) › Circuito de Notas › Listar; botões **Novo Circuito** e **Importar**. | Layout + backend | ✅ |
| RN-CIR-02 | Listagem com 15 por página. Cada linha mostra: Nome, Ano Letivo, Etapa de Ensino (ou `---`), Escala "mín - máx", Etapas (quantidade da versão ativa, ou 0) e Versão `vMAJOR.MINOR` (ou `---`). A barra lateral fica verde quando o circuito está ativo e cinza quando inativo. | `ListCircuitoNotas` | ✅ (casos `---` com props simuladas) |
| RN-CIR-03 | "Carregar mais" acrescenta a página seguinte. *(esperado)* Só aparece quando há próxima página. | `ListCircuitoNotas` | ❌ CIR-06 |
| RN-CIR-04 | A busca tem debounce de 300 ms e vai na URL (`?search=`). Procura na **etapa de ensino** e no **ano letivo**. Sem resultado: "Não existem circuitos de notas cadastrados". *(esperado)* Procurar também pelo nome, que é a 1ª coluna da lista. | backend | ✅ / ❌ CIR-05 |
| RN-CIR-05 | Ações: Visualizar, Editar, Histórico, Exportar, Ativar/Desativar e Excluir. **Ativar/Desativar** confirma com "Deseja {desativar\|ativar} o circuito {etapa} / {ano}?". **Excluir** exige digitar o **id** do circuito. | `ListCircuitoNotas` + `ModalConfirmation` | ✅ / ❌ CIR-07 (texto) |

### Visualizar

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-CIR-06 | Cabeçalho com nome (h5), "{etapa} — {ano}", versão, Escala, Média Aprovação, Mín. Recuperação, Casas Decimais e nº de Etapas. "Modo Recuperação" mostra **Sim** se alguma etapa tem modo de recuperação, senão **Não**. Links Editar e Histórico. | `ShowCircuitoNotas` | ✅ |
| RN-CIR-07 | Cada etapa tem um status calculado pela data de hoje do navegador, à meia-noite. Detalhes abaixo. | `ShowCircuitoNotas` | ✅ (`page.clock`, fuso America/Sao_Paulo) |

**Detalhe da RN-CIR-07 (status da etapa)**

| Situação | Rótulo |
|----------|--------|
| Sem início e sem fim | (nenhum) |
| hoje < início | "Inicia em N dia(s)" (singular com 1) |
| hoje > fim | "Encerrado" |
| início ≤ hoje ≤ fim, N = dias até o fim > 0 | "Faltam N dia(s)" |
| hoje = fim | "Último dia" |

### Formulário

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-CIR-08 | Valores iniciais de um novo circuito: escala **0,00–10,00**, média **6,00**, mín. recuperação **4,00**, **2** casas decimais, ano = ano letivo atual e nenhuma etapa ("Clique em 'Adicionar Etapa' para começar."). | `NewEditCircuitoNotas` | ✅ |
| RN-CIR-09 | Nova etapa: nome "Nª Etapa", ordem N, base **Média Ponderada**. Novo instrumento: nome "N{k}", tipo **Prova**, peso 1, pontuação máxima = escala máxima, **obrigatório**. Tipos de instrumento: Prova, Trabalho, Atividade, Recuperação, Outro. | `NewEditCircuitoNotas` | ✅ |
| RN-CIR-10 | A base de cálculo define a regra da nota da etapa e mostra uma explicação com exemplo. Detalhes abaixo. A coluna **Peso** só aparece na Média Ponderada; o campo **Divisor** (≥ 1) só na Soma com Divisor. | `NewEditCircuitoNotas` | ✅ |
| RN-CIR-11 | **Modo de Recuperação** só aparece se a etapa tem instrumento do tipo "Recuperação". Detalhes abaixo. | `NewEditCircuitoNotas` | ✅ |
| RN-CIR-12 | **Etapas de referência** compõem a nota a partir de outras etapas (ex.: semestre = bimestres), cada uma com peso (≥ 0,1) e pontuação máxima (≥ 0,01). O botão só habilita com 2 ou mais etapas. Remover etapa, instrumento ou referência pede confirmação ("Tem certeza que deseja remover a etapa "X"? Esta ação não pode ser desfeita."); ao remover uma etapa, as ordens são renumeradas. | `NewEditCircuitoNotas` | ✅ |
| RN-CIR-13 | Validação do backend. Detalhes abaixo. | backend | ✅ / ❌ CIR-04 (mensagens) |
| RN-CIR-14 | *(esperado)* Instrumento com tipo da lista, pontuação máxima ≤ escala máxima, etapa de referência existente e ordens únicas. | backend | ❌ CIR-03 |

**Detalhe da RN-CIR-10 (base de cálculo)**

| Base | Regra (texto da tela) |
|------|-----------------------|
| Maior Nota | maior nota entre os instrumentos (7,0 / 8,5 / 6,0 → 8,5) |
| Média Aritmética | soma ÷ quantidade de instrumentos **com nota lançada** ((7+8+9) ÷ 3 = 8,0) |
| Média Ponderada | Σ(nota × peso) ÷ Σ pesos ((8×2 + 6×1) ÷ 3 = 7,33) |
| Soma com Divisor | soma ÷ divisor informado ((8+7+9) ÷ 4 = 6,0) |
| Soma Simples | soma **limitada à escala máxima** (7+8+6 → 10,0) |

**Detalhe da RN-CIR-11 (modo de recuperação)**

| Modo | Regra (texto da tela) |
|------|-----------------------|
| Substitui a menor nota | a maior recuperação substitui a menor nota normal e a base é reaplicada ([5 / 4] + R7 → [5 / 7] → 6,0) |
| Substitui a nota da etapa | a maior recuperação vira a nota da etapa **só se for maior** que a média original (5 → 7; 8 com R6 → mantém 8) |
| Adiciona ao conjunto de notas | a maior recuperação entra no conjunto e a base é reaplicada ([5 / 4] + R7 → [5 / 4 / 7] → 5,33) |

**Detalhe da RN-CIR-13 (validação do backend)**

| Campo | Regra | Mensagem |
|-------|-------|----------|
| ano_letivo, etapa_ensino_id, escala_min, escala_max, media_aprovacao, minimo_recuperacao, casas_decimais | obrigatórios (**nome e etapas são opcionais**) | "O campo … é obrigatório." |
| nome | ≤ 120 caracteres | "O campo nome não pode ser superior a 120 caracteres." |
| ano_letivo | ≥ 2000 | "O campo ano letivo deve ser pelo menos 2000." |
| escala | mín < máx | "A escala mínima deve ser menor que a escala máxima." |
| media_aprovacao | ≤ escala máx | "A média de aprovação deve ser menor ou igual à escala máxima." |
| minimo_recuperacao | ≥ escala mín **e** < média | "…maior ou igual à escala mínima." / "…menor que a média de aprovação." |
| casas_decimais | inteiro ≤ 4 | "O campo casas decimais não pode ser superior a 4." |
| etapas.\*.nome | obrigatório | "O campo etapas.0.nome é obrigatório." |
| etapas.\*.base_calculo / modo_recuperacao | valor da lista | "O etapas.0.base_calculo selecionado é inválido." |
| etapas.\*.divisor | ≥ 1; obrigatório quando base = soma_divisor | "…é obrigatório quando etapas.0.base_calculo for soma_divisor." |
| etapas.\*.periodo_calendario_fim | ≥ início | "…deve ser uma data posterior ou igual a…" |
| instrumentos.\*.nome / peso | obrigatório / > 0 | — |
| composicoes.\*.peso / pontuacao_maxima | > 0 | — |

Períodos sobrepostos são aceitos, e isso é intencional: um semestre cobre os bimestres.

### Versionamento, status, exportar/importar e exclusão

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-CIR-15 | Criar gera a **versão 1.0**, ativa, com motivo "Criação inicial do circuito". Toast "Circuito de Notas criado com sucesso!". O circuito nasce **ativo**. | backend | ✅ |
| RN-CIR-16 | Editar mostra o aviso "Ao editar um circuito ativo, uma nova versão será criada automaticamente. Notas já lançadas permanecem vinculadas à versão atual.". A **Etapa de Ensino fica travada**, e o **Motivo da Alteração é obrigatório** ("O motivo da alteração é obrigatório ao editar um circuito."). Botão "Salvar Alterações". *(esperado)* O backend também deve impedir a troca da etapa de ensino. | front + backend | ✅ / ❌ CIR-02 |
| RN-CIR-17 | Cada edição cria uma nova versão **minor** (1.0 → 1.1 → 1.2), que fica ativa; as anteriores ficam inativas. O Histórico lista Versão, Data, Alterado por, Motivo e Status, com o total de versões e a versão ativa. | backend + `HistoricoCircuitoNotas` | ✅ |
| RN-CIR-18 | *(esperado)* Um único circuito por **etapa de ensino + ano letivo**. | backend | ❌ CIR-01 |
| RN-CIR-19 | Ativar/Desativar alterna `ativo`. Toast "Status do circuito alterado com sucesso!". | backend | ✅ |
| RN-CIR-20 | Exportar cria um **modelo** "{etapa} - Padrão {ano}" (com `circuito_origem_id`), que aparece em Importar. Toast "Circuito exportado como modelo com sucesso!". O modelo **permanece** depois que o circuito de origem é excluído. Excluir o circuito gera o toast "Circuito de Notas removido com sucesso!" e o `GET` passa a 404. | backend | ✅ |
| RN-CIR-21 | Importar: o ano de destino começa no ano letivo atual. O botão **Importar** só habilita com ano **e** etapa de destino. A confirmação mostra Modelo, Origem, Destino e Configuração (escala, média, mín. recuperação, nº de etapas). Na tela, o circuito importado traz o motivo "Importado do modelo {nome}" (ex.: v1.0 do circuito 9). Um modelo pode ser removido ("Deseja remover o modelo X? Esta ação não poderá ser desfeita."). | `ImportCircuitoNotas` | ✅ (sem confirmar a importação) |

## Defeitos encontrados

| ID | Severidade | Descrição | Evidência |
|----|------------|-----------|-----------|
| CIR-01 | **Alta** | **Dois circuitos ativos para a mesma etapa de ensino e ano são aceitos.** Duas criações seguidas para "1º Ano / 2026" retornaram "Circuito de Notas criado com sucesso!", e a importação também não verifica. Fica ambíguo qual circuito vale no lançamento de notas. | RN-CIR-18 (`test.fail`) |
| CIR-02 | **Média** | A etapa de ensino fica travada na tela de edição, mas o `PUT` aceita outra `etapa_ensino_id`: o circuito trocou de "1º Ano" para "2º Ano", **sem toast** de sucesso. As notas já lançadas ficariam ligadas a outra série. | RN-CIR-16 (`test.fail`) |
| CIR-03 | **Média** | O backend aceita instrumento com tipo fora da lista ("Zzz"), pontuação máxima 50 numa escala 0–10, etapa de referência inexistente (ordem 9) e duas etapas com a mesma ordem. | RN-CIR-14 (`test.fail`) |
| CIR-04 | Baixa | As mensagens de validação usam o nome técnico do campo, e a tela as mostra em toast: "O campo **etapa ensino id** é obrigatório.", "O campo **etapas.0.nome** é obrigatório.", "O **etapas.0.base_calculo** selecionado é inválido.". | RN-CIR-13 (`test.fail`) |
| CIR-05 | Baixa | A busca ignora o **nome** do circuito, que é a 1ª coluna da lista: "Sistema de Notas" retorna 0. Ela só procura etapa de ensino e ano. | RN-CIR-04 (`test.fail`) |
| CIR-06 | Baixa | "Carregar mais Circuito de Notas" aparece com 7 de 7 (sem próxima página). É o mesmo padrão do ESC-07. | RN-CIR-03 (`test.fail`) |
| CIR-07 | Baixa | O modal de exclusão diz "apagar este **cargo**" (componente compartilhado). É o mesmo padrão do ESC-06. | RN-CIR-05 (`test.fail`) |
| CIR-09 | Baixa | Ao salvar a edição pela tela, **nenhum toast de sucesso** aparece. Além disso, o toast de erro da tentativa anterior ("O motivo da alteração é obrigatório…") **continua visível depois do salvamento bem-sucedido**, o que confunde o usuário. A chamada ao backend devolve o flash "Circuito de Notas atualizado com sucesso!", mas a tela não o exibe. | RN-CIR-16 (`test.fail`) |
| CIR-08 | Baixa (acessibilidade) | Botões sem nome acessível: expandir/recolher etapa (formulário e visualizar), remover instrumento, remover modelo (importar). Os campos da tabela de instrumentos (nome, tipo, peso, pontuação, obrigatório) também não têm rótulo. | Inspeção (aria). Sem teste. |

## Observações

- **Dados da homologação:** o 2º Semestre do circuito 9 começa em 01/07, sobrepondo o fim do 1º Semestre (31/07). Pode ser erro de cadastro. O sistema permite períodos sobrepostos, e isso é intencional (ver RN-CIR-13). Os circuitos do 6º Ano e do 7º Ano têm nomes em caixa diferente ("sistema de notas", "Sistema de notas"). Há modelos duplicados (dois "7º Ano - Padrão 2026").
- O aviso de edição fala em "circuito ativo", mas aparece sempre que existe versão ativa, inclusive em circuito desativado.
- A tela Importar envia nas props o objeto completo do usuário que exportou (e-mail etc.). Só administradores acessam essa tela.
- Novo circuito vem com média 6 e mín. recuperação 4, mas todos os circuitos reais usam 7 e 0. Vale confirmar com o negócio se o padrão está correto.

## Não verificado

- **Cálculo das notas** (bases, recuperação e composição entre etapas): os textos da tela foram catalogados, mas a aplicação real acontece no lançamento de notas dos diários e será verificada no módulo **Diários**.
- **Confirmar uma importação** e o efeito de **desativar** um circuito sobre os diários: não testados, para não interferir nos circuitos reais.
- **Arredondamento** (casas decimais) aplicado às médias.
- **Exclusão de circuito com notas lançadas**: só circuitos sem notas foram excluídos.

## Execução

```bash
npx playwright test e2e/regraDeNegocio/circuitoNotas --workers=1
```

Resultado em 30/09/2026: **43 testes ok**, sendo 35 que passam e 8 `test.fail` que documentam os defeitos CIR-01 a CIR-07 e CIR-09 (CIR-08 não tem teste). A suíte leva cerca de 6 minutos.

Na 1ª execução, 13 testes falharam por ajustes do próprio teste, e todos passaram depois da correção:

- o Vue junta rótulo e valor no texto ("Média Aprovação7.00");
- o valor do v-select fica no `<input>`;
- a chamada Inertia direta precisa do header `Accept: text/html, application/xhtml+xml`; sem ele, o Laravel responde 422 JSON;
- o toast de sucesso da edição não existe, o que virou o defeito CIR-09.

Depois de cada execução, o ambiente volta ao original: 7 circuitos, 3 modelos e nenhum `QA-`.
