# Ecopontos Belém

Aplicativo estático para educação ambiental e consulta ao Ecoponto municipal de Belém. Não exige backend nem chaves de API.

## Dados dos locais

A lista contém o Ecoponto da Sacramenta, cuja operação, dados e endereço são descritos pela Agência Belém, além de 13 locais que a Prefeitura listou para instalação de LEVs em anúncio de fevereiro de 2025. Esses LEVs aparecem explicitamente como pendentes: a presença atual, endereço exato, coordenadas, materiais e horários não foram confirmados. Eles não recebem marcadores no mapa nem são apresentados como unidades abertas. Não atribuí bairros ou coordenadas não publicados.

O endereço, horários, limite diário e materiais aceitos vêm das matérias oficiais vinculadas no app. O marcador usa a localização publicada no Google Maps, identificada separadamente como fonte cartográfica. Confirme as condições diretamente na fonte oficial antes de levar resíduos.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie estes arquivos para a branch `main` ou `master`.
2. Abra **Settings → Pages** e selecione **GitHub Actions** como fonte de publicação.
3. A workflow `.github/workflows/pages.yml` publica o site automaticamente a cada push na branch configurada. Também pode ser iniciada em **Actions → Deploy Ecopontos Belém to GitHub Pages → Run workflow**.
4. Aguarde a conclusão e abra a URL exibida pela workflow.

O app usa caminhos relativos, incluindo no manifesto e no service worker, portanto funciona tanto em domínio próprio quanto em URL de projeto (`usuario.github.io/nome-do-repositorio/`). A instalação PWA requer HTTPS; o GitHub Pages fornece HTTPS.

## Desenvolvimento local

Sirva a pasta em um servidor HTTP local para testar o service worker e a instalação PWA. Abrir `index.html` diretamente como arquivo não habilita esses recursos.

## Dependências e limitações

- Leaflet 1.9.4 e os tiles do OpenStreetMap são carregados da internet; o mapa não fica disponível offline. O conteúdo da página e os dados já carregados permanecem acessíveis.
- O cache offline guarda apenas o app shell e os dados locais, não tiles do mapa. Quando conectado, o arquivo de dados é renovado pela rede.
- Não há submissão de sugestões para a Prefeitura: rascunhos são armazenados somente no dispositivo.
- As sugestões comunitárias não são publicadas automaticamente.
