# Troubleshooting Guide for Lampiao Deployment

## Common Issues

### Docker Compose

#### Container fails to start

```bash
# Check logs
docker logs lampiao-backend
docker logs lampiao-postgres

# Check services status
docker ps -a

# Rebuild image
docker-compose build backend
docker-compose up -d backend
```

#### Database connection refused

```bash
# Verify database is running
docker exec lampiao-postgres pg_isready -U lampiao

# Check network connectivity
docker network ls
docker network inspect lampiao-network

# Restart postgres
docker-compose restart postgres
```

#### Port already in use

```bash
# Find process using port
lsof -i :3001
lsof -i :4200
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in .env
API_PORT=3002
```

### Kubernetes

#### Pod not starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n lampiao-prod

# Common reasons:
# - Image pull error: Check image registry credentials
# - CrashLoopBackOff: Check container logs
kubectl logs <pod-name> -n lampiao-prod --previous
```

#### Pending database migration

```bash
# The init container runs db:migrate before app starts
# If stuck, check logs:
kubectl logs <pod-name> -c migrate -n lampiao-prod

# Manually run migration
kubectl exec -it backend-xxx -n lampiao-prod -- npm run db:migrate
```

#### Readiness probe failing

```bash
# Backend needs /ready endpoint
# Frontend needs working SSR server

# Check logs
kubectl logs deployment/backend -n lampiao-prod

# Test endpoint
kubectl exec -it backend-xxx -n lampiao-prod -- \
  wget -O- http://localhost:3001/ready
```

#### Ingress not getting IP

```bash
# Install ingress controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace

# Check ingress status
kubectl get ingress -n lampiao-prod
kubectl describe ingress lampiao-ingress -n lampiao-prod
```

#### Certificate not issued

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate status
kubectl describe certificate lampiao-certificate -n lampiao-prod

# Manually request certificate
kubectl delete certificate lampiao-certificate -n lampiao-prod
kubectl apply -f k8s-ingress.yaml

# Check issuance events
kubectl get events -n lampiao-prod --sort-by='.lastTimestamp'
```

#### Database connection timeout

```bash
# Verify postgres pod is running
kubectl get pods -n lampiao-prod -l component=postgres

# Check postgres logs
kubectl logs postgres-0 -n lampiao-prod

# Verify configuration
kubectl get configmap lampiao-config -n lampiao-prod -o yaml

# Test connection from backend pod
kubectl exec -it backend-xxx -n lampiao-prod -- \
  psql -h postgres.lampiao-prod.svc.cluster.local -U lampiao -d lampiao_db -c "SELECT 1"
```

## Performance Issues

### High CPU Usage

```bash
# Check metrics
kubectl top pods -n lampiao-prod

# Find container with high CPU
kubectl top pod <pod-name> -n lampiao-prod --containers

# Increase resource limits
kubectl set resources deployment backend \
  --limits=cpu=1000m,memory=1Gi \
  --requests=cpu=250m,memory=512Mi \
  -n lampiao-prod

# Or increase replicas
kubectl scale deployment backend --replicas=5 -n lampiao-prod
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n lampiao-prod

# Increase memory limit
kubectl edit deployment backend -n lampiao-prod
# Update: spec.containers[0].resources.limits.memory = 1Gi

# Restart pod to apply
kubectl rollout restart deployment/backend -n lampiao-prod
```

### Slow API Responses

```bash
# Check backend logs for slow queries
kubectl logs deployment/backend -n lampiao-prod | grep "duration"

# Check database load
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -d lampiao_db -c "SELECT duration, query FROM pg_stat_statements ORDER BY duration DESC LIMIT 10;"

# Enable slow query logging
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -d lampiao_db -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
  
# Restart postgres
kubectl rollout restart statefulset/postgres -n lampiao-prod
```

## Network Issues

### Can't access application

```bash
# Check ingress
kubectl get ingress -n lampiao-prod
kubectl describe ingress lampiao-ingress -n lampiao-prod

# Check DNS
nslookup api.lampiao.com
nslookup lampiao.com

# Test connectivity
curl -v https://api.lampiao.com/health
curl -v https://lampiao.com/
```

### CORS errors

```bash
# Check frontend can reach backend
kubectl logs deployment/frontend -n lampiao-prod | grep "CORS\|origin"

# Verify CORS configuration in ConfigMap
kubectl get configmap lampiao-config -n lampiao-prod -o yaml

# Update if needed
kubectl set env deployment/backend \
  CORS_ORIGIN=https://lampiao.com \
  -n lampiao-prod
```

## Database Issues

### Database migrations failed

```bash
# Check migration logs
kubectl logs deployment/backend -c migrate -n lampiao-prod

# List applied migrations
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -d lampiao_db -c "SELECT * FROM SequelizeMeta ORDER BY name;"

# Manually run failed migration
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -d lampiao_db < migration-file.sql
```

### Data loss / Emergency restore

```bash
# List available backups
kubectl get pvc -n lampiao-prod

# Backup current database
kubectl exec -it postgres-0 -n lampiao-prod -- \
  pg_dump -U lampiao lampiao_db > current-backup.sql

# Restore from backup
kubectl exec -i postgres-0 -n lampiao-prod -- \
  psql -U lampiao lampiao_db < backup-2024-01-15.sql
```

## Rollback Procedures

### Rollback Application

```bash
# View rollout history
kubectl rollout history deployment/backend -n lampiao-prod

# Rollback to previous version
kubectl rollout undo deployment/backend -n lampiao-prod

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=3 -n lampiao-prod

# Check status
kubectl rollout status deployment/backend -n lampiao-prod
```

### Rollback Database

```bash
# Database doesn't automatically rollback
# Must manually restore from backup

kubectl exec -i postgres-0 -n lampiao-prod -- \
  psql -U lampiao -d lampiao_db < previous-backup.sql
```

## Getting Help

### Collect Debug Information

```bash
# Pod logs
kubectl logs deployment/backend -n lampiao-prod > backend.log
kubectl logs deployment/frontend -n lampiao-prod > frontend.log
kubectl logs -l component=postgres -n lampiao-prod > database.log

# Pod descriptions
kubectl describe pod -n lampiao-prod > pods-describe.txt
kubectl get events -n lampiao-prod > events.txt

# Configuration
kubectl get configmap lampiao-config -n lampiao-prod -o yaml > config.yaml
kubectl get secret lampiao-secrets -n lampiao-prod -o yaml > secrets-redacted.yaml  # Redact sensitive values

# Resources
kubectl top nodes > nodes-resources.txt
kubectl top pods -n lampiao-prod > pods-resources.txt
```

### Useful Commands

```bash
# Port forward for local testing
kubectl port-forward svc/backend 3001:3001 -n lampiao-prod
kubectl port-forward svc/postgres 5432:5432 -n lampiao-prod

# Execute command in pod
kubectl exec -it deployment/backend -n lampiao-prod -- /bin/sh

# Copy files to/from pod
kubectl cp lampiao-prod/backend-xxx:/app/logs.txt ./logs.txt
kubectl cp ./config.json lampiao-prod/backend-xxx:/app/config.json

# Stream logs from multiple pods
kubectl logs -f -l app=lampiao -n lampiao-prod
```
