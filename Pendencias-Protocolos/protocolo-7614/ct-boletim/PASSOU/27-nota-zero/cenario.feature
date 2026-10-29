#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-027
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Nota zero registrada é exibida como informação válida
    Dado que "Davi Silva Lima" possui nota "0,00" registrada em "AV1" do "1º Bimestre" de "Biologia"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então a célula "AV1" do "1º Bimestre" de "Biologia" de "Davi Silva Lima" deve exibir "0,00"
    E deve ser distinguível de uma célula sem registro

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Davi: AV1 0,00, AV2 0,00, Média 0,00. "Yasmim da Silva Rocha" (sem nota) tem as mesmas células vazias.
  # Evidência: pen7614-27-nota-zero.png
  # ---------------------------------------------------------------------------
