# Containerized MessMate — Project Report Draft

## 1. Project title

**Containerized MessMate: A Cloud-Ready Multi-Service Deployment with Monitoring and Recovery**

## 2. Abstract

MessMate is a full-stack mess operations platform for students and mess administrators. This project extends the existing application into a portable multi-container system to demonstrate virtualization and cloud-computing concepts. The React frontend, Express API, MySQL database, Prometheus metrics collector, and Grafana dashboard run as isolated services managed by Docker Compose. Nginx provides one public entry point, application services communicate over a private network, a named volume preserves database data, health checks coordinate startup, and scripts demonstrate backup and recovery. GitHub Actions validates the application and its container definitions. The existing production deployment remains unchanged, while the coursework branch can later run inside an Ubuntu cloud virtual machine.

## 3. Problem statement

A normal local application often depends on software installed manually on one computer. Differences in Node.js, database, web-server, and operating-system configuration make the application difficult to reproduce. The project must package these dependencies, isolate services, preserve state, expose useful operational information, and demonstrate recovery without risking the existing hosted application.

## 4. Objectives

- Package each application tier as a reproducible container image.
- Orchestrate related services as one system.
- Isolate the API and database from direct public access.
- Preserve database state independently of container lifetime.
- Monitor request traffic, latency, process usage, and database health.
- Automate backup, restore, and build validation.
- Document the relationship between physical hardware, virtual machines, and containers.
- Optionally deploy the same stack to an Ubuntu cloud VM.

## 5. Existing cloud context

The stable application uses Vercel for the frontend, Render for the API, TiDB Cloud for SQL storage, and Brevo for transactional email. Those are managed cloud services. This coursework branch adds explicit containerization and portable infrastructure without replacing or modifying that deployment.

## 6. Architecture

```text
Browser
  |
  | HTTP :8080
  v
Nginx + React container
  |
  | /api over internal network
  v
Express API container ----> /internal/metrics <---- Prometheus
  |                                                  |
  | MySQL protocol                                   v
  v                                                Grafana :3001
MySQL container
  |
  v
Named Docker volume
```

Only Nginx is the application entry point. Grafana and Prometheus are optional local lab interfaces bound to `127.0.0.1`. The API and database do not publish host ports.

## 7. Virtualization concepts demonstrated

### 7.1 Virtual machine

A VM receives virtual CPU, memory, disk, and networking from a hypervisor and runs its own operating-system kernel. A future Ubuntu cloud VM can host this project.

### 7.2 Container

A container isolates an application process and filesystem while normally sharing the host kernel. Containers start faster and use fewer resources than separate VMs, but provide a different isolation boundary.

### 7.3 Image and container

An image is an immutable template produced from a Dockerfile. A container is a running instance of that image. Replacing a container does not require rebuilding or manually reinstalling its software.

### 7.4 Volume

A volume has a lifecycle separate from the database container. It preserves MySQL files when the container is restarted or recreated.

### 7.5 Container network

Docker DNS allows services to use stable names such as `api` and `db`. The internal network prevents the API and database from being directly exposed on the host.

## 8. Implementation

### Frontend

A multi-stage Dockerfile compiles the Vite application with Node.js, then copies only the finished static files into an Nginx image. Nginx serves the single-page application, caches versioned assets, exposes a lightweight health endpoint, and reverse-proxies `/api` to the backend.

### API

The Express image installs production dependencies and runs as the unprivileged `node` user. Its health check queries MySQL, so a healthy API confirms both process and database connectivity.

### Database

MySQL 8.4 initializes from the project's consolidated schema. Credentials come from an ignored environment file, and persistent files live in a named volume.

### Observability

The API exports request counts, duration histograms, database health, and Node.js process metrics. Prometheus scrapes the private endpoint every 10 seconds. Grafana automatically provisions a data source and the MessMate API Operations dashboard.

### Recovery

PowerShell scripts create timestamped SQL dumps and restore them into a disposable database by default. Confirmation and target validation protect the primary coursework database.

### Continuous integration

GitHub Actions validates frontend quality, audits runtime API dependencies, checks Compose configuration, and builds the application images on an Ubuntu runner.

## 9. Verification evidence

Completed:

- Compose configuration parsed successfully.
- Frontend and API images built.
- MySQL, API, and frontend reported healthy.
- Browser loaded the full application through Nginx.
- `/api/health` passed through Nginx and queried MySQL.
- All 14 schema tables initialized.
- Only frontend port 8080 was publicly bound.
- All three core services shared an internal network.
- The database container was recreated and all 14 tables remained in the volume.
- Frontend lint and production build passed.
- API production dependency audit found zero known vulnerabilities.
- Metrics exposition and dashboard JSON passed static validation.
- Backup and restore scripts passed PowerShell syntax parsing.

Evidence still to capture:

- Grafana dashboard with generated traffic;
- Prometheus target shown as healthy;
- successful backup and disposable restore output;
- successful GitHub Actions run;
- controlled API-container recovery;
- optional Ubuntu VM public-IP deployment.

## 10. Problems encountered and solutions

### Stale Docker Desktop runtime socket

Docker Desktop originally failed because it could not remove a stale telemetry socket. The exact ephemeral runtime directory was moved to a timestamped backup, after which Docker generated fresh runtime files and started. No images, volumes, source code, or application data were deleted.

### Deprecated metrics dependency

`prom-client` reported that it had been superseded. It was removed and replaced with the Prometheus-maintained `@prometheus-io/client`. The API and CI runtime were aligned on Node.js 22.

### WSL engine stall during monitoring build

The first monitoring build stopped progressing while Docker committed an API layer. Docker's API and WSL control layer then became unresponsive. The operation was cancelled without deleting persistent resources. Final monitoring verification will resume after the Windows virtualization layer is restarted with the required user privilege.

## 11. Security decisions

- Production secrets and production data are excluded from the coursework environment.
- `.env.docker` and SQL backups are ignored by Git.
- API and MySQL ports are not published.
- Application metrics exclude personal and payment data.
- Runtime API dependencies are audited separately from development dependencies.
- The API runs without root privileges.
- A production VM deployment will require HTTPS and restricted firewall rules.

## 12. Result and conclusion

The verified core system demonstrates that MessMate can run as a portable, isolated three-tier container application with persistent storage and health-aware orchestration. The observability, recovery, and CI configuration extend it into an operational cloud-computing project. The same container stack can be placed inside an Ubuntu cloud VM to show container virtualization running on top of machine virtualization.

## 13. Future work

- Complete the Ubuntu VM deployment if schedule permits.
- Add HTTPS termination and production-mode container configuration.
- Publish signed images to GitHub Container Registry.
- Add alert rules for database failure and elevated server-error rate.
- Explore Kubernetes Deployments, Services, Secrets, probes, persistent volume claims, and Ingress only after the Compose version is fully demonstrated.

## 14. Five-minute demonstration outline

1. Explain VM versus container and show the architecture.
2. Run `docker compose ps` and identify the isolated services.
3. Open MessMate through Nginx and call the proxied health endpoint.
4. Show that API and database ports are private.
5. Generate requests and show the Grafana panels changing.
6. Recreate a container and show automatic health recovery.
7. Show that database data survives through the volume.
8. Show the GitHub Actions result and explain portability to an Ubuntu VM.
