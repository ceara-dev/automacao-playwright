# Mapeamento do DOM — Dashboard e Menu Lateral

Sistema: **Apoio** (`http://veramendes.local` — Homologação)
Stack: Vue 3 + Vuetify (SPA). Autenticado como Hilton (Super Administrador).

## Convenção de locators

Prioridade (skill sdet-playwright):
1. `getByRole()` com nome acessível
2. `getByLabel()` para inputs
3. `getByPlaceholder()`
4. `getByText()`
5. Seletor estável por `id` como último recurso

O menu é renderizado com `div[role="option"]` (Vuetify `v-list-item`), sem `<a>`. Cada item tem
um `id` estável no padrão `navbar.btn_<slug>`. O seletor CSS precisa escapar o ponto:
`[id="navbar.btn_<slug>"]`.

## Menu lateral esquerdo

Agrupado por seções (texto simples entre separadores). Itens navegáveis são `option` com id.

### Início

| Item | id | Rota |
|------|----|------|
| Dashboard | `navbar.btn_dashboard` | `/dashboard` |

### Administração

| Item | id | Rota |
|------|----|------|
| Escolas | `navbar.btn_franquias` | `/franquias` |
| Profissionais | `navbar.btn_profissionais` | `/profissionais` |
| Circuito de Notas | `navbar.btn_circuito_notas` | `/circuito-notas` |
| Componentes Curriculares | `navbar.btn_componentes_curriculares` | `/componentes-curriculares` |
| Processos/Documentos | `v-list-group--id-processos` | (grupo recolhível) |

Subitens de **Processos/Documentos**:

| Item | id | Rota |
|------|----|------|
| Contratos | `navbar.btn_contratos` | `/contratos` |
| Tipos de Desconto | `navbar.btn_tipos_desconto` | `/tipos-desconto` |
| Declarações | `navbar.btn_declaracoes` | `/declaracoes` |
| Tipos de Declarações | `navbar.btn_tipos_declaracoes` | `/tipos-declaracao` |

### Acadêmico

| Item | id | Rota |
|------|----|------|
| Alunos | `navbar.btn_alunos` | `/alunos` |
| Matrículas | `navbar.btn_matriculas` | `/matriculas` |
| Turmas | `navbar.btn_turmas` | `/turmas` |
| Prorrogações | `navbar.btn_prorrogacoes` | `/prorrogacoes` |
| Diários | `navbar.btn_diarios` | `/diarios` |
| Presença Notifiq | `navbar.btn_notifiq_presencas` | `/notifiq/presencas` |
| Feriados | `navbar.btn_feriados` | `/feriados` |
| Justificativa de Falta | `navbar.btn_justificativas` | `/justificativas` |

### Relatórios

| Item | id | Rota |
|------|----|------|
| Relatórios | `navbar.btn_relatorios` | `/relatorios` |

### Administração do Sistema

| Item | id | Rota |
|------|----|------|
| ACL | `v-list-group--id-acl` | (grupo recolhível) |
| Configurações Acadêmicas | `navbar.btn_configuracoes_academicas` | `/configuracoes-academicas` |
| Auditoria | `navbar.btn_auditoria` | `/auditoria` |

Subitens de **ACL**:

| Item | id | Rota |
|------|----|------|
| Cargos | `navbar.btn_cargos` | `/cargos` |
| Permissões | `navbar.btn_permissoes` | `/permissoes` |
| Usuários | `navbar.btn_usuarios` | `/usuarios` |

## Barra superior (header)

| Elemento | Tipo | Locator sugerido |
|----------|------|------------------|
| Logomarca de Apoio | `img` | `getByRole('img', { name: 'Logomarca de Apoio' })` |
| Ano letivo | `button` | `getByRole('button', { name: /Ano letivo/ })` |
| Editar perfil de Hilton | `button` | `getByRole('button', { name: /Editar perfil/ })` |
| Versão / changelog | `button` | `getByRole('button', { name: /Versão 0.1.0/ })` |
| Sair da conta | `button` | `getByRole('button', { name: 'Sair da conta' })` |

## Banner (segunda barra)

| Elemento | Tipo | Locator sugerido |
|----------|------|------------------|
| Fechar menu | `button` | `getByRole('button', { name: 'Fechar menu' })` |
| Nome do cliente | texto | `getByText('Colégio Apoio')` |
| Notificações | `button` | `getByRole('button', { name: 'Notificações' })` |
| Menu do usuário | `button` | `getByRole('button', { name: 'Menu do usuário' })` |

## Conteúdo do Dashboard (`/dashboard`)

### Breadcrumb

- `link "Dashboard"` → `/dashboard`
- `link "Início"` → `/dashboard`

### Cabeçalho

| Elemento | Tipo | Locator sugerido |
|----------|------|------------------|
| Saudação "Boa tarde, Hilton" | `heading` nível 1 | `getByRole('heading', { level: 1, name: 'Hilton' })` |
| Perfil "Apoio · Super Administrador" | `paragraph` | `getByText('Apoio · Super Administrador')` |

### Seção "Módulos principais" (cards-link)

Cada card é um `link` com heading interno (nível 3), descrição e contador.

| Card | Rota | Contador (ex.) |
|------|------|----------------|
| Alunos | `/alunos` | 244 aluno(s) |
| Escolas | `/franquias` | 1 escola(s) |
| Usuários | `/usuarios` | 57 usuário(s) |
| Turmas | `/turmas` | 7 turma(s) |
| Matrículas | `/matriculas` | 187 matrícula(s) |
| Profissionais | `/profissionais` | 42 profissional(is) |

### Seção "Acesso rápido" (cards-link)

| Card | Rota |
|------|------|
| Cargos | `/cargos` |
| Permissões | `/permissoes` |

## Locators prontos para uso

```ts
// Navegar por item do menu (role + nome acessível)
await page.getByRole('option', { name: 'Escolas' }).click();
// ou fallback estável por id
await page.locator('[id="navbar.btn_franquias"]').click();

// Cards do dashboard
await page.getByRole('link', { name: /Alunos/ }).click();

// Asserção de acesso
await expect(page.getByRole('heading', { level: 1, name: 'Hilton' })).toBeVisible();
```

## Observações

- Grupos (`Processos/Documentos`, `ACL`) precisam ser expandidos (click no header) antes de
  interagir com os subitens — o subitem só fica visível após expandir.
- `Tipos de Declarações` roteia para `/tipos-declaracao` (singular), diferentemente do slug `tipos_declaracoes`.
- O menu usa `role="option"` e `aria-selected`, não `role="link"`.
