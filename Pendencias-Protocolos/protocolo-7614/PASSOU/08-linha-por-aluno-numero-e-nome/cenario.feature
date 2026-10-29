#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Apresentar cada aluno em uma linha com Nº e Nome
    Dado que o sistema esteja gerando o boletim de notas da turma
    Quando montar as informações acadêmicas no PDF
    Então cada aluno deve ser apresentado em uma linha
    E devem existir inicialmente as colunas: Nº da chamada; Nome do aluno

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Cada disciplina é uma tabela com uma linha por aluno; as duas primeiras colunas são "Nº" e "Aluno". (Ver cenário 03 sobre o valor do Nº.)
  # Evidência: pen7614-08-linha-por-aluno-numero-e-nome.png
  # ---------------------------------------------------------------------------
