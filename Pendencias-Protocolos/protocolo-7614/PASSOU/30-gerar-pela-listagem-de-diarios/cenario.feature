#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário do tipo T.I está em Diários com a busca "9ANO"

  Cenário: Gerar o boletim pelo menu Imprimir da listagem de Diários
    Dado que o cartão do diário de Geografia da turma 9ANO-M-2026 está na listagem
    Quando acessar "Imprimir" no cartão e selecionar "Boletim de notas"
    Então o sistema deve abrir o mesmo diálogo e gerar o mesmo boletim da tela do diário

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # PASSOU. No cartão da listagem, "Imprimir › Boletim de notas" aponta para /diarios/5/imprimir/boletim e abre "Boletim de notas (31 alunos)". O PDF gerado (boletim-9ano-m-2026-2026.pdf, 5 páginas) tem conteúdo idêntico ao gerado pela tela do diário: mesmos alunos, notas e frequências; mudam só espaçamento e rodapé "Gerado por". Na lista de alunos do diálogo, a matrícula 187 aparece como "Aluno sem nome", sem "Chamada".
  # Evidência: pen7614-30-gerar-pela-listagem-de-diarios.png
  # ---------------------------------------------------------------------------
