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

The selected extension is an Oracle Always Free eligible Ubuntu VM. The VM has not been created yet. The next prerequisite is the student's OCI account and an available Always Free Ampere A1 shape. Before exposing the app, the local HTTP/development Compose settings must be replaced with HTTPS and cloud-safe settings. A DNS name derived from the VM's public IP and an automatically renewed certificate are possible without buying a domain, but issuance must be verified on the actual VM. Only ports 80/443 and restricted SSH should be public; monitoring, API, and database ports remain private.

The live demonstration should distinguish three ideas: a container restart shows **process recovery**, a named volume and tested SQL dump show **data persistence and restore**, and Prometheus/Grafana show **failure detection**. None of these alone proves high availability. The present single-VM/single-MySQL setup can have downtime when the host or database fails. Horizontal API scaling is a possible later experiment, not a feature already demonstrated.

## 10. Next implementation step

Complete the observability runtime check after Docker Desktop's WSL engine is restarted, then exercise the backup/restore scripts against the disposable restore database.

## 11. Phase 3 — Observability implementation

Observability means understanding a running system from the signals it produces. This phase uses two tools:

- **Prometheus** requests, or “scrapes,” numeric metrics from the API every 10 seconds and stores time-series data.
- **Grafana** queries Prometheus and displays the values as an operational dashboard.

The API now records:

- total HTTP requests grouped by method, normalized route, and status code;
- request-duration histograms for latency calculations;
- the result of the latest database health check;
- standard Node.js process CPU, memory, event-loop, and garbage-collection metrics.

The metrics endpoint is `/internal/metrics`. Nginx does not proxy `/internal`, the API publishes no host port, and Prometheus reaches it only over the private Docker network.

This prevents the metrics endpoint from becoming another public application route. Metric labels also avoid emails, names, feedback, transaction references, tokens, and raw URLs. Fixed route templates are used instead of user-supplied URL values to prevent sensitive-data leakage and uncontrolled metric cardinality.

Monitoring is optional through the Compose `observability` profile:

```powershell
docker compose --profile observability --env-file .env.docker up --build -d --wait
```

Local interfaces:

- MessMate: `http://localhost:8080`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

Prometheus and Grafana bind to `127.0.0.1`, so they are available only from this computer during the local lab.

### Metrics dependency decision

The original `prom-client` package emitted a deprecation warning during installation. It was immediately removed and replaced with `@prometheus-io/client`, the package maintained under the Prometheus organization. The newer package requires Node.js 22 or later, matching the API container and CI runtime.

The production-only API dependency audit reports zero known vulnerabilities. Local `npm audit` still reports findings in development-only transitive packages; these do not enter the runtime API image and remain a separate maintenance item.

### Dashboard panels

The provisioned **MessMate API Operations** dashboard contains:

1. database health;
2. request rate by normalized route;
3. 95th-percentile response time;
4. server-error rate;
5. API resident memory;
6. API CPU usage.

Runtime verification is complete after Docker Desktop recovered. All five containers report healthy. Prometheus reports its `api:5000/internal/metrics` target as `up`; a live query returned `messmate_database_healthy = 1`. Grafana loaded the provisioned **MessMate API Operations** dashboard with six panels.

On the first monitoring startup, Prometheus and Grafana were internally healthy but their Windows localhost ports were not published. Both containers were attached only to the Docker network marked `internal`. Adding the `edge` network to those two services allowed Docker to publish `127.0.0.1:9090` and `127.0.0.1:3001`. The API and MySQL remain reachable only inside Docker.

Grafana initially used a temporary default password. A new random local password was added to the ignored `.env.docker` file, the Compose fallback was removed, and Grafana's stored admin password was reset to match. No usable Grafana password is committed to Git.

## 12. Phase 4 — Backup and recovery automation

`scripts/docker/backup-db.ps1` runs `mysqldump` inside the private database container and writes a timestamped SQL file under `backups/`. SQL exports are ignored by Git.

```powershell
.\scripts\docker\backup-db.ps1
```

`scripts/docker/restore-db.ps1` restores into `mess_management_restore` by default. This disposable target prevents an accidental overwrite of the primary coursework database.

```powershell
.\scripts\docker\restore-db.ps1 -BackupPath .\backups\messmate-YYYYMMDD-HHMMSS.sql
```

Safety controls:

- only `.sql` files are accepted;
- target database names are restricted to letters, digits, and underscores;
- the default restore target is separate from the primary database;
- restoring the primary database requires an explicit switch;
- interactive confirmation requires typing `RESTORE`;
- backup output is constrained to the repository;
- failed or empty backups are removed.

The first trial found two defects. MySQL's application user lacked the global `PROCESS` privilege for tablespace details, and the backup script had accepted a dump that printed an error. The dump now uses `--no-tablespaces` and requires a completion marker. The restore script's shell quoting was corrected, and it uses the database container's root account to create the disposable restore database. A fresh dump completed cleanly; the restore database then contained all 14 tables.

The API container was also restarted on purpose. Compose waited until it reported healthy again, and the browser-facing `/api/health` route returned database connectivity. This demonstrates recovery of an application process while MySQL storage stays in its separate volume.

## 13. Phase 5 — Continuous integration

`.github/workflows/cloud-coursework-ci.yml` runs for coursework-branch pushes and relevant pull requests. A fresh GitHub-hosted Ubuntu runner performs:

1. frontend dependency installation, lint, and production build;
2. backend production dependency installation and security audit;
3. Compose configuration validation, including the observability profile;
4. frontend and API Docker image builds.

CI does not deploy the application and receives only disposable validation values. It requires no production secrets.

The first remote run completed successfully on commit `13161d9`:

```text
https://github.com/avdhoot67/Mess-Management/actions/runs/37213761050
```

This independently verified the project on a clean Ubuntu runner rather than relying only on the developer's Windows environment.

## 14. Second Docker Desktop incident

During the first observability build, Grafana and Prometheus images downloaded successfully, but Docker stalled while committing a very small API image layer. The Docker API then returned HTTP 500 and the WSL command layer stopped responding.

The build operation was cancelled without deleting containers or volumes. Restarting the Windows WSL service requires elevated permission that is unavailable to this development session. The next local verification must therefore begin after Docker Desktop/WSL is restarted by the signed-in user or after Windows restarts.

This was a host virtualization problem. After Docker Desktop recovered, the same build completed, and all five services passed their health checks.

## 15. Synchronizing a product feature from `main`

The primary MessMate branch gained an admin customer directory while the coursework branch was in progress. Its frontend pages, admin navigation, API routes, and integration checks were merged into the coursework branch without changing the database schema or replacing the container configuration. The shared `backend/src/server.js` retained both the customer route and the coursework metrics endpoint.

The merged frontend passed lint and production build. Both Docker application images rebuilt, all five services became healthy, and the browser-facing `/api/health` returned 200. The containerized integration smoke suite passed its new admin-only customer-directory checks and the rest of the application flow. In this isolated lab, Gemini is intentionally unconfigured, so the suite now expects the API's 503 configuration response instead of the 422 minimum-feedback response required when Gemini is configured. No production credentials or data were copied into Docker.

## 16. Oracle Cloud VM provisioned and SSH verified

An Oracle Cloud Infrastructure VM named `messmate-cloud-lab` was created in the Mumbai region using the Always Free-eligible `VM.Standard.A1.Flex` shape (2 OCPUs, 8 GB memory) and Canonical Ubuntu 24.04. It uses the coursework VCN's public subnet and has a public IPv4 address. The VCN's SSH ingress rule was restricted to the student's then-current public IP instead of the entire internet. The exact rule may need updating if that IP changes.

The student downloaded Oracle's SSH key pair. The first SSH attempt reached the VM but Windows OpenSSH refused the private key because the local `CodexSandboxUsers` group had inherited read access to it. Windows Explorer hid file extensions, making the private `.key` file easy to confuse with the public `.key.pub` file. After identifying the full filename in the Properties dialog, inheritance was disabled **on the private key file only** and the extra group's access was removed. SSH then succeeded with the default Ubuntu account, yielding the `ubuntu@messmate-cloud-lab` prompt.

This verifies VM provisioning and remote administrative access. Docker Engine, the coursework application, HTTPS, and the public web firewall rules are **not yet configured on the VM**. The existing Vercel/Render/TiDB deployment is unaffected.

The first Ubuntu commands were accidentally entered after SSH had disconnected; the `PS C:\WINDOWS\system32>` prompt meant they ran on the Windows computer, not the VM. After reconnecting, `uname -m` returned `aarch64`. `sudo apt update` and `sudo apt upgrade -y` completed, installing a newer Oracle kernel. The VM was rebooted, SSH reconnected, and `uname -r` confirmed `7.0.0-1013-oracle`. This is a useful demonstration of the difference between the local shell and a remote VM shell, and why a kernel update requires a reboot.

Docker Engine and the Compose plugin were then installed from Docker's official Ubuntu `noble`/`arm64` package repository. `sudo docker run --rm hello-world` successfully pulled and ran the ARM64 test image, and `sudo docker compose version` reported Compose v5.6.0. This verifies the container runtime on the cloud VM, but does not yet mean that MessMate or HTTPS is deployed. Docker commands use `sudo`; adding `ubuntu` to the `docker` group is unnecessary and would grant that account root-equivalent Docker access.

The coursework branch was cloned from GitHub onto the VM with `git clone --branch codex/cloud-virtualization-coursework --single-branch ...`. `git branch --show-current` confirmed the correct branch. No application services were started at this stage.

### Private VM validation before public HTTPS

The first VM application run will be accessible **only through an SSH tunnel**, not to the public internet. The Compose frontend host port is explicitly bound to `127.0.0.1`; Prometheus and Grafana already use localhost bindings. Only SSH is currently allowed through the OCI security list. A separate cloud HTTPS deployment will be prepared after the VM stack passes private checks.

`scripts/docker/init-lab-env.sh` creates a VM-only `.env.docker` with independent random MySQL, JWT, and Grafana credentials, owner-only file permissions, and no production credentials. It refuses to overwrite an existing file. Neither the generated values nor the file should be shared or committed.

Once the VM has pulled this change, run from the repository directory:

```bash
bash scripts/docker/init-lab-env.sh
sudo docker compose --env-file .env.docker config --quiet
sudo docker compose --env-file .env.docker up --build -d --wait
curl --fail http://127.0.0.1:18080/api/health
```

For the VM where `.env.docker` was already generated with `MESSMATE_HTTP_PORT=8080`, change only that one setting before restarting the stack:

```bash
sed -i 's/^MESSMATE_HTTP_PORT=8080$/MESSMATE_HTTP_PORT=18080/' .env.docker
sudo docker compose --env-file .env.docker up -d --wait
```

On the Windows computer, a separate PowerShell SSH connection can forward local port 8080 to the VM's loopback port:

```powershell
ssh -i "C:\Users\Avdhoot Shinde\Downloads\ssh-key-2026-10-05.key" -N -L 127.0.0.1:18080:127.0.0.1:18080 ubuntu@80.225.234.66
```

While this SSH session remains open, `http://localhost:18080` on Windows reaches the VM's containerized frontend. Port 18080 avoids colliding with the existing Windows Docker lab on port 8080. The VM's initial generated `.env.docker` used port 8080 and must be changed to 18080 before testing the tunnel; the generator now defaults to 18080 for new VM setups. This is a **private validation step**, not the final public-IP demo. The local lab and VM lab each have their own `.env.docker` and database volume. Do not transfer the Windows lab's `.env.docker` or any production credentials to the VM.
