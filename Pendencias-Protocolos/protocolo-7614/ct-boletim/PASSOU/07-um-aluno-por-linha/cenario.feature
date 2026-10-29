#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-007
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Estrutura inicial com um aluno por linha
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então cada aluno deve ocupar uma única linha
    E as primeiras colunas devem ser "Nº" e "Aluno", nesta ordem

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. 24 linhas por disciplina, uma por aluno, com "Nº" e "Aluno" como primeiras colunas.
  # Evidência: pen7614-07-um-aluno-por-linha.png
  # ---------------------------------------------------------------------------
