---
description: "Use when defining a new Lampiao feature or evolving an existing one. Produces product discovery with roadmap, hexagonal backend direction, Angular UX plan, API/contracts, data model, gamification, and validation criteria."
name: "Lampiao Feature Discovery"
argument-hint: "Descreva a feature desejada (problema, publico, contexto e objetivo)."
agent: "Lampiao Especialista"
---
Conduza um discovery completo da feature informada para o projeto Lampiao.

## Objetivo
Transformar uma ideia em uma proposta de implementacao clara, incremental e validavel, alinhada ao backend hexagonal e a UX em Angular.

## Entrada esperada
- Problema principal que queremos resolver
- Publico-alvo e contexto de uso
- Resultado esperado para usuario e negocio
- Restricoes (prazo, time, tecnologia, dados, compliance)

## Entregaveis obrigatorios
1. Resumo do problema e oportunidade
- Dor principal
- Hipotese de valor
- Personas impactadas

2. Solucao proposta (produto + tecnica + UX)
- Fluxo do usuario ponta a ponta
- Requisitos funcionais e nao funcionais
- Decisoes de UX: clareza, feedback, acessibilidade, responsividade
- Direcao visual sugerida com referencia ao Nordeste e ao lampiao como simbolo de luz e encontro para leitura

3. Arquitetura backend (hexagonal)
- Casos de uso envolvidos
- Portas de entrada/saida necessarias
- Adaptadores (HTTP, persistencia, servicos externos)
- Regras de dominio e validacoes
- Mapeamento de erros de dominio para HTTP

4. Frontend Angular
- Estrategia de paginas/componentes
- Estados obrigatorios (loading, erro, vazio, sucesso)
- Estrategia de formularios e validacao
- Criterios de acessibilidade e mobile-first

5. Dados e APIs
- Entidades e relacionamentos essenciais
- Endpoints principais (entrada/saida)
- Regras de autorizacao, moderacao e seguranca

6. Gamificacao e comunidade (quando aplicavel)
- Mecanica de engajamento sem dark patterns
- Curadoria comunitaria por confianca e qualidade
- Regras anti-abuso e protecao da comunidade

7. Plano incremental de execucao
- MVP (primeira entrega util)
- Iteracao 2
- Iteracao 3
- Riscos e trade-offs

8. Validacao
- Checklist tecnico (testes unitarios/integracao)
- Checklist de UX (clareza, feedback, acessibilidade, mobile)
- Metricas de sucesso (produto e engenharia)

## Regras de qualidade
- Priorize simplicidade com alto valor para usuario.
- Quando houver conflito, preserve arquitetura hexagonal no backend e experiencia do usuario no frontend.
- Explique decisoes com justificativas curtas e objetivas.
- Evite jargoes sem contexto.

## Formato de resposta
Responda em pt-BR e use secoes numeradas de 1 a 8, exatamente na ordem dos entregaveis obrigatorios.
