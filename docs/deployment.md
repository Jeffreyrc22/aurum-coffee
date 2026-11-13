# Free deployment preparation

The root Dockerfile builds the frontend and Spring Boot API into a single executable JAR. Both use the same HTTPS origin and relative `/api/v1` requests; no browser CORS workaround is needed. SPA routes load index.html; API endpoints retain their existing authorization and CSRF checks.

## Services

- Render web service: Docker runtime, **Free** instance, root Dockerfile, `/actuator/health` probe. `render.yaml` declares the free plan explicitly.
- Neon: separate PostgreSQL database per project, **Free** plan. Set JDBC URL with `sslmode=require`, database username/password, and unique administrator credentials through the hosting dashboard only.
- `SESSION_SECURE=true` is required for public HTTPS. `PORT` is supplied by the host.
- Public uploads are stored in PostgreSQL (AURUM images); LogiCore private documents already use PostgreSQL. Do not depend on ephemeral container filesystems.

Render Free suspends idle services; initial requests can take about a minute. The free instance hours and Neon storage/compute quotas apply. No paid plan or automatic upgrade is configured by this repository. SMTP remains optional and recovery reports its unavailability until configured.

## Verification before publishing portfolio

1. Build the full stack with `scripts/Build-Fullstack.ps1` (stops only recorded local processes).
2. Run isolated integration checks with `scripts/Test-Local.ps1`.
3. Verify deployed root and direct SPA routes, catalog/authorized records, login and session cookie, write and reload, file upload/download, and unauthorized access rejection.
4. Populate each portfolio `liveUrl` only with the verified public deployment URL.
5. Deploy the portfolio to Vercel after both project deployments pass.

Cloud deployment is pending account connection; this file does not claim that a live service exists.
