---
description: "Use when building or changing Lampiao frontend screens (Angular), including pages, components, forms, routing, and styling. Prioritizes user experience, accessibility, feedback clarity, and responsive behavior."
name: "Lampiao Frontend UX Priority"
applyTo:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.html"
  - "frontend/src/**/*.css"
---
# Lampiao Frontend: UX Primeiro

## Regra principal
- Em toda mudanca de frontend, priorize a experiencia do usuario acima de preferencias tecnicas locais.

## Diretrizes obrigatorias
- Garanta clareza de fluxo: o usuario deve entender rapidamente o que fazer, onde esta e o que acontece apos cada acao.
- Forneca feedback imediato para estados importantes: carregando, sucesso, erro, vazio e indisponibilidade.
- Minimize friccao em formularios: labels claros, validacao amigavel, mensagens objetivas e foco no proximo passo.
- Preserve acessibilidade basica: hierarquia semantica, contraste suficiente, navegacao por teclado e textos acionaveis.
- Mantenha responsividade real para mobile e desktop, sem quebrar navegacao, leitura ou toque.
- Em decisoes de UI, prefira consistencia com padroes do app e previsibilidade para o usuario.
- Priorize legibilidade de conteudo e CTA principal acima de densidade visual ou excesso de elementos.
- Reduza carga cognitiva: uma decisao principal por secao, textos curtos e ordem de informacao do mais importante para o complementar.
- Garanta estados de componente com comportamento estavel (disabled, loading, sucesso, erro) para evitar cliques duplicados e incerteza.
- Planeje tratamento de erro orientado a acao: explicar problema em linguagem humana e proximo passo recomendado.
- Preserve performance percebida (render inicial rapido, skeleton/spinner quando necessario, evitar bloqueio completo da tela sem motivo).

## Checklist de implementacao
- Tela deixa claro objetivo e CTA principal.
- Estados de loading/erro/vazio tratados no componente.
- Mensagens e textos orientam acao (evitar mensagens genericas).
- Fluxo principal testado em viewport mobile e desktop.
- Interacoes criticas funcionam sem ambiguidade.
- Navegacao por teclado e foco visual conferidos em elementos interativos.
- Formulario possui validacao em tempo apropriado (sem agressividade precoce) e mensagens por campo.
- Acoes destrutivas possuem confirmacao clara e reversao quando aplicavel.
- Componentes e paginas evitam jank visual em mudanca de estado (layout estavel).

## O que evitar
- UI sem retorno visual apos acao do usuario.
- Fluxos confusos com muitos passos sem orientacao.
- Mensagens tecnicas para erros de negocio.
- Decisoes visuais que prejudiquem legibilidade ou toque em telas pequenas.
- Dependencia exclusiva de cor para comunicar status/erro/sucesso.
- Bloquear o usuario com modais desnecessarios em fluxos frequentes.
