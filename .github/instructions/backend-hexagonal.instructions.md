---
description: "Use when implementing backend features in Lampiao API (Node.js/TypeScript), especially endpoints, services, repositories, domain rules, or refactors. Enforces hexagonal architecture with clear domain/application/infrastructure boundaries."
name: "Lampiao Backend Hexagonal"
applyTo:
  - "backend/src/**/*.ts"
  - "backend/src/**/*.js"
  - "backend/migrations/**/*.js"
---
# Lampiao Backend: Arquitetura Hexagonal

## Regra principal
- Toda mudanca no backend deve preservar e reforcar a arquitetura hexagonal.

## Diretrizes obrigatorias
- Coloque regras de negocio no nucleo (`core/domain` e `core/usecases`), sem dependencia de framework, ORM, HTTP ou detalhes de infraestrutura.
- Defina contratos no nivel de portas (`core/ports`) e implemente adaptadores concretos apenas em `adapters/*`.
- Trate controllers, rotas, middlewares e models Sequelize como detalhes de borda. Eles nao podem conter regra de negocio.
- Injete dependencias via interfaces/portas. Evite acoplamento direto de use cases com repositorios concretos.
- Mantenha fluxo de dependencia apontando para dentro: `adapters -> core`, nunca `core -> adapters`.
- Ao criar funcionalidade nova, prefira primeiro modelar caso de uso e contrato, depois conectar no adapter HTTP e persistencia.
- Padronize DTOs de entrada/saida nos adapters para evitar vazar entidades de dominio diretamente pela API.
- Centralize validacoes de regra no dominio/caso de uso; use validacoes no adapter apenas para formato e contrato de entrada.
- Mantenha transacoes e concerns de persistencia no adapter de repositorio, nao no caso de uso.
- Trate erros de dominio com tipos/erros semanticos no core e mapeie para HTTP no adapter (ex.: 400, 404, 409).
- Garanta que autenticacao/autorizacao no adapter apenas orquestre acesso e delegue regras de permissao ao caso de uso quando for regra de negocio.

## Checklist de implementacao
- Caso de uso criado/ajustado em `core/usecases`.
- Porta de entrada/saida declarada em `core/ports` quando necessario.
- Adapter de infraestrutura implementado em `adapters/repositories` ou `adapters/services`.
- Endpoint apenas orquestra entrada/saida e delega ao caso de uso.
- Testes de caso de uso cobrem regras centrais sem depender de banco real.
- Testes de integracao cobrem a ligacao endpoint -> use case -> repositorio para caminhos criticos.
- Nomes e contratos de portas deixam explicito o objetivo de negocio (evitar nomes genericos).
- Use case possui uma unica responsabilidade e comportamento previsivel.

## O que evitar
- Regra de negocio dentro de `routes`, `middlewares`, `models` ou migrations.
- Acesso direto a Sequelize dentro de `core/*`.
- Logica duplicada entre controller e use case.
- Dependencia circular entre modulos do core e adapters.
- Retornar objetos de infraestrutura (model Sequelize) para camadas de dominio.
