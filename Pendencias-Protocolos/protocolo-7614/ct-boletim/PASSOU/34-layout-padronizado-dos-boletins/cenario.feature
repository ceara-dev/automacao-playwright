#language: pt

@protocolo-7614 @usabilidade
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-034
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que o Diário oferece em "Imprimir" as opções "Boletim de notas" e "Boletim individual — Uma página por aluno"

  Cenário: Padronizar o layout de boletins para Boletim de notas e Boletim individual
    Dado que o usuário "qa.ti.7614" gerou o "Boletim de notas" da turma "3SER-M-2026"
    E gerou o "Boletim individual" de "Alberto do Nascimento Ferreira Neto"
    Quando comparar os dois PDFs
    Então ambos devem usar o mesmo cabeçalho da escola (logo, nome, endereço, CEP, telefone e e-mail)
    E o mesmo bloco de identificação (rótulo e valor) com Turma, Ano letivo e Etapa de ensino
    E a mesma grade de notas agrupada por período, com as mesmas colunas do Circuito de Notas
    E a mesma legenda, o mesmo local/data, a mesma assinatura e o mesmo rodapé "Gerado por | Data | Página"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — massa QA criada para o teste):
  # PASSOU (com observações de baixa severidade). Os dois PDFs são A4 paisagem, com as mesmas fontes (Nimbus Sans), cabeçalho, grade, legenda, local/data, assinatura e rodapé. As notas são as mesmas (Biologia 9,00 · 8,00 · 8,50).
  # Diferenças encontradas:
  #  - Título: "BOLETIM ANUAL" no individual, mas o menu chama de "Boletim individual". O da turma é "BOLETIM DE NOTAS DA TURMA".
  #  - Identificação: o individual não tem a linha "Escola" (o da turma tem "Escola Colégio Apoio").
  #  - Frequência anual: frase no individual ("100% — 0 falta(s) em 2 aula(s)") e tabela no da turma (sem o símbolo %).
  #  - O nome longo da disciplina quebra em duas linhas no individual ("Língua /Literatura estrangeira / - Espanhol").
  #  - Nome do arquivo: "boletins-3ser-m-2026-2026-<aluno>.pdf" × "boletim-3ser-m-2026-2026.pdf" (prefixo diferente e o ano repetido nos dois).
  # Evidência: pen7614-34-layout-padronizado-dos-boletins.png (individual à esquerda, turma à direita)
  # ---------------------------------------------------------------------------
