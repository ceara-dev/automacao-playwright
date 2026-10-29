#language: pt

@protocolo-7614 @regressao
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-032
  Contexto:
    Dado que a turma de teste "QA-7614-V — QA 7614 Turma Vazia" (ano letivo 2026, circuito 9) não tem alunos
    E que "QA Professor 7614" é o titular do diário de Biologia da turma

  Cenário: Turma sem alunos enturmados
    Dado que a turma "QA-7614-V" do ano letivo "2026" não possui alunos enturmados
    Quando o usuário "qa.ti.7614" gerar o boletim de notas da turma "QA-7614-V"
    Então o PDF deve exibir o cabeçalho da turma
    E deve exibir a mensagem "Nenhum aluno encontrado para esta turma"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — massa QA criada para o teste):
  # FALHOU (Baixa). Nenhum PDF é gerado. O diálogo abre como "Boletim de notas" (sem "(N alunos)") e mostra:
  #  - "0 de 0 selecionado(s)";
  #  - "Nenhum aluno encontrado para “”. Confira o nome ou o número da matrícula.", a mensagem de busca sem resultado, com aspas vazias;
  #  - o botão "Selecione ao menos um aluno" desabilitado.
  # O esperado era o PDF com o cabeçalho e a mensagem "Nenhum aluno encontrado para esta turma", ou pelo menos essa mensagem no diálogo.
  # Evidência: pen7614-32-turma-sem-alunos.png (diálogo da turma vazia)
  # ---------------------------------------------------------------------------
