---
description: "Use when styling Lampiao Angular UI with concrete design tokens, component patterns, visual states, and typography rules. Covers color semantics, spacing, buttons, cards, inputs, focus, and narrative consistency."
name: "Lampiao Frontend Design Tokens"
applyTo:
  - "frontend/src/**/*.css"
  - "frontend/src/**/*.html"
  - "frontend/src/**/*.ts"
---
# Lampiao Frontend: Tokens e Padroes de Interface

## Regra principal
- Toda implementacao visual deve usar tokens semanticos consistentes e componentes previsiveis, evitando estilos ad hoc por tela.

## Base visual atual
- Preserve e evolua a base quente ja existente no projeto (`paper`, `ink`, `brown`, `green`) antes de introduzir novas familias de cor.
- Se novos tokens forem adicionados, eles devem nascer como extensoes semanticas da identidade atual, nao como cores arbitrarias isoladas.

## Tokens de cor recomendados
Use nomes semanticos em vez de nomes puramente decorativos.

- `--color-bg-canvas`: fundo principal da aplicacao, inspirado em papel iluminado.
- `--color-bg-surface`: blocos, cards e containers secundarios.
- `--color-text-primary`: texto principal de leitura prolongada.
- `--color-text-secondary`: texto de apoio, metadata e contexto.
- `--color-brand-primary`: destaque principal do Lampiao, ligado a luz, acolhimento e chamada para acao.
- `--color-brand-secondary`: apoio de identidade para areas editoriais e navegacao.
- `--color-accent-community`: destaque para comunidade, participacao e descoberta.
- `--color-border-soft`: contornos discretos e separadores.
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info`: estados semanticamente consistentes.
- `--color-focus-ring`: foco visivel e acessivel para teclado.

## Direcao de paleta
- Fundo principal claro e quente para favorecer leitura.
- Texto principal com contraste alto e tom menos agressivo que preto puro quando possivel.
- Cor primaria deve ser acolhedora e memoravel, sem parecer promocional demais.
- Cor secundaria pode carregar profundidade, noite, mata, barro ou madeira, desde que mantenha legibilidade.
- Estados de sistema devem ser distinguiveis mesmo sem depender apenas de cor.

## Tipografia
- Mantenha coerencia tipografica entre marca, navegacao, conteudo e formularios.
- A tipografia atual pode continuar como assinatura visual em titulos e elementos de marca, desde que nao prejudique leitura extensa.
- Para texto corrido, descricoes longas e areas densas, prefira ritmo e conforto de leitura acima de personalidade excessiva.
- Defina e reutilize niveis claros de hierarquia: display, heading, title, body, caption e label.
- Evite reduzir demais corpo de texto, especialmente em mobile.

## Escala e espacamento
- Use escala consistente para padding, gap, margem e altura de componentes.
- Priorize ritmo vertical claro entre secoes, blocos de conteudo e acoes.
- Componentes interativos devem respeitar alvo de toque confortavel, com minimo pratico de 44px de altura.
- Evite densidade excessiva em listas, formularios e barras de navegacao.

## Padrao para botoes
- Defina pelo menos: primario, secundario, terciario e destrutivo.
- Botao primario deve destacar a principal acao da tela e aparecer com parcimonia.
- Botao secundario apoia fluxo sem competir com a CTA principal.
- Botao terciario deve ser discreto, util para acoes contextuais.
- Estados obrigatorios: default, hover, active, focus, disabled e loading.
- Disabled deve continuar legivel e semanticamente claro, sem parecer erro.

## Padrao para cards
- Cards devem parecer modulos editoriais ou espacos de encontro, nao caixas genericas de dashboard.
- Use elevacao, borda, textura ou contraste de superficie com moderacao.
- Cards precisam deixar evidente: titulo, contexto, conteudo principal e acao disponivel.
- Em grids, preserve alinhamento visual e altura suficientemente estavel para evitar ruido.

## Padrao para inputs e formularios
- Labels sempre visiveis e associados ao campo.
- Texto de ajuda e erro devem ser objetivos, humanos e acionaveis.
- Estados obrigatorios: default, focus, preenchido, erro, desabilitado e sucesso quando aplicavel.
- Campo em erro deve combinar cor, texto e iconografia quando necessario; nunca depender so da cor.
- Formulario deve parecer convite a participar, nao barreira burocratica.

## Estados visuais obrigatorios
- Loading: progresso perceptivel, sem travar toda a interface quando nao necessario.
- Empty: mensagem narrativa e util, com CTA clara.
- Error: explicar o problema em linguagem humana e sugerir proximo passo.
- Success: confirmar conclusao sem interromper o fluxo desnecessariamente.
- Focus: sempre visivel para navegacao por teclado.

## Iconografia e recursos graficos
- Icones devem apoiar compreensao rapida, nao substituir texto essencial.
- Prefira iconografia simples, calorosa e contemporanea.
- Ilustracoes e texturas devem reforcar o mundo do Lampiao sem virar excesso cenico.

## O que evitar
- Criar uma nova cor ou estilo local para cada feature.
- Botoes com aparencia inconsistente entre paginas.
- Inputs sem estados claros ou sem foco visivel.
- Cards sem hierarquia interna ou com informacao disputando atencao.
- Tipografia expressiva demais em blocos de leitura longa.

## Checklist de implementacao
- A tela reutiliza tokens semanticos em vez de valores soltos.
- CTA principal, texto e estados visuais ficam claros em poucos segundos.
- Componentes mantem consistencia entre paginas.
- Focus, erro, loading e empty state estao resolvidos.
- Leitura e toque continuam confortaveis em mobile.
