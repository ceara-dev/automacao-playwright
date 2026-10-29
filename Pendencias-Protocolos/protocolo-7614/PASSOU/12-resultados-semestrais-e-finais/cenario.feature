#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Seguir as regras do circuito nos resultados semestrais e finais
    Dado que os bimestres têm notas e os semestres são compostos por eles
    Quando o boletim for gerado
    Então os resultados semestrais e finais devem seguir as regras já definidas no Circuito de Notas

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. 1º Semestre = composição do 1º e 2º Bim (ex.: 8,50), 2º Semestre = 3º e 4º Bim. Etapa Final da 3ª Série vazia: o circuito exige o instrumento obrigatório N2, ainda sem nota — mesmo comportamento da tela de notas. No 9º Ano (Etapa Final só com N1) a média final é exibida.
  # Evidência: pen7614-12-resultados-semestrais-e-finais.png
  # ---------------------------------------------------------------------------
