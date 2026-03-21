# Security Hardening Guide for Lampiao

## Overview

This guide covers securing Lampiao infrastructure, data, and secrets.

## Secrets Management

### Use Kubernetes Secrets (not ConfigMap)

```bash
# ❌ DON'T: Store in ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: config
data:
  DB_PASSWORD: "password123"  # EXPOSED!

# ✅ DO: Use Secret
apiVersion: v1
kind: Secret
metadata:
  name: lampiao-secrets
type: Opaque
data:
  db.password: cGFzc3dvcmQxMjM=  # base64 encoded
```

### Create Secrets Manually (off-cluster)

```bash
# Never commit secrets to Git!

# Option 1: kubectl create secret
kubectl create secret generic lampiao-secrets \
  --from-literal=db.password='...' \
  --from-literal=jwt.secret='...' \
  -n lampiao-prod

# Option 2: External Secrets Operator (recommended for automation)
# https://external-secrets.io/

# Option 3: HashiCorp Vault
# For high-security environments
```

### Rotate Secrets Regularly

```bash
# Generate new secret
kubectl create secret generic lampiao-secrets-new \
  --from-literal=db.password='new_password_here' \
  --from-literal=jwt.secret='new_secret_here' \
  -n lampiao-prod

# Update deployments to use new secret
kubectl patch deployment backend -n lampiao-prod \
  --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/env/?name=DB_PASSWORD/valueFrom/secretKeyRef/name", "value":"lampiao-secrets-new"}]'

# After verification, delete old secret
kubectl delete secret lampiao-secrets -n lampiao-prod
kubectl patch secret lampiao-secrets-new -p '{"metadata":{"name":"lampiao-secrets"}}' -n lampiao-prod
```

## Database Security

### Strong Passwords

```bash
# Generate strong password (20+ chars, mixed case, numbers, symbols)
openssl rand -base64 32

# Example:
# aB3cDeFgHiJkLmNoPqRsTuVwXyZ+/0=
```

### Limit Database Permissions

```sql
-- Create dedicated database user (not superuser)
CREATE USER lampiao_app WITH PASSWORD 'password_here';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE lampiao_db TO lampiao_app;
GRANT USAGE ON SCHEMA public TO lampiao_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lampiao_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO lampiao_app;

-- Don't grant:
-- - CREATE (prevent dropping tables)
-- - DROP (prevent dropping tables)
-- - ALTER (prevent schema changes)
```

### Database Encryption

```bash
# At-rest encryption (PostgreSQL)
# 1. Enable SSL/TLS for connections
# 2. Enable full-disk encryption at storage level

# In-transit encryption (TLS)
kubernetes:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_INITDB_ARGS: "-c ssl=on"
```

### Backup Security

```bash
# Backup encryption
pg_dump -U lampiao lampiao_db | \
  openssl enc -aes-256-cbc -salt > backup.sql.enc

# Restore from encrypted backup
openssl enc -d -aes-256-cbc -in backup.sql.enc | \
  psql -U lampiao -d lampiao_db

# Backup retention policy
# - Keep 30 daily backups
# - Keep 12 monthly backups
# - Store offsite (AWS S3, Azure Blob, GCS)
```

## Application Security

### Environment Variables

```bash
# ✅ Good: Use secrets for sensitive data
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: lampiao-secrets
        key: db.password
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: lampiao-secrets
        key: jwt.secret

# ❌ Bad: Hardcoded values
env:
  - name: DB_PASSWORD
    value: "secret"
```

### TLS/HTTPS

```bash
# Self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Production: Use Let's Encrypt (free, automatic)
# Configured in k8s-ingress.yaml with cert-manager
```

### Authentication

```bash
# JWT Best Practices:
# 1. Use strong secret (20+ chars)
# 2. Use HS256 or RS256 algorithm
# 3. Set reasonable expiration (15-60 min)
# 4. Refresh tokens must be HTTPOnly cookies

# Example:
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '15m' }
);
```

### Rate Limiting

```yaml
# Configured in k8s-ingress.yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-connections: "10"
    nginx.ingress.kubernetes.io/limit-rps: "100"
```

## Network Security

### Network Policies

```yaml
# Restrict traffic between pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: lampiao-network-policy
  namespace: lampiao-prod
spec:
  podSelector:
    matchLabels:
      app: lampiao
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Allow only from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
  egress:
    # Allow DNS and database
    - ports:
        - protocol: UDP
          port: 53  # DNS
        - protocol: TCP
          port: 5432  # PostgreSQL
```

### Least Privilege

```yaml
# Run containers as non-root user
securityContext:
  runAsNonRoot: true
  runAsUser: 1001  # Not 0 (root)
  readOnlyRootFilesystem: true  # If possible
  capabilities:
    drop:
      - ALL  # Drop all Linux capabilities
```

### Service Mesh (Optional)

For advanced security, use a service mesh like Istio:

```bash
# Mutual TLS (mTLS) between services
# Service-to-service authentication
# Authorization policies
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm install istio-base istio/base -n istio-system --create-namespace
```

## API Security

### CORS Configuration

```bash
# Only allow trusted origins
CORS_ORIGIN=https://lampiao.com
# Not: "*" (all origins)
```

### Security Headers

```yaml
# Configured in k8s-ingress.yaml
nginx.ingress.kubernetes.io/configuration-snippet: |
  more_set_headers "X-Frame-Options: SAMEORIGIN";
  more_set_headers "X-Content-Type-Options: nosniff";
  more_set_headers "X-XSS-Protection: 1; mode=block";
  more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains";
  more_set_headers "Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'";
  more_set_headers "Referrer-Policy: strict-origin-when-cross-origin";
```

### API Rate Limiting

```typescript
// Backend middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use(limiter);
```

## Monitoring & Auditing

### Audit Logging

```bash
# Enable Kubernetes audit logging
# Log all API requests and changes
```

### Intrusion Detection

```bash
# Monitor for suspicious activity
# Use network monitoring tools:
# - Falco (runtime security)
# - OPA/Gatekeeper (policy enforcement)
# - Wazuh (threat detection)
```

### Vulnerability Scanning

```bash
# Scan Docker images for CVEs
trivy image lampiao-backend:latest
trivy image lampiao-frontend:latest

# In CI/CD pipeline
# Fail build if critical vulnerabilities found
```

## Compliance Checklist

- [ ] All secrets stored in Kubernetes Secrets, not ConfigMap
- [ ] Database has strong password (20+ chars)
- [ ] Database user has least privilege (no CREATE/DROP/ALTER)
- [ ] TLS/HTTPS enabled for all external traffic
- [ ] Network policies restrict pod-to-pod communication
- [ ] Containers run as non-root user
- [ ] Security headers configured in ingress
- [ ] Rate limiting enabled
- [ ] API authentication (JWT) properly implemented
- [ ] Backups encrypted and stored offsite
- [ ] Audit logging enabled
- [ ] Vulnerability scanning in CI/CD
- [ ] Secrets rotated quarterly
- [ ] Data access logs reviewed regularly
- [ ] PII (Personal Identifying Information) encrypted at rest
- [ ] GDPR/compliance requirements met (if applicable)

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
