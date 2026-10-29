#language: pt

@protocolo-7614 @seguranca
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-019
  Contexto:
    Dado que a escola "QA-Escola 7614" foi criada para o teste
    E que o usuário "QA T.I Restrito 7614" (cargo T.I) tem como "Escolas Permitidas" somente "QA-Escola 7614"

  Cenário: Usuário T.I sem permissão na turma não gera o boletim
    Dado que o usuário "qa.tirestr.7614" do tipo "T.I" está autenticado
    Mas não possui permissão para visualizar os dados da turma "3SER-M-2026" (escola "Colégio Apoio")
    Quando tentar gerar o boletim de notas da turma "3SER-M-2026"
    Então o sistema deve exibir a mensagem "Acesso não permitido"
    E nenhum dado da turma deve ser exposto

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — massa QA criada para o teste):
  # FALHOU (Alta). A listagem de Diários vem vazia, o que está correto. Porém:
  #  - /diarios/3 (Biologia · 3SER-M-2026, do Colégio Apoio) responde 200 (componente DiarioPlaceholder);
  #  - POST /diarios/3/imprimir/boletim responde 202 e o documento fica "pronto";
  #  - o PDF baixado traz a turma inteira do Colégio Apoio (alunos, notas e frequência), com "Gerado por: QA T.I Restrito 7614".
  # A restrição por escola (Escolas Permitidas) não é aplicada na geração do boletim: dados de outra escola ficam expostos.
  # Evidência: pen7614-19-ti-sem-permissao-na-turma.png (PDF gerado pelo T.I restrito)
  # ---------------------------------------------------------------------------
