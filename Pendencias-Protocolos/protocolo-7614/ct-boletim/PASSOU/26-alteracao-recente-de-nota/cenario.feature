#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-026
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Boletim reflete alteração recente de nota
    Dado que "Alberto do Nascimento Ferreira Neto" possuía "AV1" "9,00" no "1º Bimestre" de "Biologia"
    E que a nota foi alterada para "7,50" no Diário
    Quando o boletim de notas da turma "3SER-M-2026" for gerado novamente
    Então a célula "AV1" do "1º Bimestre" de "Biologia" de "Alberto do Nascimento Ferreira Neto" deve exibir "7,50"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Depois da alteração, o boletim traz 7,50 e a Média 7,75 no 1º Bimestre de Biologia; os demais bimestres e Física continuam 9,00/8,50. A nota original (9,00) foi devolvida no final do teste.
  # Evidência: pen7614-26-alteracao-recente-de-nota.png
  # ---------------------------------------------------------------------------
