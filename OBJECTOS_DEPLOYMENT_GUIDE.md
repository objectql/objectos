# ObjectOS 部署运维指南 | ObjectOS Deployment Guide

> **版本 Version**: 1.0.0  
> **日期 Date**: 2026年2月3日 | February 3, 2026

---

## 目录 | Table of Contents

### 中文部分
1. [部署架构](#一部署架构)
2. [生产环境部署](#二生产环境部署)
3. [容器化部署](#三容器化部署)
4. [云平台部署](#四云平台部署)
5. [运维管理](#五运维管理)

### English Section
1. [Deployment Architecture](#i-deployment-architecture)
2. [Production Deployment](#ii-production-deployment)
3. [Containerized Deployment](#iii-containerized-deployment)
4. [Cloud Platform Deployment](#iv-cloud-platform-deployment)
5. [Operations Management](#v-operations-management)

---

## 中文版 | Chinese Version

### 一、部署架构

#### 1.1 架构演进路径

```
┌─────────────────────────────────────────────────────────────┐
│  阶段1: 单机部署 (适合小团队,<100用户)                       │
│                                                              │
│  ┌──────────────────┐                                       │
│  │  ObjectOS Server │  All-in-one                           │
│  │  + PostgreSQL    │  单服务器部署                         │
│  │  + Redis         │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  阶段2: 分离式部署 (适合中型团队,100-1000用户)               │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ObjectOS Server│    │ PostgreSQL   │    │    Redis     │ │
│  │   (应用层)    │◄───┤   (数据层)   │    │   (缓存层)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  阶段3: 负载均衡 (适合大型企业,>1000用户)                     │
│                                                              │
│           ┌──────────────┐                                  │
│           │Load Balancer │                                  │
│           └───────┬──────┘                                  │
│                   │                                          │
│       ┌───────────┴───────────┐                             │
│       ▼                       ▼                             │
│  ┌─────────┐            ┌─────────┐                        │
│  │ObjectOS │            │ObjectOS │                        │
│  │ Node 1  │            │ Node 2  │                        │
│  └────┬────┘            └────┬────┘                        │
│       │                      │                              │
│       └──────────┬───────────┘                             │
│                  ▼                                          │
│         ┌─────────────────┐                                │
│         │ PostgreSQL      │                                │
│         │ (Primary+Standby)│                               │
│         └─────────────────┘                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  阶段4: 微服务/云原生 (适合SaaS平台,>10000用户)               │
│                                                              │
│  Kubernetes Cluster                                         │
│  ├── ObjectOS Pods (Auto-scaling)                          │
│  ├── PostgreSQL StatefulSet                                │
│  ├── Redis Deployment                                       │
│  ├── Ingress Controller (NGINX)                            │
│  └── Service Mesh (Istio, 可选)                            │
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 硬件需求

| 组件 | 最小配置 | 推荐配置 | 企业级配置 |
|-----|---------|---------|-----------|
| **ObjectOS应用服务器** | 2 Core, 4GB RAM | 4 Core, 8GB RAM | 8 Core, 16GB RAM |
| **PostgreSQL数据库** | 2 Core, 4GB RAM | 4 Core, 16GB RAM | 8 Core, 32GB RAM |
| **Redis缓存** | 1 Core, 2GB RAM | 2 Core, 4GB RAM | 4 Core, 8GB RAM |
| **磁盘空间** | 50GB SSD | 200GB SSD | 500GB+ NVMe SSD |
| **网络带宽** | 100Mbps | 1Gbps | 10Gbps |

---

### 二、生产环境部署

#### 2.1 准备工作

**系统要求**:
- Ubuntu 22.04 LTS / CentOS 8 / Debian 11
- Node.js 18+ (推荐使用 LTS 版本)
- PostgreSQL 14+
- Redis 6+

**安装Node.js**:

```bash
# 使用NVM安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**安装PostgreSQL**:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库
sudo -u postgres psql
postgres=# CREATE DATABASE objectos_prod;
postgres=# CREATE USER objectos_user WITH PASSWORD 'your_secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE objectos_prod TO objectos_user;
postgres=# \q
```

**安装Redis**:

```bash
# Ubuntu/Debian
sudo apt install redis-server

# 启动Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 测试连接
redis-cli ping  # 应返回 PONG
```

#### 2.2 应用部署

**步骤1: 克隆代码**

```bash
# 创建部署目录
mkdir -p /opt/objectos
cd /opt/objectos

# 克隆代码 (或使用发布包)
git clone https://github.com/objectstack-ai/objectos.git .

# 安装依赖
pnpm install --frozen-lockfile
```

**步骤2: 配置环境变量**

```bash
# 创建生产环境配置
cat > .env.production << EOF
# 环境
NODE_ENV=production

# 服务器
PORT=3000
HOST=0.0.0.0

# 数据库
DATABASE_URL=postgresql://objectos_user:your_secure_password@localhost:5432/objectos_prod

# Redis
REDIS_URL=redis://localhost:6379

# JWT认证
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Session
SESSION_SECRET=$(openssl rand -base64 32)
SESSION_MAX_AGE=86400000

# CORS (前端域名)
CORS_ORIGIN=https://your-frontend-domain.com

# 日志
LOG_LEVEL=info

# 邮件 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 监控 (可选)
SENTRY_DSN=https://your-sentry-dsn
EOF

# 设置文件权限
chmod 600 .env.production
```

**步骤3: 构建应用**

```bash
# 构建生产版本
pnpm build

# 运行数据库迁移
pnpm migrate:prod
```

**步骤4: 使用PM2管理进程**

```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'objectos',
    script: './dist/main.js',
    instances: 'max',  // 使用所有CPU核心
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

#### 2.3 NGINX反向代理

```bash
# 安装NGINX
sudo apt install nginx

# 创建NGINX配置
sudo nano /etc/nginx/sites-available/objectos

# 配置内容:
upstream objectos_backend {
    # 多个ObjectOS实例 (负载均衡)
    least_conn;
    server 127.0.0.1:3000;
    # server 127.0.0.1:3001;
    # server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书 (使用Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 日志
    access_log /var/log/nginx/objectos.access.log;
    error_log /var/log/nginx/objectos.error.log;
    
    # 请求体大小限制 (文件上传)
    client_max_body_size 100M;
    
    # API代理
    location /api {
        proxy_pass http://objectos_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket代理
    location /ws {
        proxy_pass http://objectos_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
    
    # 静态文件 (如果前端也部署在同一服务器)
    location / {
        root /var/www/objectui;
        try_files $uri $uri/ /index.html;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/objectos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 2.4 SSL证书 (Let's Encrypt)

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

### 三、容器化部署

#### 3.1 Docker配置

**Dockerfile**:

```dockerfile
# packages/plugins/server/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

# 安装PNPM
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 只复制必需文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S objectos -u 1001
USER objectos

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# 启动应用
CMD ["node", "dist/main.js"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  objectos:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: objectos-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://objectos:password@postgres:5432/objectos
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - objectos-network
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:14-alpine
    container_name: objectos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: objectos
      POSTGRES_PASSWORD: password
      POSTGRES_DB: objectos
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U objectos"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - objectos-network

  redis:
    image: redis:7-alpine
    container_name: objectos-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - objectos-network

  nginx:
    image: nginx:alpine
    container_name: objectos-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - objectos
    networks:
      - objectos-network

networks:
  objectos-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

**启动服务**:

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f objectos

# 停止服务
docker-compose down

# 重启服务
docker-compose restart objectos
```

---

### 四、云平台部署

#### 4.1 Kubernetes部署

**deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: objectos-server
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: objectos
  template:
    metadata:
      labels:
        app: objectos
    spec:
      containers:
      - name: objectos
        image: your-registry/objectos:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: objectos-secrets
              key: database-url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: objectos-service
  namespace: production
spec:
  selector:
    app: objectos
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: objectos-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: objectos-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**部署命令**:

```bash
# 创建命名空间
kubectl create namespace production

# 创建Secrets
kubectl create secret generic objectos-secrets \
  --from-literal=database-url='postgresql://...' \
  --namespace=production

# 部署应用
kubectl apply -f deployment.yaml

# 查看状态
kubectl get pods -n production
kubectl get svc -n production

# 查看日志
kubectl logs -f deployment/objectos-server -n production
```

#### 4.2 AWS部署

**使用ECS + RDS**:

```bash
# 1. 创建RDS实例
aws rds create-db-instance \
  --db-instance-identifier objectos-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username objectos \
  --master-user-password YourSecurePassword \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7

# 2. 创建ECR仓库
aws ecr create-repository --repository-name objectos

# 3. 推送Docker镜像
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
docker tag objectos:latest your-account.dkr.ecr.us-east-1.amazonaws.com/objectos:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/objectos:latest

# 4. 创建ECS集群
aws ecs create-cluster --cluster-name objectos-prod

# 5. 创建任务定义和服务 (使用AWS控制台或Terraform)
```

---

### 五、运维管理

#### 5.1 日志管理

**使用Winston结构化日志**:

```typescript
// src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // 错误日志文件
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});
```

**日志聚合 (ELK Stack)**:

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

#### 5.2 监控指标

**Prometheus + Grafana**:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'objectos'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

```typescript
// 在ObjectOS中暴露指标
import { register, Counter, Histogram } from 'prom-client';

// HTTP请求计数
const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

// 响应时间直方图
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path']
});

// 暴露/metrics端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### 5.3 备份策略

**数据库备份**:

```bash
#!/bin/bash
# backup.sh

# 配置
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="objectos_${DATE}.sql.gz"

# 创建备份
pg_dump -U objectos objectos_prod | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# 保留最近30天的备份
find "${BACKUP_DIR}" -name "objectos_*.sql.gz" -mtime +30 -delete

# 上传到S3 (可选)
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://your-bucket/backups/"

# 添加到crontab
# 0 2 * * * /opt/scripts/backup.sh
```

#### 5.4 安全加固

**1. 防火墙配置**:

```bash
# 使用UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

**2. 限制数据库访问**:

```bash
# PostgreSQL: 编辑 pg_hba.conf
# 只允许本地和应用服务器访问
local   all             all                                     peer
host    objectos_prod   objectos_user   127.0.0.1/32           md5
host    objectos_prod   objectos_user   10.0.1.0/24            md5
```

**3. 定期安全更新**:

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# 自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## English Version

*(Same content structure with English translations)*

---

## 附录 | Appendix

### 故障排查 | Troubleshooting

| 问题 Problem | 可能原因 Possible Cause | 解决方案 Solution |
|------------|---------------------|-----------------|
| 应用无法启动 | 端口被占用 | `lsof -i :3000` 查找进程并终止 |
| 数据库连接失败 | 连接字符串错误 | 检查 DATABASE_URL 格式 |
| 内存不足 | 连接池配置过大 | 调整 pool.max 参数 |
| CPU占用高 | 未使用索引的查询 | 优化SQL查询,添加索引 |

### 性能调优 | Performance Tuning

```bash
# PostgreSQL优化
# postgresql.conf
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

---

<div align="center">
<sub>ObjectOS - Reliable, Scalable, Secure</sub>
</div>
