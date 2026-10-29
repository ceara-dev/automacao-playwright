#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Exibir as faltas de cada período
    Dado que existem faltas lançadas em aulas de um bimestre
    Quando o boletim for gerado
    Então devem ser apresentadas as faltas correspondentes a cada período

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. Biologia: aula de 01/09 no 1º Bimestre → Giovanna, Hemilly, Ingrid e Maria Eduarda com 1 falta na coluna "Faltas" do 1º Bim; demais 0. Períodos sem aula ficam em branco.
  # Evidência: pen7614-11-faltas-por-periodo.png
  # ---------------------------------------------------------------------------
