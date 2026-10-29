#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Manter o título da disciplina junto da tabela na quebra de página
    Dado que a tabela de uma disciplina continua na página seguinte
    Quando o usuário visualizar o PDF
    Então o título da disciplina não deve ficar sozinho no fim da página
    E a continuação deve repetir o nome da disciplina

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU (persiste). A continuação de uma tabela na página seguinte não repete o nome da disciplina: Filosofia continua na página 2 e Física na página 3 só com o cabeçalho de colunas. A página 6 começa com uma faixa vazia com duas linhas horizontais antes de "Sociologia".
  # Evidência: pen7614-24-quebra-de-pagina-titulo-da-disciplina.png
  # ---------------------------------------------------------------------------
