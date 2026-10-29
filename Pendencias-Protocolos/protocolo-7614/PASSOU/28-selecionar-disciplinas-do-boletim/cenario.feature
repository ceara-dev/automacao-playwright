#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Escolher as disciplinas do boletim
    Dado que o diálogo "Boletim de notas" está aberto
    Quando o usuário escolher "Individual" em "Disciplinas" e marcar algumas disciplinas
    Então o boletim deve conter somente as disciplinas marcadas
    E com nenhuma disciplina marcada o botão deve ficar desabilitado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU (novo na atualização). "Disciplinas" tem "Todas" (padrão) e "Individual"; em Individual aparecem as 8 disciplinas da turma com o professor no título ("Disciplinas · 0 de 8") e o botão vira "Selecione ao menos uma disciplina" (desabilitado). Com Física e Química marcadas → "Disciplinas · 2 de 8", o pedido envia diarios[]=9,24 e o PDF traz só essas duas.
  # Evidência: pen7614-28-selecionar-disciplinas-do-boletim.png
  # ---------------------------------------------------------------------------
