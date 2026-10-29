#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Exibir o cabeçalho do PDF
    Dado que o boletim de notas da turma tenha sido gerado
    Quando o usuário visualizar o PDF
    Então o documento deve apresentar no cabeçalho, no mínimo: Escola; Ano letivo; Turma

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Cabeçalho com logomarca, "Colégio Apoio", endereço, CEP, telefone e e-mail (repetido em todas as páginas); título "BOLETIM DE NOTAS DA TURMA"; bloco "Escola: Colégio Apoio | Ano letivo: 2026 | Turma: 3SER-M-2026 — 3º Série | Etapa de ensino: Ensino médio - 3ª Série".
  # Evidência: pen7614-05-cabecalho-escola-ano-turma.png
  # ---------------------------------------------------------------------------
