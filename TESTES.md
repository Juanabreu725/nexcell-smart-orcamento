# Verificação da entrega

## Testes executados

- **12 testes automatizados de regras passaram**, via `node --test tests/core.test.cjs`: tabela oficial, arredondamento, cliente direto, Instagram, preço manual, resultado negativo, configurações, entrada monetária, validação de backup, privacidade, múltiplas opções e nome de arquivo.
- Na revisão final, repetidos os testes de precificação e exportação. Serviço personalizado com custo zero, duplicação e remoção de opções verificados no navegador.
- Ajustado apenas o fluxo de linha do preço e botão: valores extensos permanecem dentro do cartão no celular. Verificado com preço acima de R$ 1 milhão, sem rolagem horizontal. O design, a identidade visual e a composição da arte foram preservados.
- Código JavaScript verificado com `node --check`.
- Em Chrome: preenchimento de serviço/aparelho/peça, cálculo direto, Instagram, ajuste manual abaixo da meta, nome do cliente presente/vazio, garantia confirmada/removida, adição e duplicação de opções, mensagem copiada e conferida na área de transferência.
- Em Chrome: edição de mão de obra e comissão, persistência após recarregar e importação de JSON válido para restaurar os padrões. Importação inválida também coberta pela validação automatizada.
- Compartilhamento sem Web Share: diálogo, orientação para anexar manualmente e URL do WhatsApp conferidos. Não foi enviada mensagem a terceiros.
- PNG real baixado pelo navegador e inspecionado: **1080 × 1920 pixels**, logo original, três opções, sem valores internos.
- Exportador executado separadamente com implementação nativa de Canvas para cenários com 1, 2, 3, 6 e 12 opções. Resultados: 1, 1, 1, 2 e 4 páginas, respectivamente. Textos longos geraram páginas adicionais. Coordenadas dos textos verificadas para evitar cortes.
- PDFs do exportador lidos por `pypdf`: tamanho 405 × 720 pontos, imagens 1080 × 1920, sem formulários, texto oculto ou dados internos. Uma página foi renderizada e inspecionada visualmente. O clique no botão PDF também foi exercitado no navegador; o ambiente de teste não concluiu a captura desse segundo download pelo canal automatizado.
- ZIP de várias páginas validado pelo leitor padrão Python, com CRC íntegro e todos os PNGs presentes.
- Interface examinada em largura de computador e em janelas incorporadas de 360 px e 768 px. A largura do conteúdo correspondeu à largura disponível, sem rolagem horizontal. Calculadora e botão de prévia exercitados na janela móvel.
- Caminhos relativos dos recursos conferidos, sem servidor/API de produção. Fonte de publicação conferida com a documentação oficial do GitHub Pages.

## Limites da validação

- Nenhum repositório ou URL de GitHub Pages foi publicado nesta entrega. O pacote está preparado para publicação, mas a validação do endereço final depende dessa etapa na sua conta.
- Teste de layout em largura móvel não substitui testes físicos em Android e iPhone. O compartilhamento nativo de arquivos, a escolha do WhatsApp na folha do sistema e o comportamento de download específico do Safari devem ser conferidos no aparelho.
- WebMCP é uma melhoria opcional e não foi validado em contexto nativo compatível.

## Conferência rápida no aparelho após publicar

1. Calcule uma troca de bateria com peça R$ 100, mão de obra-base R$ 40 e sem custos adicionais: cliente direto = R$ 140; Instagram = R$ 160.
2. Com Instagram, ajuste manualmente para R$ 130: comissão R$ 13; resultado anterior R$ 17; dízimo R$ 1,70; posterior R$ 15,30; aviso de meta insuficiente.
3. Adicione uma segunda opção, edite o custo e confirme que as alternativas têm preços independentes.
4. Baixe PNG e PDF, abra ambos e confira a leitura e a ausência dos custos internos.
5. Copie a mensagem. Use Compartilhar e anexe a imagem se o sistema não oferecer compartilhamento nativo.
6. Exporte as configurações, altere um valor, importe o backup e salve. Reabra a página e confira os padrões restaurados e a ausência dos dados anteriores do cliente.
