#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-031
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Turma com grande volume de alunos e disciplinas
    Dado que a turma "3SER-M-2026" possui "24" alunos e "8" disciplinas
    Quando o boletim de notas da turma for gerado
    Então o PDF deve ser exibido com todos os "24" alunos e as "8" disciplinas
    E o cabeçalho e os títulos das colunas devem se repetir em cada página

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # PASSOU. 7 páginas, 8 disciplinas, 24 alunos. Cada página repete o cabeçalho da escola e a numeração "Página N de 7"; toda tabela, inclusive a continuação, repete os títulos dos períodos e das colunas.
  # Adaptação: a maior turma com circuito tem 24 alunos e 8 disciplinas (2SER-M-2026 tem 38 alunos, mas não tem circuito). Obs.: a continuação não repete o nome da disciplina (defeito 25 do pacote anterior).
  # Evidência: pen7614-31-grande-volume-de-alunos-e-disciplinas.png
  # ---------------------------------------------------------------------------
