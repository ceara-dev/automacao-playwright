#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do cargo Gestor está autenticado

  Cenário: Permitir ao Gestor imprimir pela listagem e pelo diário
    Dado que a regra de acesso do boletim é: T.I, Gestor, Super Administrador e Profissional imprimem na listagem de Diários e entrando em cada diário; o Professor imprime os diários que são dele; o Aluno imprime de acordo com a própria matrícula
    Quando acessar Diários (busca "3SER"), abrir "Imprimir" no cartão de Biologia e, depois, abrir o diário e acessar "Imprimir"
    Então a opção "Boletim de notas" deve estar disponível nos dois pontos
    E o boletim deve ser gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. qa.diretor.7614 (Gestor): listagem 200, item no cartão; diário 200, item no menu; geração 202.
  # Evidência: pen7614-18-acesso-gestor-listagem-e-diario.png
  # ---------------------------------------------------------------------------
