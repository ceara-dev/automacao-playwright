#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-023
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Períodos com avaliações diferentes respeitam a configuração de cada período
    Dado que o Circuito 9 define "AV1", "AV2" e "REC" para os bimestres
    E define "REC" para os semestres e "N1" e "N2" para a "Etapa Final"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então cada bloco de período deve conter somente as avaliações configuradas para ele

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Bimestres: AV1/AV2/REC/Média/Faltas; semestres: REC/Média; Etapa Final: N1/N2/Média. Limitação: no circuito 9 todos os bimestres têm as mesmas avaliações (não há bimestre com AV3).
  # Evidência: pen7614-23-avaliacoes-por-periodo.png
  # ---------------------------------------------------------------------------
