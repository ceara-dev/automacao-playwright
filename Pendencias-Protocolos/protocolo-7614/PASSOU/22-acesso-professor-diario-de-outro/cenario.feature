#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do cargo Professor sem vínculo com a turma 3SER-M-2026 está autenticado

  Cenário: Negar ao Professor o boletim de diário que não é dele
    Dado que a regra de acesso do boletim é: T.I, Gestor, Super Administrador e Profissional imprimem na listagem de Diários e entrando em cada diário; o Professor imprime os diários que são dele; o Aluno imprime de acordo com a própria matrícula
    Quando acessar Diários e o diário de Biologia da 3SER-M-2026 pela URL e pedir a geração do boletim
    Então o professor não deve ver nem imprimir o boletim de um diário que não é dele

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. qa.restrito (Professor): a listagem ("Meus Diários") não traz o diário de Biologia; /diarios/3 → 403; POST /diarios/3/imprimir/boletim → 403.
  # Evidência: pen7614-22-acesso-professor-diario-de-outro.png
  # ---------------------------------------------------------------------------
