#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário "QA Professor 7614" (cargo Professor), titular do diário de Biologia das turmas QA-7614-A, B e V, está autenticado

  Cenário: Permitir ao Professor imprimir o boletim dos diários que são dele
    Dado que a regra de acesso do boletim é: T.I, Gestor, Super Administrador e Profissional imprimem na listagem de Diários e entrando em cada diário; o Professor imprime os diários que são dele; o Aluno imprime de acordo com a própria matrícula
    Quando o professor abrir Diários ("Meus Diários") e o seu diário e acessar "Imprimir"
    Então a opção "Boletim de notas" deve estar disponível para o seu diário
    E o boletim deve ser gerado

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 — professor de teste criado para o cenário):
  # PASSOU. "QA Professor 7614" (cargo Professor, login qa.professor.7614@caju.com.br; 1º acesso com e-mail + CPF e troca de senha obrigatória)
  # é titular de Biologia nas turmas de teste QA-7614-A, QA-7614-B e QA-7614-V.
  #  - Diários: lista só os 3 diários dele (61, 62 e 63);
  #  - Imprimir › "Boletim de notas" disponível no diário 61, diálogo "Boletim de notas (2 alunos)", PDF gerado ("Biologia — Professor(a): QA Professor 7614", "Gerado por: QA Professor 7614");
  #  - diário de outro professor (/diarios/3) e POST do boletim → 403.
  # Automação: e2e/protocolo7614/boletimMassaQA.spec.ts (cenário 21).
  # Evidência: pen7614-21-acesso-professor-titular-diario-proprio.png
  # ---------------------------------------------------------------------------
