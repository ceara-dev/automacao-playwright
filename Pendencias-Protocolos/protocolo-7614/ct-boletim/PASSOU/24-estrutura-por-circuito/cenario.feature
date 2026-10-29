#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-024
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Esquema do Cenário: Turmas de etapas diferentes geram estruturas conforme o próprio Circuito
    Dado que a turma "<turma>" utiliza o Circuito de Notas "<circuito>"
    Quando o usuário "qa.ti.7614" gerar o boletim de notas da turma "<turma>"
    Então os blocos de período devem ser "<periodos>"
    E as avaliações da Etapa Final devem ser "<final>"

    Exemplos:
      | turma        | circuito | periodos                                                              | final          |
      | 3SER-M-2026  | 9        | 1º Bim, 2º Bim, 1º Sem, 3º Bim, 4º Bim, 2º Sem, Etapa Final           | N1, N2, Média  |
      | 9ANO-M-2026  | 6        | 1º Bim, 2º Bim, 1º Sem, 3º Bim, 4º Bim, 2º Sem, Etapa Final           | N1, Média      |

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Cada turma usa o próprio circuito (Etapa Final com N1 e N2 na 3ª Série; só N1 no 9º Ano). Limitação: não há circuito trimestral na homologação.
  # Evidência: pen7614-24-estrutura-por-circuito.png
  # ---------------------------------------------------------------------------
