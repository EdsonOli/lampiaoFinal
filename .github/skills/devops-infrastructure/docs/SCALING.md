# Scaling Guide for Lampiao

## Overview

This guide covers horizontal scaling (more pods) and vertical scaling (more resources) strategies for Lampiao.

## Horizontal Scaling (Adding More Pods)

### Backend Scaling

```bash
# Manual scaling
kubectl scale deployment backend --replicas=5 -n lampiao-prod

# Check current status
kubectl get deployment backend -n lampiao-prod
kubectl get pods -n lampiao-prod -l component=backend
```

### Frontend Scaling

```bash
# Frontend is stateless, scales easily
kubectl scale deployment frontend --replicas=4 -n lampiao-prod
```

### Database Scaling (Read Replicas)

PostgreSQL doesn't scale horizontally like stateless services. Instead, use replicas:

```bash
# Primary database server (write operations)
# Read replica 1 (read operations)
# Read replica 2 (read operations, analytics)

# Setup replication in PostgreSQL
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -c "CREATE ROLE replica_user WITH REPLICATION LOGIN PASSWORD 'password';"
```

## Vertical Scaling (More Resources Per Pod)

### Increase CPU/Memory for Backend

```bash
# Edit deployment resource limits
kubectl edit deployment backend -n lampiao-prod

# Change:
# resources:
#   requests:
#     cpu: 100m → 500m
#     memory: 256Mi → 1Gi
#   limits:
#     cpu: 500m → 2000m
#     memory: 512Mi → 2Gi
```

Or patch directly:

```bash
kubectl set resources deployment backend \
  --requests=cpu=500m,memory=1Gi \
  --limits=cpu=2000m,memory=2Gi \
  -n lampiao-prod
```

### Increase Database Resources

```bash
# Database needs more resources directly
kubectl edit statefulset postgres -n lampiao-prod

# Modify:
# resources:
#   requests:
#     cpu: 250m → 1000m
#     memory: 512Mi → 4Gi
#   limits:
#     cpu: 1000m → 4000m
#     memory: 2Gi → 8Gi

# Restart pod to apply changes
kubectl restart statefulset postgres -n lampiao-prod
```

## Autoscaling (Automatic)

### Horizontal Pod Autoscaler (HPA)

Already configured in deployments:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Scale up when CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80  # Scale up when memory > 80%
```

Monitor autoscaling:

```bash
# Check HPA status
kubectl get hpa -n lampiao-prod
kubectl describe hpa backend-hpa -n lampiao-prod

# Watch scaling events
kubectl get hpa -w -n lampiao-prod
kubectl top pods -n lampiao-prod  # Check current resource usage
```

### Adjust Autoscaling Thresholds

```bash
# Edit HPA
kubectl edit hpa backend-hpa -n lampiao-prod

# Increase scale-up aggressiveness:
# averageUtilization: 70 → 50  (scale up faster)

# Increase max replicas:
# maxReplicas: 10 → 20
```

## Load Testing

### Generate Load to Test Scaling

```bash
# Using Apache Bench
ab -n 10000 -c 100 http://api.lampiao.com/

# Using wrk (better performance testing)
wrk -t12 -c400 -d30s --script=post.lua http://api.lampiao.com/

# Using k6 (real-time metrics)
k6 run load-test.js
```

Example k6 script:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m'  , target: 50 },  // Maintain
    { duration: '30s', target: 0 },   // Ramp down
  ],
};

export default function() {
  let response = http.get('https://api.lampiao.com/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

### Monitor During Load Test

```bash
# Terminal 1: Run load test
k6 run load-test.js

# Terminal 2: Watch pods scaling
kubectl get pods -w -n lampiao-prod

# Terminal 3: Monitor metrics
kubectl top pods -n lampiao-prod --watch
```

## Performance Bottlenecks

### Check What's Limiting Scaling

```bash
# Is it CPU?
kubectl top pods -n lampiao-prod
# If CPU is at 100% but memory is low → scale CPU vertically

# Is it Memory?
# If memory is at 100% but CPU is low → scale memory vertically

# Is it Database?
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Is it Network?
# Watch ingress/network metrics
kubectl logs -f deployment/backend -n lampiao-prod | grep "time\|duration"
```

### Database Query Optimization

```bash
# From backend container
kubectl exec -it backend-xxx -n lampiao-prod -- \
  psql -h postgres -U lampiao -d lampiao_db

# List slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

# Check index usage
SELECT * FROM pg_stat_user_indexes;

# Create missing indexes
CREATE INDEX idx_users_email ON users(email);
```

### Backend Optimization

```javascript
// Example: Batch database queries
// ❌ Slow: N+1 queries
const posts = await Post.findAll();
posts.forEach(async (post) => {
  post.comments = await Comment.findAll({ where: { postId: post.id } });
});

// ✅ Fast: Single query with join
const posts = await Post.findAll({
  include: [{ association: 'comments' }]
});
```

## Cost Optimization

### Reduce Unused Resources

```bash
# Remove unhealthy pods
kubectl delete pod <pod-name> -n lampiao-prod

# Reduce replicas when not needed
kubectl scale deployment backend --replicas=2 -n lampiao-prod

# Use scheduled scaling for predictable patterns
# Example: Scale down at night
0 22 * * * kubectl scale deployment backend --replicas=1 -n lampiao-prod
0 6  * * * kubectl scale deployment backend --replicas=3 -n lampiao-prod
```

### Node Scaling

If using managed Kubernetes (EKS, GKE, AKS):

```bash
# EKS: Scale node group
aws eks update-nodegroup-config \
  --cluster-name lampiao \
  --nodegroup-name default \
  --scaling-config minSize=2,maxSize=10,desiredSize=3

# GKE: Auto-scale node pool
gcloud container node-pools create default \
  --cluster=lampiao \
  --enable-autoscaling \
  --min-nodes=2 \
  --max-nodes=10

# AKS: Auto-scale node pool
az aks nodepool update \
  --resource-group lampiao \
  --cluster-name lampiao \
  --name nodepool1 \
  --enable-cluster-autoscaler \
  --min-count=2 \
  --max-count=10
```

## Scaling Strategy Recommendation

### For Lampiao Project

**Phase 1: Initial Launch (MVP)**
- Backend: 2 replicas
- Frontend: 2 replicas
- Database: 1 replica (with backups)
- Total pods: 5

**Phase 2: Growth (10k-100k users)**
- Backend: 4-8 replicas (HPA to 10)
- Frontend: 3-5 replicas (HPA to 8)
- Database: 1 primary + 2 read replicas
- Total pods: 12-18

**Phase 3: Scale (100k+ users)**
- Backend: 8-16 replicas (HPA to 20+)
- Frontend: 5-10 replicas (HPA to 15+)
- Database: 1 primary + 3-5 read replicas
- Multi-region deployment
- CDN for static assets
- Cache layer (Redis)

### Database Scaling

```yaml
# Recommended: Use managed database services
# Instead of running PostgreSQL in Kubernetes:

# AWS RDS for PostgreSQL
# GCP Cloud SQL
# Azure Database for PostgreSQL

# Benefits:
# - Automatic backups
# - Automatic failover
# - Point-in-time restore
# - Read replicas (free scaling)
# - Security, patches, monitoring built-in
```

## Metrics to Monitor

```bash
# Key metrics for scaling decisions

# Pod metrics
kubectl top pods -n lampiao-prod

# Node metrics
kubectl top nodes

# Persistent Volume usage
kubectl get pv
kubectl df-pv

# Network throughput
# Check ingress controller logs
kubectl logs -f -n ingress-nginx deployment/ingress-nginx-controller
```

## Troubleshooting Scaling Issues

### Pods stuck in Pending

```bash
# Not enough resources on nodes
kubectl describe pod <pod-name> -n lampiao-prod

# Solution: Add more nodes or reduce replicas
kubectl scale deployment backend --replicas=2 -n lampiao-prod
```

### Autoscaler not scaling

```bash
# Check HPA status
kubectl get hpa -n lampiao-prod
kubectl describe hpa backend-hpa -n lampiao-prod

# Check metrics server (required for HPA)
kubectl get deployment metrics-server -n kube-system

# If missing:
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Database connection pool exhausted

```bash
# Backend has limited database connections
# Check current connections:
kubectl exec -it postgres-0 -n lampiao-prod -- \
  psql -U lampiao -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool size in backend:
# DATABASE_POOL_MAX=50 (default: 20)
```

## References

- [Kubernetes HPA Documentation](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/warm-standby.html)
- [k6 Load Testing](https://k6.io/)
