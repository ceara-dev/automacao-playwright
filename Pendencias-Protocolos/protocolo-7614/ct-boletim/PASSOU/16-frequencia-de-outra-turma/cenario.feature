#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-016
  Contexto:
    Dado que a escola "Colégio Apoio" possui as turmas de teste "QA-7614-A" e "QA-7614-B" no ano letivo "2026"
    E que as duas turmas utilizam o Circuito de Notas 9 (etapa "Ensino médio - 3ª Série")
    E que "QA Professor 7614" é o titular do diário de Biologia de cada turma

  Cenário: Frequência de outra turma não compõe o percentual
    Dado que "QA Aluno Duas Turmas 7614" está matriculado nas turmas "QA-7614-A" e "QA-7614-B" em "2026"
    E que teve "1" aula sem falta na turma "QA-7614-A"
    E que teve "1" aula com "1" falta na turma "QA-7614-B"
    Quando o boletim de notas da turma "QA-7614-A" for gerado
    Então o percentual de frequência de "QA Aluno Duas Turmas 7614" deve considerar somente os registros da turma "QA-7614-A"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — massa QA criada para o teste):
  # PASSOU. Boletim da turma A: 1 aula, 0 faltas, 100. Boletim da turma B: 1 aula, 1 falta, 0. Se misturasse as turmas, seriam 2 aulas e 50%.
  # As notas também ficam separadas: AV1 8,00 em A e 5,00 em B.
  # Observação 1: o sistema aceitou matricular o mesmo aluno em duas turmas do mesmo ano, as duas como "Cursando".
  # Observação 2 (massa): lançar a aula pela API (POST /diarios/{id}/aulas) sem informar a presença grava 1 falta para todos os alunos da turma (confirmado na Auditoria). As faltas indevidas foram zeradas antes da execução.
  # Evidência: pen7614-16-frequencia-de-outra-turma.png (boletins das turmas A e B)
  # ---------------------------------------------------------------------------
