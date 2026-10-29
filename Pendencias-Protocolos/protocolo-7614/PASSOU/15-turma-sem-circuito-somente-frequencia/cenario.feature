#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário está no Diário de Filosofia da turma 2SER-M-2026, que não tem circuito de notas ativo

  Cenário: Gerar o boletim de turma sem circuito de notas
    Dado que a turma não tem circuito de notas no ano letivo
    Quando o boletim for gerado
    Então o sistema deve informar que não há circuito e não deve inventar colunas de avaliação

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. O PDF traz o aviso "A turma não tem circuito de notas ativo neste ano letivo — o boletim traz apenas a frequência." e só as colunas Nº, Aluno e Freq. (%), com os 38 alunos. (A turma está ligada à etapa "normal/magistério - 2ª Série" — cadastro a corrigir.)
  # Evidência: pen7614-15-turma-sem-circuito-somente-frequencia.png
  # ---------------------------------------------------------------------------
