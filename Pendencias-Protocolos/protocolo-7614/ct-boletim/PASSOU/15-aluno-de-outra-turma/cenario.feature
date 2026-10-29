#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-015
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Aluno de outra turma não é apresentado
    Dado que o aluno "Vitor Bruno Diniz Bergamine de Sousa" está enturmado somente na turma "9ANO-M-2026"
    Quando o boletim de notas da turma "3SER-M-2026" for gerado
    Então o aluno "Vitor Bruno Diniz Bergamine de Sousa" não deve ser apresentado no PDF

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. O aluno não aparece no boletim da 3ª Série.
  # Evidência: pen7614-15-aluno-de-outra-turma.png
  # ---------------------------------------------------------------------------
