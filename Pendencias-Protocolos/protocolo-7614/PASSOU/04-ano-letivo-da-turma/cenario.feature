#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Considerar o ano letivo da turma acessada
    Dado que a turma acessada é do ano letivo 2026
    Quando o boletim for gerado
    Então o documento deve considerar o ano letivo da turma acessada
    E o cabeçalho deve mostrar "Ano letivo 2026"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Cabeçalho "Ano letivo 2026"; as notas exibidas são as dos bimestres de 2026 do circuito da turma.
  # Evidência: pen7614-04-ano-letivo-da-turma.png
  # ---------------------------------------------------------------------------
