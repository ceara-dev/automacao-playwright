#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-013
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Avaliação sem nota registrada não exibe valor inexistente
    Dado que "Ingrid Maria do Nascimento dos Santos" não possui nota registrada em "AV2" do "1º Bimestre" de "Biologia"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então a célula "AV2" do "1º Bimestre" de "Biologia" de "Ingrid Maria do Nascimento dos Santos" deve ficar vazia ou exibir "-"
    Mas não deve exibir "0" nem qualquer valor não registrado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. AV2 e Média ficam vazias nos 4 bimestres (Biologia, Física e Química); só AV1 = 8,00 aparece.
  # Evidência: pen7614-13-avaliacao-sem-nota.png
  # ---------------------------------------------------------------------------
