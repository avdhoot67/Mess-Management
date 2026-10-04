# MessMate Cloud and Virtualization Learning Journal

This journal records what we build, why each component exists, the commands used to verify it, problems encountered, and evidence required for the final report. It is intentionally written for someone learning virtualization and cloud computing for the first time.

## 1. The basic concepts

### Physical machine

A physical machine is the actual laptop or server hardware: processor, memory, storage, and network interface.

### Virtual machine

A virtual machine, or VM, behaves like a separate computer. A hypervisor assigns part of the physical machine's CPU, memory, storage, and networking to the VM. The VM runs its own operating system and kernel.

Examples include an Ubuntu VM in AWS, Azure, Google Cloud, Oracle Cloud, VirtualBox, or VMware.

### Container

A container isolates an application and its filesystem, dependencies, processes, and network configuration. Unlike a VM, containers normally share the host operating system's kernel. This makes them smaller and faster to start.

For this project:

- the frontend container contains Nginx and the compiled React application;
- the API container contains Node.js, production dependencies, and the Express source;
- the database container contains MySQL;
- later containers will contain Prometheus and Grafana.

### Image versus container

An **image** is a read-only template. A **container** is a running instance of an image.

The Dockerfile is the recipe for an image:

```text
Dockerfile -> docker build -> image -> docker run -> container
```

If a container is deleted, its writable container layer is deleted. Important database data therefore belongs in a Docker volume, not only inside the container.

### Docker Compose

Docker Compose reads `compose.yaml` and manages several related containers as one application. It creates the networks and volumes, injects configuration, starts services in dependency order, and reports their health.

### Cloud computing

Cloud computing provides resources such as virtual machines, databases, networks, object storage, and managed application platforms on demand.

The existing MessMate deployment already uses managed cloud services:

- Vercel: frontend hosting and reverse proxy;
- Render: application compute;
- TiDB Cloud: managed SQL database;
- Brevo: transactional email API.

The coursework branch adds a portable container deployment. Later, the same Compose application can run inside one Ubuntu cloud VM. That demonstrates both layers:

```text
Physical cloud server
  -> Ubuntu virtual machine
     -> Docker container runtime
        -> MessMate service containers
```

## 2. Safety and branch separation

The production application remains on `main` and `deployment/production`.

Coursework branch:

```text
codex/cloud-virtualization-coursework
```

The coursework environment uses its own MySQL container, credentials, network, and volume. It must never connect to production TiDB or reuse production secrets.

The local secret file is `.env.docker`. Git ignores it. `.env.docker.example` documents the required variable names without containing usable credentials.

## 3. Architecture implemented in Phase 1

```text
Browser
  |
  | http://localhost:8080
  v
Nginx + React container
  |
  | /api on private Docker network
  v
Express API container
  |
  | MySQL protocol on private Docker network
  v
MySQL container -> named persistent volume
```

### Why Nginx is the public entry point

The React project is compiled into static HTML, CSS, JavaScript, and font files. Nginx is designed to serve those files efficiently.

It also reverse-proxies `/api/*` to the API container. The browser therefore sees one origin, `http://localhost:8080`, even though the frontend and API run in different containers. This preserves the same-origin cookie design used by the deployed application.

### Why the API has no host port

The API is reachable as `http://api:5000` only from containers on the private Docker network. Users cannot directly connect to it from the host. Nginx is the controlled entry point.

### Why the database has no host port

Only the API needs database access. Not publishing port `3306` reduces the exposed attack surface and demonstrates network isolation.

### Why there are two networks

- `edge`: the frontend's public-facing network;
- `private`: communication between frontend, API, and database.

The private network is marked `internal`, so its services do not receive normal external network access through that network.

### Why health checks matter

A running process is not automatically a working service.

- MySQL is healthy only when it accepts database connections.
- The API is healthy only when `/api/health` can query MySQL.
- The frontend is healthy only when Nginx responds.

Compose uses these signals to avoid starting dependent services too early.

## 4. Files introduced in Phase 1

| File | Purpose |
| --- | --- |
| `frontend/Dockerfile` | Builds React and serves the output with Nginx |
| `frontend/nginx.conf` | SPA routing, API proxy, static caching, frontend health endpoint |
| `frontend/.dockerignore` | Prevents unnecessary or sensitive files entering the build context |
| `backend/Dockerfile` | Packages the Express API with production dependencies |
| `backend/.dockerignore` | Excludes secrets, dependencies, and operational scripts |
| `compose.yaml` | Defines the frontend, API, database, networks, volume, and health checks |
| `.env.docker.example` | Safe configuration template for other machines |
| `.env.docker` | Ignored local credentials used only on this computer |

## 5. Image design decisions

### Frontend multi-stage build

The frontend Dockerfile has two stages:

1. A Node stage installs dependencies and runs `npm run build`.
2. An Nginx stage receives only the compiled `dist` output.

Node and the source tree are not needed to serve the finished site, so they are excluded from the runtime image. This reduces image size and attack surface.

### Backend non-root process

The API installs production dependencies with:

```text
npm ci --omit=dev
```

It then changes to the predefined unprivileged `node` user. If the application is compromised, the process does not automatically have root privileges inside the container.

### Local runtime mode

The first Compose version uses `NODE_ENV=development` because the existing production validator correctly requires HTTPS cookies, an HTTPS frontend, TLS database connections, and a configured email provider. Local `http://localhost` and the private MySQL lab do not meet those production requirements.

The image still contains production-only dependencies. Before deploying to a cloud VM, we will add HTTPS and production-safe runtime configuration instead of disabling the application's security checks.

## 6. Commands

Run commands from the repository root.

Validate the Compose file without starting containers:

```powershell
docker compose --env-file .env.docker config --quiet
```

Build and start the core services:

```powershell
docker compose --env-file .env.docker up --build -d
```

Display service and health status:

```powershell
docker compose --env-file .env.docker ps
```

Read recent logs:

```powershell
docker compose --env-file .env.docker logs --tail 100
```

Open the application:

```text
http://localhost:8080
```

Test the full frontend-to-API-to-database path:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

Stop containers without deleting the database volume:

```powershell
docker compose --env-file .env.docker down
```

Do not add `--volumes` unless intentionally deleting the coursework database.

## 7. Current verification record

- Docker Engine CLI installed: yes.
- Docker Compose plugin installed: yes.
- `kubectl` installed: yes, reserved for an optional later phase.
- Compose configuration parses successfully: yes.
- Docker daemon running: yes, Docker Engine 27.4.0.
- API image built successfully: yes.
- Frontend multi-stage image built successfully: yes.
- MySQL, API, and frontend containers healthy: yes.
- Browser smoke test through Nginx at `http://localhost:8080`: passed.
- Proxied API/database health test: passed with `database: true`.
- Schema initialization: passed; 14 application tables were present.
- Network isolation: passed; only frontend port `8080` is published to the host.
- Private network: passed; frontend, API, and database share an internal network.
- Persistent named volume: passed; all 14 tables remained after database-container recreation.

### Persistence/recovery test performed

The database container was restarted and then recreated by Compose. Compose waited for MySQL, the API, and the frontend to become healthy. The schema still contained 14 tables and the proxied health endpoint still returned success.

This proves an important distinction:

- a container is replaceable compute;
- a volume is separately managed persistent storage.

Recreating a container is therefore not the same as deleting its named volume.

### Docker Desktop startup incident

Docker Desktop initially could not start because a stale local telemetry socket remained at:

```text
C:\Users\Avdhoot Shinde\AppData\Local\Docker\run\userAnalyticsOtlpHttp.sock
```

Docker's log reported that it could not remove that socket. The Docker Desktop and backend processes were stopped, and the exact runtime-only `run` directory was moved to a timestamped backup directory. Docker Desktop then generated a fresh runtime directory and the engine started normally.

Why this was safe:

- application source code was not changed;
- Docker images, containers, and volumes were not deleted;
- the old runtime directory was moved, not permanently erased;
- the fix targeted ephemeral local control files rather than project data.

This incident demonstrates that the Docker CLI and Docker Engine are different layers: the CLI may be installed while the background engine is unavailable.

## 8. Planned visual demonstration

The final classroom demonstration will show:

1. MessMate running in the browser through the Nginx container.
2. Docker Desktop showing isolated healthy services.
3. Docker networks showing that the API and database are not directly public.
4. A database record surviving container recreation because it lives in a volume.
5. Grafana showing real request and health metrics.
6. A controlled API-container failure and recovery.
7. GitHub Actions validating the project.
8. If time permits, the same stack served from an Ubuntu cloud VM's public address.

## 9. Cloud VM reminder

After the local scope is complete and documented, evaluate the remaining time. If enough time remains, deploy the Compose stack to a separate Ubuntu VM. This must use new coursework secrets, HTTPS, restricted firewall rules, and its own database volume. It must not replace or connect to the existing Vercel, Render, or TiDB deployment.

## 10. Next implementation step

Add the optional observability profile: application metrics, Prometheus collection, and a provisioned Grafana dashboard. The core three-service container deployment is now verified.
