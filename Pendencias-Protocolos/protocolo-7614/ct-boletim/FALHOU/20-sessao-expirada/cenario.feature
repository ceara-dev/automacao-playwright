#language: pt

@protocolo-7614 @seguranca
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-020
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Geração do boletim com sessão expirada
    Dado que o usuário "qa.ti.7614" está no Diário da turma "3SER-M-2026"
    E que sua sessão expirou
    Quando selecionar "Imprimir" e "Boletim de notas"
    Então o sistema deve redirecionar para a tela de login
    E nenhum PDF deve ser gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # FALHOU (redirecionamento). Com os cookies apagados, o POST da geração retorna 401 e nenhum PDF é gerado (correto).
  # Porém a tela NÃO vai para o login: fica no Diário com o diálogo "Não deu certo — Sua sessão expirou. Entre novamente para gerar o documento." e os botões "Tentar novamente" e "Fechar".
  # Evidência: pen7614-20-sessao-expirada.png
  # ---------------------------------------------------------------------------
