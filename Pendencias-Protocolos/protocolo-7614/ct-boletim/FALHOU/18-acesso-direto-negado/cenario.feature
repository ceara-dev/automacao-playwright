#language: pt

@protocolo-7614 @seguranca
Funcionalidade: Boletim de notas da turma no Diário
  Como usuário do tipo T.I, Gestor, Super Administrador, Profissional, Professor ou Aluno
  Quero gerar o boletim de notas da turma em PDF
  Para acompanhar as notas, médias e faltas da turma conforme o Circuito de Notas

  # CT-BOLETIM-018
  Contexto:
    Dado que a escola "Colégio Apoio" possui a turma "3SER-M-2026 — 3º Série" no ano letivo "2026"
    E que a turma "3SER-M-2026" utiliza o Circuito de Notas 9 ("Sistema de Notas": 4 bimestres, 2 semestres e Etapa Final)

  Cenário: Usuário sem vínculo não gera o boletim por acesso direto
    Dado que o usuário "qa.restrito" do tipo "Professor", que não é titular do Diário de Biologia da 3SER-M-2026, está autenticado
    Quando requisitar diretamente a geração do boletim de notas da turma "3SER-M-2026" por URL ou endpoint
    Então o sistema deve negar a requisição
    E exibir a mensagem "Acesso não permitido"
    E nenhum PDF deve ser gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026):
  # FALHOU (só a mensagem). POST /diarios/3/imprimir/boletim → 403 e /diarios/3 → 403: a geração é negada e nenhum PDF é gerado.
  # A mensagem exibida é "Acesso Negado — Você não tem permissão para acessar esta página.", e não "Acesso não permitido".
  # Evidência: pen7614-18-acesso-direto-negado.png
  # ---------------------------------------------------------------------------
