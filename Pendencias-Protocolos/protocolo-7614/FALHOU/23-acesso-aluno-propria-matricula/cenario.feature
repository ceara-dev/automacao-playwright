#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do cargo Aluno está autenticado

  Cenário: Permitir ao Aluno imprimir o boletim da própria matrícula
    Dado que a regra de acesso do boletim é: T.I, Gestor, Super Administrador e Profissional imprimem na listagem de Diários e entrando em cada diário; o Professor imprime os diários que são dele; o Aluno imprime de acordo com a própria matrícula
    Quando o aluno procurar a impressão do seu boletim
    Então o aluno deve conseguir imprimir o boletim com os dados da sua matrícula
    E não deve ter acesso ao boletim de outros alunos

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU. O cargo Aluno não tem nenhuma permissão de impressão (turmas.diario.print.boletim / boletim-alunos) nem de Diários: menu sem "Diários", /diarios → 403, /diarios/3 → 403, geração → 403. Não há outro ponto de entrada do boletim para o aluno. Obs.: qa.aluno.7614 não está vinculado a uma matrícula; o resultado vem da configuração do cargo, que vale para qualquer aluno.
  # Evidência: pen7614-23-acesso-aluno-propria-matricula.png
  # ---------------------------------------------------------------------------
