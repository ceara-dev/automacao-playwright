#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário gera o boletim de turmas com circuitos diferentes (3SER-M-2026 e 9ANO-M-2026)

  Cenário: Montar as colunas dinamicamente conforme o Circuito de Notas
    Dado que os circuitos das turmas têm avaliações diferentes na Etapa Final
    Quando os boletins forem gerados
    Então para cada período letivo devem ser apresentadas as colunas correspondentes às avaliações configuradas no Circuito de Notas
    E as colunas das avaliações não devem possuir uma estrutura fixa
    E caso existam avaliações diferentes entre os períodos, o PDF deve respeitar a configuração correspondente de cada período

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Bimestres: AV1, AV2, REC, Média, Faltas; Semestres: REC, Média; Etapa Final: "N1, N2, Média" na 3ª Série (circuito 9) e só "N1, Média" no 9º Ano (circuito 6), conforme cada circuito. Coluna final "Freq. (%)".
  # Evidência: pen7614-09-colunas-dinamicas-por-circuito.png
  # ---------------------------------------------------------------------------
