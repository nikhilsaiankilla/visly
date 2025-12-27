## Overview

This document tracks all production infrastructure deployments, grouped by provider and service type.
Use this as the single source of truth for what is deployed where and under which account.

### Databases & Storage
#### ClickHouse (Aiven)
- Provider: Aiven
- Service: ClickHouse
- Project / Account: ankillanikhilsai
- Purpose: Analytics ingestion & long-term query storage
- Notes: Managed ClickHouse cluster with automated backups.

### Messaging / Streaming
## Kafka Worker (AWS EC2)
- Provider: AWS
- Service: EC2 Instance
- Account: nikhilsaiankilla
- Purpose: Kafka consumer → processes events → writes to ClickHouse
- Status: Disabled / Removed
Notes:
Background worker has been intentionally shut down to optimize infrastructure cost for demo and portfolio usage.
The system architecture, Dockerized worker, and deployment setup remain intact and can be re-enabled when required.

### Cache / Key-Value Store
#### Redis (Upstash)
- Provider: Upstash
- Service: Serverless Redis
- Account: nikhilsaiankilla
- Purpose: Caching, rate limiting, ephemeral KV usage
- Notes: Serverless, pay-per-request.

### Backend Services
#### Collector Service (Render)
- Provider: Render
- Service: Web Service
- Account: nikhilsaiankilla
- Purpose: Collects incoming events → produces to Kafka
- Notes: Auto-deploy from main branch; health-checked.

### Kafka Worker (AWS EC2)
#### Provider: AWS
- Service: EC2 Instance
- Account: nikhilsaiankilla
- Purpose: Kafka consumer → processes events → writes to ClickHouse
- Notes: Runs Dockerized worker; instance restart = worker restart.

### Frontend
#### Dashboard UI (Vercel)
- Provider: Vercel
- Service: Next.js Production Deployment
- Account: nikhilsaiankilla
- Purpose: Main user-facing dashboard UI
- Notes: Automatic production deploys from main.

### Summary Table
| Component         | Provider | Type        | Account / Project  | Purpose               |
| ----------------- | -------- | ----------- | ------------------ | --------------------- |
| ClickHouse        | Aiven    | Database    | `ankillanikhilsai` | Analytics storage     |
| Kafka             | Aiven    | Streaming   | `ankillanikhilsai` | Event pipeline        |
| Redis             | Upstash  | KV / Cache  | `nikhilsaiankilla` | Cache / rate limiting |
| Collector Service | Render   | Web Service | `nikhilsaiankilla` | Event ingestion       |
| Kafka Worker      | AWS EC2  | Worker      | `nikhilsaiankilla` | Event processing      |
| UI Dashboard      | Vercel   | Frontend    | `nikhilsaiankilla` | Main dashboard        |

 
2025-12-05