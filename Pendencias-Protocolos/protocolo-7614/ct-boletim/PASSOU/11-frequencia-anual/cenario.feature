#language: pt

@protocolo-7614 @smoke @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-011
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Exibir percentual anual de frequência do aluno
    Dado que "Alberto do Nascimento Ferreira Neto" teve "2" aulas registradas e "0" faltas na turma "3SER-M-2026" em "2026"
    Quando o boletim apresentar os resultados anuais
    Então o percentual de frequência anual de "Alberto do Nascimento Ferreira Neto" deve ser "100%"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Tabela "Frequência anual na turma": Alberto 2 aulas, 0 faltas, 100. A fórmula arredonda((aulas − faltas) ÷ aulas × 100) confere em todas as 24 linhas.
  # Evidência: pen7614-11-frequencia-anual.png
  # ---------------------------------------------------------------------------
