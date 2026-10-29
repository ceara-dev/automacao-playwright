#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-006
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Boletim apresenta as disciplinas ministradas na turma
    Dado que a turma "3SER-M-2026" é composta pelas disciplinas "Biologia", "Física", "Química" e outras 5
    Quando o boletim de notas da turma for gerado
    Então o PDF deve apresentar as 8 disciplinas da turma
    E as informações de cada aluno devem estar relacionadas à respectiva disciplina

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. 8 blocos: Biologia, Filosofia, Física, Geografia, Espanhol, Inglês, Química e Sociologia (= os 8 diários da turma), cada um com o professor. A falta de "Giovanna dos Santos Teixeira" lançada em Física (3º Bimestre) aparece só em Física.
  # Evidência: pen7614-06-disciplinas-da-turma.png
  # ---------------------------------------------------------------------------
