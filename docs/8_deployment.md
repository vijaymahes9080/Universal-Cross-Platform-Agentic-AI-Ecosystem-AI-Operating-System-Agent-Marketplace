# U-AIX OS Deployment Specification

This document provides the production-ready YAML templates for self-hosting U-AIX OS using **Docker Compose** and deploying to **Kubernetes** clusters.

---

## 1. Local Docker Compose Stack (`docker-compose.yml`)

The docker-compose setup configures three services: Ollama LLM node with GPU acceleration, U-AIX backend daemon runner, and Nginx frontend dashboard host.

```yaml
version: '3.8'

services:
  # 1. Ollama local LLM server with GPU support
  ollama:
    image: ollama/ollama:latest
    container_name: uaix-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_storage:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped

  # 2. U-AIX background daemon agent orchestrator
  uaix-daemon:
    image: uaix/daemon:v1.0.0
    container_name: uaix-daemon
    ports:
      - "5000:5000"
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - DATABASE_URL=sqlite:////data/uaix_local.db
      - SECURITY_SANDBOX=WASM
    volumes:
      - daemon_data:/data
    depends_on:
      - ollama
    restart: unless-stopped

  # 3. Static Nginx dashboard host
  dashboard:
    image: nginx:alpine
    container_name: uaix-dashboard
    ports:
      - "8000:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - uaix-daemon
    restart: unless-stopped

volumes:
  ollama_storage:
  daemon_data:
```

---

## 2. Kubernetes Multi-User Cluster Deployment

Use these manifest configurations to deploy U-AIX OS inside container orchestrators:

### ConfigMap Configuration (`uaix-configmap.yaml`)
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: uaix-env-config
  namespace: uaix-system
data:
  OLLAMA_HOST: "http://ollama-service:11434"
  DB_PATH: "/data/local_storage.db"
  ENVIRONMENT: "production"
```

### PersistentVolumeClaim Configuration (`uaix-pvc.yaml`)
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uaix-data-pvc
  namespace: uaix-system
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Daemon Orchestrator Deployment (`uaix-deployment.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uaix-daemon-deployment
  namespace: uaix-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: uaix-daemon
  template:
    metadata:
      labels:
        app: uaix-daemon
    spec:
      containers:
        - name: daemon-container
          image: uaix/daemon:v1.0.0
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: uaix-env-config
          volumeMounts:
            - name: data-volume
              mountPath: /data
      volumes:
        - name: data-volume
          persistentVolumeClaim:
            claimName: uaix-data-pvc
```

### Headless Service Configuration (`uaix-service.yaml`)
```yaml
apiVersion: v1
kind: Service
metadata:
  name: uaix-daemon-service
  namespace: uaix-system
spec:
  selector:
    app: uaix-daemon
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5000
  type: ClusterIP
```
