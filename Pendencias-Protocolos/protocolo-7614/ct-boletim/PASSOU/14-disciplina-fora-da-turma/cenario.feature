#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-014
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Disciplina fora da composição da turma não é apresentada
    Dado que as disciplinas "Biologia" e "Inglês" existem na escola
    Mas não fazem parte da composição da turma "9ANO-M-2026"
    Quando o boletim de notas da turma "9ANO-M-2026" for gerado
    Então as disciplinas "Biologia" e "Inglês" não devem ser apresentadas no PDF

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. O boletim do 9º Ano traz só Ensino religioso, Geografia, Espanhol e Química.
  # Evidência: pen7614-14-disciplina-fora-da-turma.png
  # ---------------------------------------------------------------------------
