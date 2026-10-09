# Nexcell Smart Orçamento

Ferramenta de precificação e apresentação de orçamentos da NEXCELL. HTML, CSS e JavaScript puro, sem backend, banco de dados, login, APIs ou bibliotecas externas em produção. Não é um sistema financeiro e não mantém histórico de clientes ou serviços.

## Abrir e usar

1. Extraia o ZIP inteiro, preservando as pastas.
2. Abra `index.html` no computador ou publique os arquivos no GitHub Pages para acessar pelo celular.
3. Escolha o serviço, a marca e o modelo. Digite o custo da peça; informe **0** em serviços sem peça.
4. Identifique a qualidade da peça e adicione outras opções, se necessário.
5. Confira o preço automático, os resultados internos e a prévia. Use **Ajustar preço** para substituir o preço final sem arredondamento automático.
6. Preencha somente as condições que realmente oferece. A garantia só aparece quando a caixa de confirmação está marcada; editar seu texto remove essa confirmação.
7. Baixe o PNG/PDF, copie a mensagem ou abra **Compartilhar**.

A marca e o modelo são campos separados. Exemplo: marca `Apple`, modelo `iPhone 13`. As opções são alternativas do mesmo serviço; seus valores não são somados.

Os campos monetários aceitam `1234,56`, `1.234,56` e `1234.56`. Os custos individuais e preços manuais aceitam de R$ 0 a R$ 1.000.000,00. Não são aceitos negativos, valores não numéricos ou mais de duas casas decimais.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `nexcell-smart-orcamento`.
2. Envie **o conteúdo da pasta do projeto**, preservando `assets/`. O arquivo `index.html` deve ficar na raiz do repositório, e não dentro de outra pasta `nexcell-smart-orcamento`.
3. Em **Settings → Pages**, escolha **Deploy from a branch**.
4. Selecione a branch **main** e a pasta **/ (root)**. Clique em **Save**.
5. Aguarde a publicação e abra o endereço informado pelo GitHub.

Todos os caminhos são relativos e funcionam em um endereço com nome de repositório. Não há build nem servidor Node.js em produção. O arquivo `.nojekyll` desativa o processamento Jekyll. `tests/`, `tools/`, `package.json` e a documentação são opcionais na publicação; mantenha os demais arquivos.

“Uso interno” indica a finalidade da ferramenta: ela não tem autenticação. Uma publicação comum no GitHub Pages deixa o site e seus arquivos acessíveis publicamente, incluindo os valores originais da tabela no código. Os dados digitados para um cliente não são enviados a um servidor nem publicados.

Documentação oficial consultada:
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Cálculos

A tabela inicial contém os 11 serviços e valores informados no projeto. A opção **Serviço personalizado** permite informar um nome e uma mão de obra-base exclusivos daquele orçamento.

```text
soma = peça + mão de obra-base + transporte + materiais + reserva
preço calculado = soma / (1 - comissão)
preço sugerido = arredondar para cima ao múltiplo configurado
comissão = preço final × percentual de comissão
resultado antes do dízimo = preço final - peça - transporte - materiais - reserva - comissão
dízimo = máximo(0, resultado antes do dízimo) × percentual do dízimo
resultado após dízimo = resultado antes do dízimo - dízimo
```

A comissão só se aplica ao selecionar Instagram. Padrões: comissão 10%, dízimo 10%, arredondamento R$ 5. Um ajuste manual preserva exatamente o preço informado e recalcula os resultados. O alerta compara o resultado **antes** do dízimo à meta de mão de obra, conforme a fórmula solicitada.

Exemplo verificável: peça R$ 100, mão de obra R$ 40, transporte R$ 5, materiais R$ 3, reserva R$ 2, cliente Instagram. Preço calculado R$ 166,666..., sugerido R$ 170, comissão R$ 17, resultado anterior R$ 43, dízimo R$ 4,30 e resultado posterior R$ 38,70.

Os valores intermediários mantêm a precisão do JavaScript; a apresentação usa duas casas decimais. Pequenas diferenças de um centavo entre somas de valores já exibidos podem ocorrer com percentuais fracionários. O arredondamento do preço final usa proteção contra ruído de ponto flutuante em múltiplos exatos.

A reserva é uma provisão gerencial. O resultado após dízimo não é lucro líquido contábil completo. Transporte, materiais e reserva são aplicados separadamente a cada alternativa de peça.

## Arte, PNG, PDF e privacidade

- O gerador recebe apenas uma lista explícita de campos públicos: aparelho, serviço, cliente, opções, preços finais, contatos e condições informadas.
- Custo, mão de obra-base, comissão, dízimo, reserva e resultados internos não fazem parte desses dados.
- A arte é desenhada diretamente em Canvas com **1080 × 1920 pixels**. A prévia mostra esse mesmo Canvas em escala. Não se captura o formulário interno.
- Nome do cliente, descrição, validade, observações e garantia são omitidos quando ausentes. Nenhuma característica de peça, garantia, prazo ou disponibilidade é gerada automaticamente.
- A logo oficial anexada foi preservada integralmente em `assets/logo.jpeg`. `assets/logo-data.js` incorpora a mesma imagem para permitir exportações até ao abrir o HTML local, sem bloqueios de origem de imagem.
- Uma, duas e três opções simples cabem na mesma arte. Conteúdo maior é paginado conforme as medidas reais dos textos. Cada página continua com 1080 × 1920 px.
- Quando houver várias páginas, **BAIXAR IMAGEM** gera um ZIP com todos os PNGs. Extraia o ZIP antes de enviar as imagens.
- O PDF contém somente as artes públicas, em páginas verticais 9:16 de 405 × 720 pontos. As imagens são incorporadas como JPEG de alta qualidade; o texto do PDF não é selecionável. A mensagem de texto pode ser consultada e copiada na interface.
- Os limites de tamanho dos textos e a paginação protegem a legibilidade. Combinações extremas de textos podem exigir redução de conteúdo; nesse caso, um aviso bloqueia a exportação em vez de cortar silenciosamente.

Texto livre de observações e descrição é conteúdo comercial autorizado por quem o preenche. Não digite custos internos nesses campos.

## WhatsApp

**COPIAR MENSAGEM** usa a área de transferência do navegador. Se ela estiver indisponível, o sistema abre uma caixa com o texto selecionável.

**Compartilhar** prepara a imagem. Se o navegador oferecer compartilhamento de arquivos, aparece a opção de usar o compartilhamento do aparelho. Escolha o WhatsApp. Alguns aplicativos não aceitam imagem e legenda juntas; nesse caso, copie a mensagem separadamente.

Sem essa capacidade, o sistema oferece baixar a imagem e abrir `wa.me` com o texto preenchido. A imagem deve ser anexada manualmente. Não há envio automático, integração paga ou acesso a contatos. A abertura do WhatsApp depende de conexão e do aplicativo/navegador do aparelho.

No iPhone, a ação de baixar pode abrir a visualização do arquivo ou a opção de salvar em Arquivos, conforme o navegador. No WhatsApp, enviar o PNG como documento preserva melhor a resolução.

## Configurações e backup

Use **Configurações** para editar mão de obra, comissão, dízimo, arredondamento, transporte padrão, contatos, frase da marca e logo.

- As configurações são salvas em `localStorage`, na chave `nexcell.smart.settings.v1`.
- O transporte padrão é aplicado quando um novo formulário é carregado. Alterá-lo não sobrescreve o transporte já digitado no orçamento atual.
- A sessão não grava nome do cliente, aparelho, opções nem valores daquele orçamento. Recarregar a página limpa o orçamento.
- O armazenamento é específico de cada origem/navegador/perfil. Não sincroniza sozinho entre aparelhos. Navegação privada, limpeza de dados, quota ou restrições de armazenamento podem impedir a persistência; o sistema avisa.
- **Exportar JSON** gera um backup das configurações exibidas, incluindo a logo personalizada. **Importar JSON** valida o arquivo, mostra os valores e só os aplica quando você salva.
- **Restaurar originais** carrega os padrões no formulário de configurações. É preciso salvar para aplicar.
- Logos aceitas: PNG, JPEG e WebP, até 2 MB e 10.000 px em cada dimensão. Imagens com proporção diferente são encaixadas sem distorção.
- JSONs de até 3 MB; comissão 0–99%, dízimo 0–100%. Arredondamento: centavo, R$ 1, R$ 5, R$ 10, R$ 20 ou R$ 50.

## Organização

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Interface, formulários, diálogos e acessibilidade |
| `style.css` | Identidade visual e responsividade |
| `script.js` | Interações, estado temporário, configurações e compartilhamento |
| `core.js` | Cálculos, validação, dados públicos e mensagem |
| `export.js` | Composição da arte, PNG, PDF e ZIP sem bibliotecas |
| `assets/logo.jpeg` | Logo original, sem redesenho |
| `assets/logo-data.js` | Mesma logo incorporada para uso local |
| `tests/core.test.cjs` | Testes automatizados das regras |
| `tests/responsive.html` | Tela auxiliar de conferência de celular e tablet |
| `tools/preview.cjs` | Servidor opcional de desenvolvimento |
| `TESTES.md` | Resultados e limites da validação realizada |

## Desenvolvimento opcional

Nenhuma instalação é necessária para usar ou publicar o site. Se desejar desenvolver com Node.js instalado:

```bash
npm test
npm run dev
```

O servidor opcional abre a porta 4173; use `http://localhost:4173` no seu computador. Ele não é necessário para o GitHub Pages. `npm test` usa apenas o test runner nativo do Node.js (18 ou superior).

O código também registra, quando o navegador suporta, uma ferramenta WebMCP opcional de leitura do orçamento público. A falta desse suporte não altera o funcionamento normal. Essa integração experimental não foi validada em um ambiente WebMCP nativo.

Sem bibliotecas externas, rastreadores, fontes remotas ou downloads de dependências em produção. A única navegação externa funcional é o link do WhatsApp acionado pelo usuário.
