# Deployment Guide for Lampiao

## Overview

This guide covers deploying Lampiao to different environments:
- **Local Development**: Docker Compose
- **Staging**: Kubernetes (cloud-ready)
- **Production**: Kubernetes with HA, backups, and monitoring

## Prerequisites

### For Local Development
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL (or run via Docker)

### For Kubernetes
- kubectl (v1.27+)
- Helm 3+
- Access to a Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl context configured for target cluster

### For Production
- Ingress controller (nginx-ingress recommended)
- cert-manager for TLS certificates
- Monitoring stack (Prometheus, Grafana)
- Backup storage (S3, Azure Blob, GCS)

## Local Development with Docker Compose

### 1. Setup

```bash
# Copy .env template
cp .github/skills/devops-infrastructure/docker-compose/.env.example .env

# Edit .env with your values
nano .env

# Build images
docker-compose -f .github/skills/devops-infrastructure/docker-compose/docker-compose.yml build
```

### 2. Start Services

```bash
docker-compose -f .github/skills/devops-infrastructure/docker-compose/docker-compose.yml up -d

# Verify services
docker-compose ps
```

### 3. Initialize Database

```bash
# Run migrations
docker exec lampiao-backend npm run db:migrate

# Seed initial data (optional)
docker exec lampiao-backend npm run db:seed:all
```

### 4. Access Applications

- Frontend: http://localhost:4200
- Backend API: http://localhost:3001
- Database: localhost:5432

### 5. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 6. Stop Services

```bash
docker-compose down

# Remove volumes too (careful!)
docker-compose down -v
```

## Kubernetes Deployment (Staging/Production)

### 1. Create Namespace

```bash
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-namespace.yaml
```

### 2. Create Secrets

⚠️ **DO NOT commit secrets to Git!** Create them manually:

```bash
# Create database password secret
kubectl create secret generic lampiao-secrets \
  --from-literal=db.password='your_strong_password_here' \
  --from-literal=jwt.secret='random_secret_key_here' \
  --from-literal=google.client.id='google_client_id' \
  --from-literal=google.client.secret='google_client_secret' \
  -n lampiao-prod

# Verify secret created
kubectl get secret lampiao-secrets -n lampiao-prod
```

### 3. Create ConfigMap

```bash
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-configmap-secret.yaml
```

### 4. Deploy Application Stack

```bash
# Deploy database (StatefulSet)
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-database-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=lampiao,component=postgres -n lampiao-prod --timeout=300s

# Deploy backend
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-backend-deployment.yaml

# Deploy frontend
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-frontend-deployment.yaml

# Deploy services
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-service.yaml
```

### 5. Setup Ingress (TLS)

```bash
# Install cert-manager (one-time)
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true

# Apply ingress
kubectl apply -f .github/skills/devops-infrastructure/kubernetes/k8s-ingress.yaml

# Check certificate status
kubectl get certificate -n lampiao-prod
kubectl describe certificate lampiao-certificate -n lampiao-prod
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n lampiao-prod

# Check services
kubectl get svc -n lampiao-prod

# Check ingress
kubectl get ingress -n lampiao-prod

# Describe ingress (get IP)
kubectl describe ingress lampiao-ingress -n lampiao-prod

# Check logs
kubectl logs -f deployment/backend -n lampiao-prod
kubectl logs -f deployment/frontend -n lampiao-prod
```

### 7. Configure DNS

Point your domain to the Ingress IP:

```bash
# Get Ingress IP
INGRESS_IP=$(kubectl get ingress lampiao-ingress -n lampiao-prod -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Point your domain to: $INGRESS_IP"

# Create DNS A records:
# lampiao.com → $INGRESS_IP
# api.lampiao.com → $INGRESS_IP
# www.lampiao.com → $INGRESS_IP
```

## Scaling

### Horizontal Scaling (more pods)

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n lampiao-prod

# Check autoscaling status
kubectl get hpa -n lampiao-prod
```

### Vertical Scaling (more resources per pod)

Edit deployment resource requests/limits:

```bash
kubectl edit deployment backend -n lampiao-prod
# Change resources.requests/limits values
```

## Monitoring Health

```bash
# Watch pod status
kubectl get pods -w -n lampiao-prod

# Check pod events
kubectl describe pod <pod-name> -n lampiao-prod

# Stream logs
kubectl logs -f Pod <pod-name> -n lampiao-prod

# Check resource usage
kubectl top pods -n lampiao-prod
```

## Updating Application

### Rolling Update

```bash
# New image is pushed to registry
# Deployment automatically uses new image (imagePullPolicy: Always)

# Trigger manual rollout
kubectl rollout restart deployment/backend -n lampiao-prod

# Check rollout status
kubectl rollout status deployment/backend -n lampiao-prod

# View rollout history
kubectl rollout history deployment/backend -n lampiao-prod
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/backend -n lampiao-prod

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n lampiao-prod
```

## Backup & Restore

### Backup Database

```bash
# Manual backup
kubectl exec -it postgres-0 -n lampiao-prod -- \
  pg_dump -U lampiao lampiao_db > backup.sql

# With compression
kubectl exec -it postgres-0 -n lampiao-prod -- \
  pg_dump -U lampiao lampiao_db | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From backup file
kubectl exec -i postgres-0 -n lampiao-prod -- \
  psql -U lampiao lampiao_db < backup.sql
```

## Security Checklist

- [ ] Secrets created manually (not in Git)
- [ ] TLS certificates valid and auto-renewing
- [ ] Network policies enabled
- [ ] Database password is strong (20+ chars, mixed)
- [ ] RBAC properly configured
- [ ] Image scanning for vulnerabilities enabled
- [ ] Resource limits set on all containers
- [ ] Health checks configured
- [ ] Backup strategy in place
- [ ] Audit logging enabled

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
