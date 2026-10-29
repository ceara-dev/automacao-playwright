#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Apresentar o percentual de frequência ao final do ano letivo
    Dado que existam frequências registradas para o aluno durante o ano letivo
    Quando o boletim apresentar os resultados anuais
    Então deve ser apresentado o percentual de frequência do aluno ao final do ano
    E o percentual deve considerar as frequências registradas durante o respectivo ano letivo
    E a informação deve corresponder aos dados de frequência do aluno naquela turma

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Seção "Frequência anual na turma" (Nº | Aluno | Aulas | Faltas | Frequência (%)), consolidando todas as disciplinas da turma (2 aulas: Biologia + Física). Giovanna: 2 faltas → 0%; Alberto: 0 → 100%. Cada disciplina também tem "Freq. (%)".
  # Evidência: pen7614-13-frequencia-anual.png
  # ---------------------------------------------------------------------------
