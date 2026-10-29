# Regras de Negócio — Escolas (Franquias)

- **Menu:** Administração › Escolas (`[id="navbar.btn_franquias"]`), visível com a permissão `franquias.list`
- **Rotas:**

  | Rota | Nome | Componente |
  |------|------|------------|
  | `GET /franquias` | `franquias.list` | `AdmEscolar/Franquia/ListFranquias` |
  | `GET /franquias/criar` | `franquias.create` | `AdmEscolar/Franquia/NewEditFranquias` |
  | `POST /franquias/criar` | `franquias.store` | — |
  | `GET /franquias/{uuid}` | `franquias.edit` | `NewEditFranquias` |
  | `PUT /franquias/{uuid}` | `franquias.update` | — |
  | `DELETE /franquias/{uuid}` | `franquias.delete` | — |

  Rotas auxiliares: `franquias.endereco.{regioes,estados,municipios,distritos,resolver}` e `franquias.logomarca`.
- **Permissões:** `franquias.list`, `franquias.create`, `franquias.store`, `franquias.edit`, `franquias.update`, `franquias.delete`
- **Automação:** [`escolas.rn.spec.ts`](./escolas.rn.spec.ts)
- **Levantamento:** 30/09/2026, homologação, versão 0.1.0. Perfis usados: Super Administrador e Professor restrito.

**Técnica:** comando `/mapear-regras-negocio`. Explorei a tela com os dois perfis e li os componentes compilados:

- `ListFranquias` e `NewEditFranquias`;
- os subcomponentes `EnderecoFields`, `ContatoFields` e `LogomarcaUpload`;
- os utilitários `useCep`, `useFileUpload`, `useMessages` e `ModalConfirmation`.

A validação do servidor foi observada enviando o formulário com o nome sempre vazio, para que nada fosse criado. O ciclo de criar, editar e excluir usa uma escola `QA-` descartável, que o próprio teste exclui.

## Dados que o backend envia (props)

| Tela | Prop | Conteúdo |
|------|------|----------|
| Lista | `franquias` | paginação Laravel (`data`, `total`, `to`, `per_page` = 15, `next_page_url`…) |
| Lista | `titulo` | "Franquias" (título, `<Head>` e textos) |
| Lista | `search` | termo buscado (`?search=`) |
| Formulário | `franquia` | registro completo, com dados do Censo Escolar (edição) |
| Formulário | `titulo`, `editando` | "Franquias"; `true` na edição |
| Formulário | `regioes` | regiões do IBGE |

## Catálogo

### Acesso e listagem

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-ESC-01 | Acesso exige `franquias.list`. Sem ela, o item "Escolas" some do menu e `/franquias`, `/franquias/criar` e `/franquias/{uuid}` respondem **403** ("Você não tem permissão para acessar esta página."). | Layout + backend | ✅ |
| RN-ESC-02 | Listagem: título h5 "Franquias", aba "Franquias - <app>", breadcrumb Dashboard › Franquias › Listar (sem link). | `ListFranquias` | ✅ |
| RN-ESC-03 | *(esperado)* Mesma nomenclatura no menu e na tela. | Coerência | ❌ ESC-09 |
| RN-ESC-04 | Contador "Exibindo de {1 ou 0} até {to} de {total}", com **15 por página**. Cada linha mostra: `#id`, Descrição da Franquia, Código INEP (ou **N/A**), Município/UF (**N/A** se faltar município *ou* UF), Contato (telefone, senão celular, senão **N/A**) e o e-mail, se houver. | `ListFranquias` | ✅ (N/A com props simuladas) |
| RN-ESC-05 | "Carregar mais Franquias" acrescenta a página seguinte à lista. *(esperado)* Só aparece quando há próxima página. | `ListFranquias` | ❌ ESC-07 |
| RN-ESC-06 | A busca tem debounce de **300 ms** e vai na URL (`?search=`). Procura no **nome** (sem diferenciar maiúsculas) e no **código INEP**, mas **não** no município nem no e-mail. Sem resultado: "Exibindo de 0 até 0 de 0" + estado vazio. | `ListFranquias` + backend | ✅ / ❌ ESC-08 (texto) |
| RN-ESC-07 | Clique, Enter ou Espaço na linha abre a edição (`/franquias/{uuid}`). | `ListFranquias` | ✅ |
| RN-ESC-08 | O menu ⋮ tem **Editar** e **Excluir**. Excluir abre um modal persistente que exige digitar o **UUID exato** da escola; antes disso o botão Excluir fica desabilitado. Confirmado, faz `DELETE /franquias/{uuid}`. | `ListFranquias` + `ModalConfirmation` | ✅ / ❌ ESC-06 (texto) |

### Formulário (criar/editar)

| ID | Regra | Origem | Teste |
|----|-------|--------|-------|
| RN-ESC-09 | 6 abas: Básicas, Endereço, Contato, Infraestrutura, Jurídico, Vínculo. Breadcrumb Dashboard › Adm. Escolar › Franquias. Botões **Cancelar** (volta à lista) e **Salvar** (criação) ou **Atualizar** (edição). "Voltar" volta à lista. | `NewEditFranquias` | ✅ |
| RN-ESC-10 | Obrigatórios (backend): Nome, CEP, Logradouro, Bairro, Região, Estado e Município. Com 1 erro, o toast mostra a própria mensagem; com N erros, "Por favor, corrija N campos com erro antes de salvar.". Depois do envio, o formulário **vai para a 1ª aba que tem erro** (ordem das abas). | backend + `useMessages` + watcher | ✅ |
| RN-ESC-11 | Validações de formato do backend: DDD com 2 caracteres, e-mail válido, quantidade de computadores/tablets ≥ 0, CNPJ com 14 caracteres. | backend | ✅ / ❌ ESC-04 (mensagens) |
| RN-ESC-12 | O INEP tem máscara `########`: só dígitos, máximo 8. É opcional ("Identificação no censo escolar (opcional)"). *(esperado)* Rejeitar INEP com menos de 8 dígitos. | `NewEditFranquias` | ✅ máscara / ❌ ESC-02 |
| RN-ESC-13 | *(esperado)* Telefone com 8 ou 9 dígitos (hint do campo) e código da escola sede com 8 dígitos (hint). Front: DDD `maxlength=2`, Telefone `maxlength=9`, Outro Telefone `maxlength=20`. | `ContatoFields` | ❌ ESC-03 |
| RN-ESC-14 | Os CNPJs (mantenedora e escola privada) têm máscara `##.###.###/####-##`. *(esperado)* Deve ser possível salvar um CNPJ válido. | `NewEditFranquias` | ❌ ESC-01 |
| RN-ESC-15 | O código INEP é **único**: "Já existe uma franquia cadastrada com este código INEP.". | backend | ✅ |
| RN-ESC-16 | O CEP tem máscara `##.###-###`. Ao **sair do campo**, com 8 dígitos, consulta o **ViaCEP** e preenche logradouro, bairro, município, UF e complemento. Depois, `/franquias/endereco/resolver` preenche Região, Estado e Município. *(esperado)* CEP inexistente mostra "CEP não encontrado". | `useCep` + `EnderecoFields` | ✅ / ❌ ESC-05 |
| RN-ESC-17 | Cascata: Município fica desabilitado sem Estado, e Distrito sem Município. Trocar a Região limpa Estado, Município e Distrito; trocar o Estado limpa Município e Distrito. As opções vêm de `/franquias/endereco/*`. | `EnderecoFields` | ✅ |
| RN-ESC-18 | Na Infraestrutura, cada interruptor revela os seus detalhes. Detalhes abaixo. | `NewEditFranquias` | ✅ |
| RN-ESC-19 | Unidade Vinculada define os códigos exibidos. Detalhes abaixo. | `NewEditFranquias` | ✅ |
| RN-ESC-20 | A logomarca aceita PNG, JPG, JPEG e WEBP de até **2 MB**. Outro formato gera "Formato não suportado. Use PNG, JPG, JPEG, WEBP"; arquivo maior gera "A imagem deve ter no máximo 2MB". A validação é no cliente, e o envio usa `multipart` (`forceFormData`). | `useFileUpload` | ✅ |
| RN-ESC-21 | Na aba Jurídico, os blocos "Órgão vinculado" (para escola pública) e "Mantenedora" (para escola privada) aparecem **sempre**. A aplicabilidade é só um texto informativo e não depende da Dependência Administrativa. | `NewEditFranquias` | ✅ (comportamento atual) |
| RN-ESC-22 | Criar leva à lista com o toast "Franquia criada com sucesso!", e a escola nasce com `senha_expiracao_meses = 6` (campo fora do formulário). Editar salva e volta à lista. Excluir remove o registro, e o `GET` passa a responder 404. | backend + `messages` | ✅ |

### Detalhe da RN-ESC-18 (interruptores da Infraestrutura)

| Interruptor | Revela |
|-------------|--------|
| A escola possui recursos de acessibilidade? | 10 opções (corrimão, elevador, pisos táteis, vão livre, rampas, sinalização sonora/tátil/visual, banheiro PCD, "Nenhuma das opções") |
| A escola possui equipamentos? | 8 equipamentos + Qtd. Computadores e Qtd. Tablets (`min=0`) |
| A escola possui acesso à internet? | Tipo de Conexão (Banda larga, Móvel, Satélite, Discada, Rádio) + 4 usos |
| Informar dependências físicas da escola? | 40 dependências |

### Detalhe da RN-ESC-19 (Unidade Vinculada)

| Unidade Vinculada | Campos exibidos |
|-------------------|-----------------|
| Sem vínculo com outra instituição (0) / vazio | nenhum |
| Unidade vinculada a escola de educação básica (1) | Código da Escola Sede (`maxlength=8`), Código do Órgão Regional de Ensino (`maxlength=5`) |
| Unidade ofertante de educação superior (2) | Código da IES (`maxlength=9`), Código do Órgão Regional de Ensino (`maxlength=5`) |

## Defeitos encontrados

| ID | Severidade | Descrição | Evidência |
|----|------------|-----------|-----------|
| ESC-01 | **Alta** | **Não é possível salvar nenhum CNPJ.** A máscara `##.###.###/####-##` produz 18 caracteres, mas o campo tem `maxlength="14"`: digitando, o valor para em "11.222.333/000". Colando, o valor completo "11.222.333/0001-81" é enviado e o backend rejeita com "O campo cnpj mantenedora deve ser 14 caracteres.". Vale para o CNPJ da mantenedora e para o da escola privada. | RN-ESC-14 (`test.fail`) |
| ESC-02 | **Média** | O backend não valida o formato do INEP: aceita "12" (o Censo exige 8 dígitos). A máscara do front limita a 8 dígitos, mas não exige 8. | RN-ESC-12 (`test.fail`) |
| ESC-03 | Baixa | O backend aceita telefone "abcdefgh" (o hint pede 8 ou 9 dígitos) e código da escola sede "12" (o hint pede 8 dígitos). | RN-ESC-13 (`test.fail`) |
| ESC-04 | Baixa | As mensagens de validação usam o nome técnico do campo: "O campo **ddd** deve ser 2 caracteres.", "O campo **equip quantidade computadores**…", "O campo **cnpj mantenedora**…". | RN-ESC-11 (`test.fail`) |
| ESC-05 | Baixa | Um CEP inexistente não dá nenhum retorno ao usuário. O `useCep` define "CEP não encontrado" / "Erro ao buscar CEP", mas o formulário não exibe; o `cepLoading` também não é repassado. | RN-ESC-16 (`test.fail`) |
| ESC-06 | Baixa | O modal de exclusão diz "Tem certeza que deseja apagar este **cargo**?", porque o componente `ModalConfirmation` compartilhado tem o texto fixo. | RN-ESC-08 (`test.fail`) |
| ESC-07 | Baixa | "Carregar mais Franquias" aparece mesmo sem próxima página (1 de 1) e só some depois do clique. | RN-ESC-05 (`test.fail`) |
| ESC-08 | Baixa | O estado vazio diz "Não existem franquias **cadastrados**" (concordância). | RN-ESC-06 (`test.fail`) |
| ESC-09 | Baixa | Nomenclatura inconsistente: o menu e o card do Dashboard dizem "Escolas"; a tela, o breadcrumb, os botões ("Nova Franquia") e os campos ("Nome da Franquia") dizem "Franquia". O breadcrumb do formulário ainda usa "Adm. Escolar". | RN-ESC-03 (`test.fail`) |
| ESC-10 | Baixa | "Nome da Franquia" é obrigatório, mas não tem o "*" que os obrigatórios da aba Endereço têm. | Inspeção (aria). Sem teste. |

## Não verificado

- **Excluir uma escola com vínculos** (turmas, alunos, usuários): não testado, porque a única escola com dados é a real.
- **Datas de início e fim do ano letivo**: o date picker não foi exercitado, e não se sabe se o backend rejeita fim antes do início.
- **Regras do Censo entre campos** (ex.: categoria da escola privada só quando a dependência é Privada; órgão vinculado só para escola pública): o front não as aplica e o backend não foi testado com todas as combinações.
- **Toast de exclusão e de edição**: o fluxo funciona, mas o toast não foi capturado de forma consistente, por isso o teste valida pelos dados.
- **`senha_expiracao_meses`**: a escola nasce com 6, mas não há tela para alterar; o uso dele na expiração das senhas não foi verificado.
- **Rotas auxiliares `/franquias/endereco/*` e `/franquias/logomarca/*`**: respondem 200 também para o Professor (sem `franquias.*`). São dados públicos do IBGE e a logomarca da própria escola, então foi registrado como observação, não como defeito.

## Observações de ambiente

- A homologação tem **1 escola** ("Colégio Apoio", id 1, INEP 22135790). Ela nunca é alterada: o teste de exclusão só cancela o modal.
- O CEP depende de um serviço externo (**viacep.com.br**). Se ele estiver fora do ar, os testes RN-ESC-10 (1 erro), 16, 17 e 22 falham.
- O ciclo RN-ESC-22 cria e exclui `QA-Escola RN <timestamp>`, com limpeza garantida no `finally`.

## Execução

```bash
npx playwright test e2e/regraDeNegocio/escolas --workers=1
```

A suíte leva cerca de 18 minutos na homologação. Rode-a em segundo plano.

Resultado em 30/09/2026: **38 testes ok**, sendo 29 que passam e 9 `test.fail` que documentam os defeitos ESC-01 a ESC-09 (ESC-10 não tem teste). Na 1ª execução completa, 3 testes falharam por timeout ou `ERR_TIMED_OUT` da homologação e passaram com `--last-failed`.

> Um timeout no meio do ciclo RN-ESC-22 deixou a escola `QA-Escola RN 1790814731352` (id 3), que foi removida em seguida. A limpeza agora fica num `afterAll` com contexto próprio, que roda mesmo quando o teste estoura o tempo.
