# Quick Start Guide for Lampiao DevOps

## What's in this skill?

Infrastructure-as-code templates for deploying Lampiao:

```
devops-infrastructure/
├── SKILL.md                           # Complete documentation
├── dockerfiles/                       # Container images
│   ├── Dockerfile.backend            # Node.js/TypeScript backend
│   ├── Dockerfile.frontend           # Angular SSR frontend
│   └── .dockerignore
├── docker-compose/                    # Local development
│   ├── docker-compose.yml
│   └── .env.example
├── kubernetes/                        # Production K8s manifests
│   ├── k8s-namespace.yaml
│   ├── k8s-backend-deployment.yaml
│   ├── k8s-frontend-deployment.yaml
│   ├── k8s-database-deployment.yaml
│   ├── k8s-service.yaml
│   ├── k8s-configmap-secret.yaml
│   └── k8s-ingress.yaml
├── ci-cd/                             # GitHub Actions
│   └── workflows/build-and-deploy.yml
├── docs/                              # Guides
│   ├── DEPLOYMENT.md
│   ├── TROUBLESHOOTING.md
│   └── SECURITY.md
└── examples/                          # Templates & examples
    ├── .env.production.example
    ├── kustomization.yaml
    └── secrets-template.txt
```

## Start Here

### 1️⃣ Local Development (5 min setup)

```bash
# Copy templates
cp docker-compose/docker-compose.yml .
cp docker-compose/.env.example .env

# Edit .env with your values
nano .env

# Start all services
docker-compose up -d

# Verify
docker-compose ps
```

Access applications:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

### 2️⃣ Production Deployment (30 min setup)

```bash
# 1. Create namespace
kubectl apply -f kubernetes/k8s-namespace.yaml

# 2. Create secrets (manually, not in Git!)
kubectl create secret generic lampiao-secrets \
  --from-literal=db.password='strong_password' \
  --from-literal=jwt.secret='random_secret' \
  -n lampiao-prod

# 3. Deploy application
kubectl apply -f kubernetes/k8s-configmap-secret.yaml
kubectl apply -f kubernetes/k8s-database-deployment.yaml
kubectl apply -f kubernetes/k8s-backend-deployment.yaml
kubectl apply -f kubernetes/k8s-frontend-deployment.yaml
kubectl apply -f kubernetes/k8s-service.yaml
kubectl apply -f kubernetes/k8s-ingress.yaml

# 4. Verify deployment
kubectl get pods -n lampiao-prod
```

### 3️⃣ Security (Critical ⚠️)

**NEVER commit secrets to Git:**
```bash
# ❌ Don't do this
git add .env  # Contains passwords!

# ✅ Do this instead
kubectl create secret generic lampiao-secrets --from-literal=...
```

Check [docs/SECURITY.md](./docs/SECURITY.md) for hardening steps.

## Key Commands

```bash
# Local development
docker-compose up -d                          # Start services
docker-compose logs -f                        # Follow logs
docker-compose down                           # Stop services

# Kubernetes - Deployment
kubectl apply -f kubernetes/*.yaml            # Deploy all
kubectl rollout restart deployment/backend    # Restart service
kubectl logs -f deployment/backend            # View logs
kubectl port-forward svc/backend 3001:3001    # Local access

# Kubernetes - Debugging
kubectl describe pod backend-xxx              # Debug pod
kubectl exec -it backend-xxx -- /bin/sh       # SSH into pod
kubectl get events -n lampiao-prod            # Check events
```

## Next Steps

1. **Review SKILL.md** — Full documentation
2. **Read DEPLOYMENT.md** — Step-by-step guides
3. **Check SECURITY.md** — Security hardening
4. **Setup CI/CD** — Copy workflows/build-and-deploy.yml to .github/workflows/
5. **Config Monitoring** — Add Prometheus/Grafana (not included in this skill)

## Need Help?

- **Troubleshooting**: See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Security questions**: See [docs/SECURITY.md](./docs/SECURITY.md)
- **DevOps Specialist agent**: Use in chat for architecture decisions

---

**Remember:** This is a template. Customize for your environment before production use!
