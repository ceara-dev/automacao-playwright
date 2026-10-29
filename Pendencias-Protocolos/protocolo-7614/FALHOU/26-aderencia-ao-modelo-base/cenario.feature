#language: pt

@protocolo-7614
Funcionalidade: Boletim de notas da turma no Diário

  Contexto:
    Dado que o usuário autenticado está no Diário de uma turma (Diários › Abrir) com notas lançadas

  Cenário: Seguir o modelo base do layout (docs)
    Dado que o modelo base do boletim está em docs/protocolo 7614 (boletim_anual.md)
    Quando o usuário comparar o PDF com o modelo
    Então o cabeçalho deve trazer razão social, CNPJ e telefone formatado
    E o documento deve ter local/data e "Assinatura do Diretor"

  # ---------------------------------------------------------------------------
  # RESULTADO REAL (homologação, 01/10/2026 (reexecução após atualização do ambiente)):
  # FALHOU (parcialmente corrigido). Agora o PDF traz "Parnaíba - PI, ___ de ___ de ___" e "Assinatura do(a) Diretor(a)". Ainda faltam razão social ("Organização Educacional Apoio LTDA") e CNPJ, e o telefone segue "33238604" sem DDD/máscara (modelo: "(86) 3323-8604").
  # Evidência: pen7614-26-aderencia-ao-modelo-base.png
  # ---------------------------------------------------------------------------
