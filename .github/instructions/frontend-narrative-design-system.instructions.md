---
description: "Use when designing or changing Lampiao visual UI in Angular, including colors, typography, layout tone, component styling, and narrative branding. Covers Nordeste references, lampiao-as-light metaphors, and a reader-centered design system."
name: "Lampiao Narrative Design System"
applyTo:
  - "frontend/src/**/*.html"
  - "frontend/src/**/*.css"
  - "frontend/src/**/*.ts"
---
# Lampiao Frontend: Design System Narrativo

## Regra principal
- Toda decisao visual deve fortalecer a identidade do Lampiao como plataforma de leitura, encontro e criacao coletiva, sem sacrificar clareza, acessibilidade ou usabilidade.

## Direcao conceitual
- Trate o lampiao como simbolo de luz, acolhimento, reuniao, descoberta e leitura compartilhada.
- Valorize referencias ao Nordeste com respeito e intencao: calor, textura, oralidade, encontro, territorio, arte grafica e materialidade.
- Evite folclorizacao, caricatura ou excesso cenografico. A referencia cultural deve enriquecer a experiencia, nao virar fantasia superficial.

## Cores
- Priorize uma paleta quente e humana, com base em luz, terra, papel, barro, cobre, madeira, noite e brasa.
- Use cores de destaque para guiar atencao e hierarquia, nao apenas decoracao.
- Garanta contraste suficiente em texto, estado de foco, feedback de erro/sucesso e elementos interativos.
- Mantenha semantica clara de cor: acoes primarias, estados, alerta e informacao devem ser reconheciveis rapidamente.
- Evite interfaces frias, genericas ou com saturacao excessiva que prejudiquem leitura longa.

## Tipografia
- A tipografia deve comunicar leitura, repertorio cultural e personalidade editorial.
- Prefira combinacoes com uma fonte de titulo expressiva e uma fonte de leitura altamente legivel no corpo.
- Preserve ritmo de leitura: escala tipografica consistente, espacamento generoso e largura de linha confortavel.
- Titulos podem carregar mais personalidade; texto corrido, labels e formularios devem priorizar legibilidade imediata.
- Evite fontes decorativas dificeis de ler ou excesso de variacao tipografica entre componentes.

## Metaforas visuais
- Recorra a referencias de luz, pagina, margem, caderno, anotacao, roda de conversa, trilha e capitulo.
- Componentes podem sugerir descoberta, camadas de leitura e comunidade, mas sem poluicao visual.
- Use texturas, gradientes, molduras, blocos editoriais e ritmos visuais de forma moderada e funcional.
- A interface deve parecer um lugar onde leitores se encontram para pensar, comentar e criar juntos.

## Componentes e layout
- Estruture telas com hierarquia editorial clara: titulo, contexto, conteudo principal, acoes e aprofundamento.
- CTA principal deve receber destaque visual coerente com a narrativa de convite, participacao ou descoberta.
- Cards, listas e secoes devem favorecer leitura escaneavel e comparacao simples entre itens.
- Estados vazios devem ser narrativos e uteis: orientar acao, sugerir proximo passo e reforcar pertencimento.
- Use espaco em branco como recurso de respiracao e foco, nao como area residual.

## Regras de UX integradas ao visual
- A identidade visual nunca pode competir com a compreensao do fluxo.
- Cada tela deve deixar evidente: onde estou, o que posso fazer agora e qual o proximo passo.
- Feedbacks visuais de loading, sucesso, erro e desabilitado devem ser consistentes com a paleta e semanticamente claros.
- Em mobile, preserve leitura, toque confortavel e ordem de informacao antes de adicionar ornamentos.

## O que evitar
- Visual generico de dashboard sem identidade literaria.
- Excesso de ornamento regional sem funcao de interface.
- Contraste baixo, texto sobre fundo ruidoso ou decoracao que comprometa leitura.
- Mistura aleatoria de estilos que quebre consistencia entre paginas.
- Metaforas visuais que parecam tema de festa em vez de plataforma cultural contemporanea.

## Checklist de implementacao
- A tela comunica leitura, encontro e descoberta sem perder objetividade.
- Paleta e contraste sustentam leitura prolongada e acessibilidade.
- Tipografia diferencia personalidade editorial de legibilidade funcional.
- CTA principal e hierarquia visual sao reconheciveis em poucos segundos.
- Metaforas narrativas estao presentes com moderacao e coerencia.
- Layout funciona bem em mobile e desktop.
