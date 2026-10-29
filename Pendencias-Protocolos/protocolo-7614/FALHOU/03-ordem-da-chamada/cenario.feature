#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário está no Diário de Geografia da turma 9ANO-M-2026, que tem uma matrícula sem nº de chamada

  Cenário: Apresentar os alunos na ordem da chamada
    Dado que o boletim de notas da turma foi gerado
    Quando o usuário conferir a coluna "Nº"
    Então os alunos devem ser apresentados seguindo a ordem da chamada
    E o "Nº" deve ser o número de chamada de cada matrícula

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU (persiste após a atualização). O "Nº" é a posição na lista, não o nº de chamada. No 9º Ano a matrícula 187 ("Sem nome", sem nº de chamada) aparece como Nº 1 e desloca todos: Ana Bianca (chamada 1) vira Nº 2, Ana Cecílya (chamada 2) vira Nº 3 etc. Na 3ª Série a ordem está correta (diálogo mostra "Chamada 1…24"). Obs.: o cadastro "Aluno sem nome" também deve ser corrigido.
  # Evidência: pen7614-03-ordem-da-chamada.png
  # ---------------------------------------------------------------------------
