# Protocolo 7578 — Gerar Relatório Notifiq em PDF com novo layout

Índice de cenários (BDD/Gherkin) com resultado real do ambiente de homologação.

| # | Cenário | Severidade sugerida | Pasta |
|---|---------|---------------------|-------|
| 01 | Gerar PDF exibindo título e identificação da escola | Baixa | `PASSOU/01-gerar-pdf-titulo-e-escola/` |
| 02 | Gerar PDF com Data, Turma, Escola e Total de alunos no cabeçalho | Baixa | `PASSOU/02-gerar-pdf-cabecalho/` |
| 03 | Gerar PDF com as colunas Aluno, Matrícula, Entrada, Saída e Situação | Baixa | `PASSOU/03-gerar-pdf-colunas/` |
| 04 | Gerar PDF exibindo horário e dispositivo de entrada e saída | Baixa | `PASSOU/04-gerar-pdf-horario-e-dispositivo/` |
| 05 | Gerar PDF exibindo as situações Completo, Só entrada e Sem registro | Baixa | `PASSOU/05-gerar-pdf-situacoes/` |
| 06 | Gerar PDF em múltiplas páginas mantendo as colunas | Baixa | `PASSOU/06-gerar-pdf-multiplas-paginas/` |
| 07 | Gerar PDF renderizando nomes com caracteres especiais | Baixa | `PASSOU/07-gerar-pdf-caracteres-especiais/` |
| 08 | Aplicar o novo padrão visual diferenciando as colunas | Baixa | `PASSOU/08-novo-layout-diferenciacao-colunas/` |
| 09 | Aplicar espaçamento entre os dados e as bordas da página | Baixa | `PASSOU/09-novo-layout-espacamento-bordas/` |
| 10 | Imprimir o PDF gerado em papel A4 sem cortes | Baixa | `PASSOU/10-gerar-pdf-impressao-a4/` |
| 11 | Gerar PDF filtrando por turma | Baixa | `PASSOU/11-gerar-pdf-filtro-turma/` |
| 12 | Gerar PDF filtrando apenas por data | Baixa | `PASSOU/12-gerar-pdf-filtro-data/` |
| 13 | Gerar PDF filtrando por data e turma | Baixa | `PASSOU/13-gerar-pdf-filtro-data-turma/` |
| 14 | Gerar PDF filtrando por data e escola | Baixa | `PASSOU/14-gerar-pdf-filtro-data-escola/` |
| 15 | Validar integridade entre Total de alunos e linhas do relatório | Média | `FALHOU/15-gerar-pdf-total-alunos-consistente/` |
| 16 | Ordenar alunos alfabeticamente desconsiderando acentos e caixa | Baixa | `FALHOU/16-gerar-pdf-ordenacao-alfabetica/` |
| 17 | Baixar cada relatório disponível em PDF | Alta | `FALHOU/17-gerar-pdf-baixar-todos-relatorios/` |
| 18 | Validar endpoint de exportação da API | Baixa | `PASSOU/18-gerar-pdf-endpoint-200/` |
| 19 | Negar acesso à exportação sem autenticação | Baixa | `PASSOU/19-gerar-pdf-sem-autenticacao/` |
| 20 | Restringir o PDF aos dados da escola do usuário | Alta | `FALHOU/20-gerar-pdf-escola-restrita/` |
| 21 | Invalidar a exportação com sessão expirada | Baixa | `PASSOU/21-gerar-pdf-sessao-expirada/` |
| 22 | Tratar injeção de script no filtro como texto literal | Baixa | `PASSOU/22-gerar-pdf-injecao-xss/` |
| 23 | Rejeitar chamada ao endpoint sem parâmetros válidos | Alta | `FALHOU/23-gerar-pdf-endpoint-sem-parametros/` |
| 24 | Desativar o endpoint legado de exportação .csv | Alta | `FALHOU/24-gerar-pdf-csv-legado-desativado/` |
| 25 | Rejeitar datas invertidas com mensagem de validação | Média | `FALHOU/25-gerar-pdf-datas-invertidas/` |
| 26 | Retornar resultado vazio para data futura | Média | `FALHOU/26-gerar-pdf-data-futura/` |

## Resumo de falhas e vulnerabilidades

| # | Falha/Vulnerabilidade | Severidade |
|---|-----------------------|------------|
| 15 | Cabeçalho informa "Total de alunos: 188", mas o PDF lista 183 alunos (5 ausentes: matrículas 101, 102, 168 e outras). | Média |
| 16 | Ordenação sensível a acentos: "José Levi Neres de Sousa" aparece antes de "João Gabriel Carvalho Almeida". | Baixa |
| 17 | O botão "Baixar" desses 5 relatórios chama `relatorios.notifiq.export` e baixa `notifiq-registros-*.csv`, em vez do PDF do relatório. Apenas "Registro de Entrada e Saída" gera PDF. | Alta |
| 20 | Usuário restrito (Professor, 1 escola) recebe HTTP 403 ao exportar, mesmo possuindo a permissão `relatorios.notifiq.export`. Necessária segunda escola para o contraste negativo. | Alta |
| 23 | O endpoint retorna 200 com PDF (período padrão) mesmo sem parâmetros, expondo dados. | Alta |
| 24 | O endpoint legado ainda retorna 200 com `text/csv` (notifiq-registros-*.csv). | Alta |
| 25 | A API aceita datas invertidas e retorna 200 PDF sem validação. | Média |
| 26 | Data futura retorna "Total de alunos: 188" em vez de 0. | Média |

## Evidências

- _evidencias/pen7578-tela-relatorios-notifiq.png — tela Relatórios Notifiq (dashboard, filtros, relatórios, registros).
- _evidencias/pen7578-novo-layout-pagina-1.png — página 1 do PDF renderizado (novo layout).
- _evidencias/pen7578-novo-layout-pagina-2.png — página 2 do PDF renderizado.
