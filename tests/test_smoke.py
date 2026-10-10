from pathlib import Path

root = Path(__file__).resolve().parent.parent
required_files = [
    root / 'index.html',
    root / 'styles.css',
    root / 'manifest.webmanifest',
    root / 'sw.js',
    root / 'js' / 'data.js',
    root / 'js' / 'app.js',
    root / '.github' / 'workflows' / 'pages.yml',
    root / 'README.md',
]

for file in required_files:
    assert file.exists(), f'Missing required file: {file}'

html = (root / 'index.html').read_text(encoding='utf-8')
assert 'Ecopontos Belém' in html
assert 'quiz' in html.lower()
assert 'manifest.webmanifest' in html
assert 'leaflet' in html.lower()
assert 'Dados demonstrativos para protótipo inicial' not in html

manifest = (root / 'manifest.webmanifest').read_text(encoding='utf-8')
assert 'Ecopontos Belém' in manifest
assert 'standalone' in manifest

data = (root / 'js' / 'data.js').read_text(encoding='utf-8')
app = (root / 'js' / 'app.js').read_text(encoding='utf-8')
workflow = (root / '.github' / 'workflows' / 'pages.yml').read_text(encoding='utf-8')

assert "id: 'ecoponto-sacramenta'" in data
assert 'agencia.belem.pa.gov.br' in data
assert 'Centro de Reciclagem Paulista' not in data
assert 'LEV anunciado' in data
assert 'presença e funcionamento atuais não confirmados' in data
assert "materials: []" in data
assert 'normalizeText' in app
assert 'favoritesFilter' in app
assert 'sortFilter' in app
assert 'Buscar referência no Maps' in app
assert 'actions/deploy-pages' in workflow
assert 'path: .' in workflow

print('Smoke test passed: app, verified source data, advanced filters and Pages deployment are present.')
