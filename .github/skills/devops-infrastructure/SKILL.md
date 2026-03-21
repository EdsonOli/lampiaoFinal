---
name: devops-infrastructure
description: "Use when setting up containerization, orchestration, or deployment environments for Lampiao. Provides production-ready Docker, docker-compose, Kubernetes manifests, CI/CD pipelines, and secrets management templates tailored to the Lampiao stack (Node.js backend + Angular frontend + PostgreSQL)."
---

# DevOps Infrastructure Templates for Lampiao

Comprehensive, production-ready infrastructure-as-code templates for containerizing, orchestrating, and deploying the Lampiao application (backend API + Angular frontend + PostgreSQL database).

## What This Skill Provides

### 1. **Docker Templates**
- `Dockerfile.backend` — Multi-stage build for Node.js/TypeScript backend with production optimizations
- `Dockerfile.frontend` — Multi-stage build for Angular 21 SSR frontend
- `.dockerignore` — Optimized layer caching and build context

### 2. **Docker Compose**
- `docker-compose.yml` — Local development and staging setup
  - Backend service (Node.js + TypeScript)
  - Frontend service (Angular + SSR)
  - PostgreSQL database with volume persistence
  - Configurable networking and environment variables

### 3. **Kubernetes Manifests**
- `k8s-namespace.yaml` — Namespace isolation (staging/production)
- `k8s-backend-deployment.yaml` — Stateless backend deployment with health checks, resource limits, autoscaling
- `k8s-frontend-deployment.yaml` — Angular frontend deployment with CDN/ingress readiness
- `k8s-database-deployment.yaml` — PostgreSQL StatefulSet with persistent volumes
- `k8s-configmap.yaml` — Non-sensitive configuration (database host, API endpoint)
- `k8s-secret.yaml` — Template for sensitive data (DB password, JWT secret, Google OAuth keys)
- `k8s-service.yaml` — ClusterIP services for backend, frontend, database
- `k8s-ingress.yaml` — Ingress controller setup for HTTP/HTTPS routing
- `k8s-resource-quotas.yaml` — Namespace resource constraints and limits

### 4. **CI/CD Pipelines**
- `.github/workflows/build-and-deploy.yml` — GitHub Actions:
  - Build and push Docker images to registry
  - Run tests before deployment
  - Deploy to Kubernetes (staging/production)
  - Automated rollback on failure

### 5. **Secrets Management**
- Environment variable templates (backend, frontend, database)
- Kubernetes Secrets configuration
- Best practices for API keys, JWT secrets, Google OAuth credentials

### 6. **Documentation**
- Deployment guides (local, staging, production)
- Troubleshooting runbooks
- Scaling and monitoring setup

## When to Use

**Use this skill when:**
- Setting up Docker for local development or production
- Migrating Lampiao to Kubernetes (self-hosted or cloud)
- Configuring CI/CD pipelines with GitHub Actions
- Implementing secrets management and security hardening
- Documenting deployment procedures
- Scaling Lampiao backend and database

**Do NOT use this skill when:**
- Debugging application code (use backend-hexagonal or frontend-ux-priority instructions)
- Making database schema changes (coordinate with backend owner)
- Changing environment configuration without infrastructure context

## Quick Start

1. **Copy templates** from this skill folder to your project root
2. **Customize environment variables** in `.env` and Kubernetes secrets
3. **Build images locally**:
   ```bash
   docker build -f Dockerfile.backend -t lampiao-backend:latest .
   docker build -f Dockerfile.frontend -t lampiao-frontend:latest .
   ```
4. **Test with docker-compose**:
   ```bash
   docker-compose up -d
   ```
5. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f k8s-namespace.yaml
   kubectl apply -f k8s-*.yaml
   ```

## Template Structure

```
.github/skills/devops-infrastructure/
├── SKILL.md                          (this file)
├── dockerfiles/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── .dockerignore
├── docker-compose/
│   ├── docker-compose.yml
│   └── .env.example
├── kubernetes/
│   ├── k8s-namespace.yaml
│   ├── k8s-backend-deployment.yaml
│   ├── k8s-frontend-deployment.yaml
│   ├── k8s-database-deployment.yaml
│   ├── k8s-service.yaml
│   ├── k8s-ingress.yaml
│   ├── k8s-configmap.yaml
│   ├── k8s-secret-template.yaml
│   └── k8s-resource-quotas.yaml
├── ci-cd/
│   └── workflows/
│       └── build-and-deploy.yml
├── docs/
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── SCALING.md
│   └── SECURITY.md
└── examples/
    ├── .env.example
    ├── secrets-example.txt
    └── kustomization.yaml
```

## Customization Guide

### For Your Backend Stack:
- **Node.js 18+ LTS** (check package.json)
- **TypeScript** (ES2017 target, commonjs modules)
- **Express.js** framework
- **Sequelize ORM** with PostgreSQL
- **Port**: 3001 (default backend port)

### For Your Frontend Stack:
- **Angular 21** with SSR (Server-Side Rendering)
- **TypeScript** compilation
- **Port**: 4200 (development), 4000 (production SSR)

### For Database:
- **PostgreSQL** 14+ recommended
- **Sequelize migrations** (run on startup or separately)
- **Port**: 5432 (internal to cluster, not exposed)

## Security Considerations

✅ **Implemented in these templates:**
- Multi-stage Docker builds (smaller image size = smaller attack surface)
- Non-root user in containers
- Health checks for liveness/readiness
- Resource limits (prevent DoS)
- Network policies (restrict inter-service communication)
- Secrets management (not in code or images)
- RBAC in Kubernetes
- TLS/HTTPS via Ingress

⚠️ **YOU MUST CONFIGURE:**
1. Image registry credentials (Docker Hub, ECR, etc.)
2. Database password (use strong, random password)
3. JWT secret for authentication
4. Google OAuth credentials (if using)
5. Certificate for TLS/HTTPS
6. Network ingress rules (firewall)

## Common Workflows

### Local Development
```bash
docker-compose up -d          # Start all services
npm run db:migrate            # Run migrations
npm run dev                   # Backend dev server
ng serve                      # Frontend dev server
docker-compose logs -f        # Follow logs
```

### Staging Deployment
```bash
docker build -f Dockerfile.backend -t lampiao-backend:v1.0.0 .
docker push lampiao-backend:v1.0.0
kubectl set image deployment/backend backend=lampiao-backend:v1.0.0 -n staging
kubectl rollout status deployment/backend -n staging
```

### Production Deployment
```bash
# Using GitHub Actions (automatic on push to main)
# Or manual:
kubectl apply -f k8s-*.yaml -n production
kubectl rollout restart deployment/backend -n production
```

## Related Agents & Instructions

- **DevOps Specialist** — Main agent for infrastructure design and decisions
- **Hexagonal Backend Specialist** — For backend configuration and security
- **Lampiao Especialista** — For overall Lampiao roadmap and integration

---

For use with the **DevOps Specialist** agent. Invoke with:
```
/devops-specialist Setup Lampiao with Docker and Kubernetes using these templates
```
