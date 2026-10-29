#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-002
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Boletim apresenta somente os alunos da turma
    Dado que a turma "3SER-M-2026" possui os alunos "Alberto do Nascimento Ferreira Neto", "Ana Beatriz dos Santos Souza" e "Ana Maria Veras Brito Melo"
    E que o aluno "Vitor Bruno Diniz Bergamine de Sousa" pertence somente à turma "9ANO-M-2026"
    Quando o usuário "qa.ti.7614" gerar o boletim de notas da turma "3SER-M-2026"
    Então o PDF deve listar somente os alunos enturmados na turma "3SER-M-2026"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. Cada disciplina lista exatamente os 24 alunos do diário (mesma lista de /diarios/3/alunos), na mesma ordem; "Vitor Bruno Diniz Bergamine de Sousa" (9º Ano) não aparece.
  # Evidência: pen7614-02-somente-alunos-da-turma.png
  # ---------------------------------------------------------------------------
