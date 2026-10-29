#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do cargo Super Administrador está autenticado

  Cenário: Permitir ao Super Administrador imprimir pela listagem e pelo diário
    Dado que a regra de acesso do boletim é: T.I, Gestor, Super Administrador e Profissional imprimem na listagem de Diários e entrando em cada diário; o Professor imprime os diários que são dele; o Aluno imprime de acordo com a própria matrícula
    Quando acessar Diários (busca "3SER"), abrir "Imprimir" no cartão de Biologia e, depois, abrir o diário e acessar "Imprimir"
    Então a opção "Boletim de notas" deve estar disponível nos dois pontos
    E o boletim deve ser gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. playwright (Super Administrador): listagem 200, item no cartão; diário 200, item no menu; geração 202.
  # Evidência: pen7614-19-acesso-super-admin-listagem-e-diario.png
  # ---------------------------------------------------------------------------
