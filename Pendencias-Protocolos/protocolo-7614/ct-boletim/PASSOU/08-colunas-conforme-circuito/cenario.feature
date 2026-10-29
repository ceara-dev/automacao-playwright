#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-008
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Colunas de avaliações montadas conforme o Circuito de Notas
    Dado que o Circuito 9 define para o "1º Bimestre" as avaliações "AV1", "AV2" e "REC"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então o bloco do "1º Bimestre" deve conter as colunas "AV1", "AV2", "REC", "Média" e "Faltas"
    E não deve conter colunas de avaliações não configuradas no Circuito

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Colunas: 4 bimestres com AV1/AV2/REC/Média/Faltas, semestres com REC/Média, Etapa Final N1/N2/Média e Freq. (%). Nenhuma coluna extra.
  # Evidência: pen7614-08-colunas-conforme-circuito.png
  # ---------------------------------------------------------------------------
