# Nexus API Specification
**Version:** 1.0.0
**Classification:** Internal — Quorbz LLC
**Owner:** Nico (CTO / Agent 0)
**Last Updated:** 2026-04-15

---

## Overview

Nexus is the internal mission control REST API for Quorbz LLC's AI agent organization. It runs on the DL380 server (Ubuntu) as a Node.js/TypeScript service backed by PostgreSQL. All agents in the Quorbz org connect to Nexus for security token gating, heartbeat reporting, task lifecycle management, crash recovery via checkpoints, security incident reporting, lead capture, and role manifest retrieval.

Nexus is not customer-facing. Every endpoint is internal and authenticated unless explicitly noted.

**Base URL (internal):** `https://nexus.quorbz.internal/api`
**Port:** `4400` (internal network only, not exposed on public interface)
**Protocol:** HTTPS only. TLS termination via nginx reverse proxy on DL380.

---

## Authentication

Every request (except `/api/health`) must include the following headers:

| Header | Value | Description |
|---|---|---|
| `Authorization` | `Bearer <token>` | Agent secret token issued at activation |
| `X-Agent-ID` | `<agent_id>` | Agent's assigned ID (e.g. `agent-0`, `agent-1`) |

Tokens are issued once at first activation via `POST /api/security/activate`. They are non-rotating unless manually revoked by an admin. Tokens are stored hashed (bcrypt) in PostgreSQL. They are never logged in plaintext.

**Zero Trust Model:**

Every endpoint validates:
1. Token authenticity (hash comparison)
2. Agent ID match against token record
3. Machine fingerprint match (after activation)
4. Role-based access — each agent's manifest defines which endpoints and scopes it is permitted to access. An agent cannot query another agent's manifest, tasks, or private data unless it holds `role: admin`.

**Roles:**

| Role | Description |
|---|---|
| `admin` | Full read/write access to all resources. Assigned to Agent 0 (Nico). |
| `agent` | Standard agent — can access own data, create tasks, send heartbeats, report incidents, submit leads |
| `readonly` | Read-only access to own agent record and assigned tasks |

---

## Rate Limiting

| Scope | Limit |
|---|---|
| Heartbeat | 1 request per 30 seconds per agent (server ignores excess silently, logs anomaly) |
| Task creation | 100 requests per minute per agent |
| Security incidents | 20 requests per minute per agent |
| All other endpoints | 300 requests per minute per agent |

Exceeded limits return `429 Too Many Requests`.

---

## Error Format

All errors return a consistent JSON envelope:

```json
{
  "error": true,
  "code": "UNAUTHORIZED",
  "message": "Token is invalid or agent ID mismatch.",
  "timestamp": "2026-04-15T14:32:00Z"
}
```

**Standard Error Codes:**

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `BAD_REQUEST` | Missing or malformed request body |
| 401 | `UNAUTHORIZED` | Missing, invalid, or mismatched token/agent ID |
| 403 | `FORBIDDEN` | Agent lacks permission for this action |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate resource (e.g. agent already activated) |
| 422 | `VALIDATION_ERROR` | Body fields failed validation |
| 429 | `RATE_LIMITED` | Request rate exceeded |
| 500 | `INTERNAL_ERROR` | Server-side failure |

---

## Endpoint Groups

---

## 1. SECURITY

### POST /api/security/activate

**Description:** First-time agent activation. Registers the agent, issues a secret token, and records the machine fingerprint. Can only be called once per agent ID. Subsequent calls return `409 CONFLICT`. Must be called before any other authenticated endpoint.

**Auth required:** No (pre-auth bootstrap call)

**Who can call it:** Any unactivated agent, or Nico during provisioning.

**Request Body:**

```json
{
  "agent_id": "agent-1",
  "agent_name": "Elena",
  "role": "agent",
  "fingerprint": {
    "hostname": "dl360-elena",
    "mac_addresses": ["aa:bb:cc:dd:ee:ff"],
    "cpu_id": "BFEBFBFF000906EA",
    "os": "Ubuntu 22.04.4 LTS",
    "kernel": "5.15.0-112-generic"
  },
  "provision_secret": "<one-time provisioning secret set by admin>"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `agent_id` | string | Yes | Must match a pre-registered slot in the `agents` table |
| `agent_name` | string | Yes | Human-readable name |
| `role` | string | Yes | `admin` or `agent` |
| `fingerprint` | object | Yes | Machine fingerprint object — see Fingerprints section |
| `provision_secret` | string | Yes | One-time secret set by Nico; expires after use |

**Response Body (201 Created):**

```json
{
  "agent_id": "agent-1",
  "token": "<bearer_token_plaintext>",
  "activated_at": "2026-04-15T14:00:00Z",
  "message": "Agent activated. Store this token securely — it will not be shown again."
}
```

**Notes:** Token is stored as bcrypt hash. Plaintext is returned once. If lost, Nico must revoke and reissue via admin CLI.

---

### POST /api/security/verify

**Description:** Validates the agent's token and fingerprint on every startup. Called by NanoClaw runtime at boot before any task execution begins. Returns agent status and manifest reference. Fails hard if fingerprint does not match the registered one — this is a security boundary.

**Auth required:** Yes

**Who can call it:** Any activated agent (itself only — token + agent ID must match)

**Request Body:**

```json
{
  "fingerprint": {
    "hostname": "dl360-elena",
    "mac_addresses": ["aa:bb:cc:dd:ee:ff"],
    "cpu_id": "BFEBFBFF000906EA",
    "os": "Ubuntu 22.04.4 LTS",
    "kernel": "5.15.0-112-generic"
  }
}
```

**Response Body (200 OK):**

```json
{
  "agent_id": "agent-1",
  "agent_name": "Elena",
  "role": "agent",
  "status": "online",
  "fingerprint_valid": true,
  "manifest_id": "manifest-agent-1-v3",
  "verified_at": "2026-04-15T14:01:05Z"
}
```

**Response Body (403 Forbidden — fingerprint mismatch):**

```json
{
  "error": true,
  "code": "FINGERPRINT_MISMATCH",
  "message": "Machine fingerprint does not match registered fingerprint for agent-1.",
  "timestamp": "2026-04-15T14:01:05Z"
}
```

**Notes:** A fingerprint mismatch triggers an automatic `high` severity incident record (server-side, no agent action required). Nico is alerted via monitoring.

---

### GET /api/security/fingerprint/register

**Description:** Retrieves the current stored fingerprint for this agent. Used by the agent to confirm what fingerprint Nexus has on record, or by Nico to review/update after hardware replacement.

**Auth required:** Yes

**Who can call it:** The agent itself (own record only), or admin.

**Query Parameters:** None

**Response Body (200 OK):**

```json
{
  "agent_id": "agent-1",
  "fingerprint": {
    "hostname": "dl360-elena",
    "mac_addresses": ["aa:bb:cc:dd:ee:ff"],
    "cpu_id": "BFEBFBFF000906EA",
    "os": "Ubuntu 22.04.4 LTS",
    "kernel": "5.15.0-112-generic"
  },
  "registered_at": "2026-04-15T14:00:00Z",
  "last_verified_at": "2026-04-15T14:01:05Z"
}
```

**Note on naming:** Despite the HTTP verb being GET, this endpoint is named `/register` because it also supports updating the fingerprint when called via `PUT /api/security/fingerprint/register` (admin only — used after hardware replacement). GET returns the stored fingerprint. PUT replaces it.

---

### PUT /api/security/fingerprint/register

**Description:** Updates the stored machine fingerprint for this agent. Used after hardware replacement or OS reinstall. Admin-only to prevent unauthorized fingerprint swapping.

**Auth required:** Yes

**Who can call it:** Admin only.

**Request Body:**

```json
{
  "agent_id": "agent-1",
  "fingerprint": {
    "hostname": "dl360-elena",
    "mac_addresses": ["aa:bb:cc:dd:ee:ff"],
    "cpu_id": "NEW_CPU_ID_AFTER_SWAP",
    "os": "Ubuntu 22.04.4 LTS",
    "kernel": "5.15.0-115-generic"
  },
  "reason": "DL360 NIC replaced on 2026-04-14"
}
```

**Response Body (200 OK):**

```json
{
  "agent_id": "agent-1",
  "updated": true,
  "updated_at": "2026-04-15T14:05:00Z"
}
```

---

### POST /api/security/incidents

**Description:** Agent reports a security incident — crash, anomaly, intrusion attempt, unexpected behavior, or failed verification. Stored in the `incidents` table. High severity incidents trigger an alert in the monitoring layer.

**Auth required:** Yes

**Who can call it:** Any activated agent (reports on itself), or admin (can report on behalf of any agent).

**Request Body:**

```json
{
  "agent_id": "agent-1",
  "severity": "high",
  "type": "intrusion_attempt",
  "description": "Unexpected inbound SSH connection attempt from 10.0.0.99 at 14:02:33.",
  "context": {
    "source_ip": "10.0.0.99",
    "process": "sshd",
    "raw_log": "/var/log/auth.log line 4421"
  },
  "occurred_at": "2026-04-15T14:02:33Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `agent_id` | string | Yes | Must match authenticated agent (or any agent if admin) |
| `severity` | string | Yes | `low`, `medium`, `high`, `critical` |
| `type` | string | Yes | `crash`, `anomaly`, `intrusion_attempt`, `unexpected_egress`, `fingerprint_mismatch`, `token_failure`, `other` |
| `description` | string | Yes | Human-readable summary |
| `context` | object | No | Arbitrary key-value metadata |
| `occurred_at` | ISO8601 string | Yes | When the incident occurred |

**Response Body (201 Created):**

```json
{
  "incident_id": "inc-20260415-00042",
  "received_at": "2026-04-15T14:02:45Z",
  "severity": "high",
  "status": "open"
}
```

---

## 2. AGENTS

### GET /api/agents

**Description:** Returns a list of all registered agents with their current status, last heartbeat time, and role. Full roster view.

**Auth required:** Yes

**Who can call it:** Admin only.

**Query Parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | Filter by `online`, `offline`, `degraded` |
| `role` | string | No | Filter by `admin`, `agent`, `readonly` |

**Response Body (200 OK):**

```json
{
  "agents": [
    {
      "agent_id": "agent-0",
      "agent_name": "Nico",
      "role": "admin",
      "status": "online",
      "last_heartbeat_at": "2026-04-15T14:03:00Z",
      "last_active_at": "2026-04-15T14:03:00Z",
      "activated_at": "2026-04-10T09:00:00Z",
      "hardware": "Mac Studio M4 Max"
    },
    {
      "agent_id": "agent-1",
      "agent_name": "Elena",
      "role": "agent",
      "status": "online",
      "last_heartbeat_at": "2026-04-15T14:02:58Z",
      "last_active_at": "2026-04-15T14:02:58Z",
      "activated_at": "2026-04-12T10:00:00Z",
      "hardware": "DL360"
    }
  ],
  "total": 6,
  "online": 4,
  "offline": 1,
  "degraded": 1
}
```

---

### GET /api/agents/:id

**Description:** Get full status record for a specific agent — status, heartbeat, last active, task counts, current running task if any.

**Auth required:** Yes

**Who can call it:** Admin (any agent), or the agent itself.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Agent ID, e.g. `agent-1` |

**Response Body (200 OK):**

```json
{
  "agent_id": "agent-1",
  "agent_name": "Elena",
  "role": "agent",
  "status": "online",
  "hardware": "DL360",
  "last_heartbeat_at": "2026-04-15T14:02:58Z",
  "last_active_at": "2026-04-15T14:02:58Z",
  "activated_at": "2026-04-12T10:00:00Z",
  "task_counts": {
    "pending": 2,
    "running": 1,
    "completed": 47,
    "failed": 3
  },
  "current_task_id": "task-0099",
  "incident_count_last_24h": 0
}
```

---

### PATCH /api/agents/:id

**Description:** Update an agent's status field. Agents update themselves (e.g. going offline gracefully). Admin can force any status update.

**Auth required:** Yes

**Who can call it:** Agent itself (status update only), or admin (any field).

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Agent ID |

**Request Body:**

```json
{
  "status": "degraded",
  "status_reason": "High memory usage — swap active on DL360",
  "metadata": {
    "memory_used_pct": 94,
    "swap_used_gb": 8
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | Yes | `online`, `offline`, `degraded` |
| `status_reason` | string | No | Human-readable explanation |
| `metadata` | object | No | Arbitrary key-value context |

**Response Body (200 OK):**

```json
{
  "agent_id": "agent-1",
  "status": "degraded",
  "updated_at": "2026-04-15T14:04:00Z"
}
```

---

### GET /api/agents/:id/manifest

**Description:** Returns the role manifest for the specified agent. The manifest defines: allowed tools, egress whitelist, permitted API endpoints, memory scope, model permissions, and any venture-specific restrictions.

**Auth required:** Yes

**Who can call it:** The agent itself (own manifest only), or admin.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Agent ID |

**Response Body (200 OK):**

```json
{
  "manifest_id": "manifest-agent-1-v3",
  "agent_id": "agent-1",
  "agent_name": "Elena",
  "version": 3,
  "updated_at": "2026-04-14T09:00:00Z",
  "updated_by": "agent-0",
  "allowed_tools": [
    "bash",
    "file_read",
    "file_write",
    "http_outbound",
    "postgres_read",
    "postgres_write",
    "telegram_reply"
  ],
  "egress_whitelist": [
    "nexus.quorbz.internal",
    "api.x.ai",
    "github.com",
    "registry.npmjs.org"
  ],
  "permitted_nexus_endpoints": [
    "GET /api/agents/agent-1",
    "POST /api/agents/agent-1/heartbeat",
    "POST /api/tasks",
    "GET /api/tasks/:id",
    "PATCH /api/tasks/:id",
    "POST /api/tasks/checkpoint",
    "GET /api/tasks/interrupted",
    "POST /api/security/incidents",
    "GET /api/agents/agent-1/manifest"
  ],
  "model_permissions": {
    "primary": "grok-4-1-fast-reasoning",
    "secondary": "grok-code-fast-1",
    "image_gen": "grok-imagine-image-pro",
    "video_gen": false,
    "voice": false
  },
  "venture_scope": ["venture-1", "venture-2"],
  "memory_scope": "agent-1-only",
  "notes": "Elena is President. Coordinates all other agents except Nico and Leo."
}
```

---

### POST /api/agents/:id/heartbeat

**Description:** Agent sends a heartbeat every 60 seconds to confirm it is alive and healthy. Missed heartbeats trigger monitoring alerts after 3 consecutive misses (180 seconds). Heartbeat includes basic vitals.

**Auth required:** Yes

**Who can call it:** The agent itself only. Admin cannot send heartbeats on behalf of another agent.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Agent ID |

**Request Body:**

```json
{
  "status": "online",
  "vitals": {
    "cpu_pct": 12.4,
    "memory_used_pct": 58.2,
    "disk_used_pct": 34.1,
    "swap_used_gb": 0,
    "load_avg_1m": 1.2,
    "uptime_seconds": 86400
  },
  "current_task_id": "task-0099",
  "timestamp": "2026-04-15T14:05:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | Yes | `online`, `degraded` |
| `vitals` | object | Yes | OS vitals snapshot |
| `current_task_id` | string | No | Active task ID if applicable |
| `timestamp` | ISO8601 string | Yes | Agent-side timestamp (drift monitored) |

**Response Body (200 OK):**

```json
{
  "received_at": "2026-04-15T14:05:00Z",
  "next_expected_at": "2026-04-15T14:06:00Z",
  "pending_directives": []
}
```

**Notes:** `pending_directives` is a reserved field for future use — allows Nexus to push a directive to an agent on its next heartbeat (e.g. soft restart, manifest refresh). Currently always empty array.

---

## 3. TASKS

### POST /api/tasks

**Description:** Create a new task. Tasks are the unit of work assigned to or created by agents. Any agent can create tasks (for themselves or, if admin, for others).

**Auth required:** Yes

**Who can call it:** Any activated agent.

**Request Body:**

```json
{
  "title": "Research top 10 Etsy digital download niches for Q2 2026",
  "description": "Use search trends, Etsy bestseller data, and competitor analysis to identify the top 10 high-margin digital download niches for Q2.",
  "assigned_to": "agent-4",
  "created_by": "agent-1",
  "venture_id": "venture-1",
  "priority": "high",
  "type": "research",
  "tags": ["etsy", "digital-products", "q2-2026"],
  "due_at": "2026-04-16T18:00:00Z",
  "parent_task_id": null,
  "metadata": {}
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | Short task title |
| `description` | string | No | Full task description |
| `assigned_to` | string | Yes | Agent ID to perform the task |
| `created_by` | string | Yes | Must match authenticated agent (or admin) |
| `venture_id` | string | No | Links task to a venture for P&L attribution |
| `priority` | string | No | `low`, `medium`, `high`, `critical`. Default: `medium` |
| `type` | string | No | `research`, `build`, `publish`, `review`, `monitor`, `other` |
| `tags` | array | No | Arbitrary string tags |
| `due_at` | ISO8601 string | No | Optional deadline |
| `parent_task_id` | string | No | For subtask relationships |
| `metadata` | object | No | Arbitrary key-value context |

**Response Body (201 Created):**

```json
{
  "task_id": "task-0100",
  "status": "pending",
  "created_at": "2026-04-15T14:06:00Z",
  "assigned_to": "agent-4",
  "created_by": "agent-1"
}
```

---

### GET /api/tasks/:id

**Description:** Retrieve full state of a task — status, progress, output, checkpoint count, error history.

**Auth required:** Yes

**Who can call it:** The assigned agent, the creating agent, or admin.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Task ID |

**Response Body (200 OK):**

```json
{
  "task_id": "task-0100",
  "title": "Research top 10 Etsy digital download niches",
  "description": "...",
  "status": "running",
  "progress_pct": 45,
  "assigned_to": "agent-4",
  "created_by": "agent-1",
  "venture_id": "venture-1",
  "priority": "high",
  "type": "research",
  "tags": ["etsy", "digital-products"],
  "created_at": "2026-04-15T14:06:00Z",
  "started_at": "2026-04-15T14:07:00Z",
  "completed_at": null,
  "due_at": "2026-04-16T18:00:00Z",
  "output": null,
  "error": null,
  "checkpoint_count": 3,
  "last_checkpoint_at": "2026-04-15T14:10:00Z",
  "parent_task_id": null,
  "metadata": {}
}
```

---

### PATCH /api/tasks/:id

**Description:** Update task status, progress, or output. Used throughout task execution lifecycle — from `pending` → `running` → `completed` or `failed`.

**Auth required:** Yes

**Who can call it:** The assigned agent or admin.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Task ID |

**Request Body:**

```json
{
  "status": "completed",
  "progress_pct": 100,
  "output": {
    "summary": "Top 10 niches identified: ...",
    "artifact_url": "nextcloud://quorbz/venture-1/research/etsy-niches-q2-2026.md"
  },
  "error": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | `pending`, `running`, `completed`, `failed`, `cancelled` |
| `progress_pct` | integer | No | 0–100 |
| `output` | object | No | Task result payload — free-form JSON |
| `error` | object/string | No | Error detail if `status: failed` |

**Response Body (200 OK):**

```json
{
  "task_id": "task-0100",
  "status": "completed",
  "updated_at": "2026-04-15T15:30:00Z"
}
```

---

### POST /api/tasks/checkpoint

**Description:** Write a task checkpoint. Checkpoints store intermediate state so a task can resume after a crash or restart without restarting from scratch. NanoClaw runtime calls this automatically at configurable intervals and at key execution milestones.

**Auth required:** Yes

**Who can call it:** The assigned agent for the task, or admin.

**Request Body:**

```json
{
  "task_id": "task-0100",
  "agent_id": "agent-4",
  "checkpoint_index": 4,
  "progress_pct": 60,
  "state": {
    "step": "analyzing_competitor_listings",
    "niches_found_so_far": ["printable planners", "digital journals"],
    "search_cursor": "page_7",
    "memory_refs": ["mem-0042", "mem-0043"]
  },
  "checkpointed_at": "2026-04-15T14:15:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `task_id` | string | Yes | Task being checkpointed |
| `agent_id` | string | Yes | Must match authenticated agent |
| `checkpoint_index` | integer | Yes | Sequential index — monotonically increasing |
| `progress_pct` | integer | No | Current progress |
| `state` | object | Yes | Arbitrary serialized execution state |
| `checkpointed_at` | ISO8601 string | Yes | Agent-side timestamp |

**Response Body (201 Created):**

```json
{
  "checkpoint_id": "chk-task-0100-004",
  "task_id": "task-0100",
  "checkpoint_index": 4,
  "stored_at": "2026-04-15T14:15:01Z"
}
```

---

### GET /api/tasks/interrupted

**Description:** Returns all tasks currently in `pending` or `running` state assigned to the requesting agent. Used at agent startup to identify tasks that were interrupted by a crash or restart and need recovery.

**Auth required:** Yes

**Who can call it:** Any agent (returns only that agent's interrupted tasks). Admin returns all interrupted tasks across all agents.

**Query Parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `agent_id` | string | No | Admin only — filter by a specific agent |

**Response Body (200 OK):**

```json
{
  "interrupted_tasks": [
    {
      "task_id": "task-0100",
      "title": "Research top 10 Etsy digital download niches",
      "status": "running",
      "progress_pct": 60,
      "last_checkpoint": {
        "checkpoint_id": "chk-task-0100-004",
        "checkpoint_index": 4,
        "state": {
          "step": "analyzing_competitor_listings",
          "niches_found_so_far": ["printable planners", "digital journals"],
          "search_cursor": "page_7",
          "memory_refs": ["mem-0042", "mem-0043"]
        },
        "checkpointed_at": "2026-04-15T14:15:00Z"
      },
      "assigned_to": "agent-4",
      "created_by": "agent-1",
      "created_at": "2026-04-15T14:06:00Z"
    }
  ],
  "count": 1
}
```

---

## 4. LEADS

### POST /api/leads

**Description:** Capture a new lead from the customer-facing CS chatbot (Pico / Agent 7). Called when a site visitor provides contact information or asks a question that signals purchase intent. Leads are stored in the `leads` table and visible to Nico and Elena.

**Auth required:** Yes

**Who can call it:** Agent 7 (Pico, the CS bot) only. Admin can also call this.

**Request Body:**

```json
{
  "name": "Jordan Rivera",
  "email": "jordan.r@example.com",
  "question": "Do you have a bundle for Instagram templates?",
  "venture_id": "venture-1",
  "source": "quorbz.com/products/instagram-templates",
  "chatbot_session_id": "sess-20260415-8821",
  "metadata": {
    "page_url": "https://quorbz.com/products/instagram-templates",
    "referrer": "pinterest.com",
    "user_agent": "Mozilla/5.0..."
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Visitor-provided name |
| `email` | string | Yes | Contact email — must be valid format |
| `question` | string | No | The visitor's question or message |
| `venture_id` | string | Yes | Which venture/product triggered the lead |
| `source` | string | No | URL or channel that generated the lead |
| `chatbot_session_id` | string | No | Pico session ID for conversation lookup |
| `metadata` | object | No | Arbitrary context (browser, referrer, etc.) |

**Response Body (201 Created):**

```json
{
  "lead_id": "lead-00188",
  "status": "new",
  "captured_at": "2026-04-15T14:20:00Z"
}
```

---

### GET /api/leads

**Description:** List all captured leads. Supports filtering and pagination. Includes status, venture association, and contact data.

**Auth required:** Yes

**Who can call it:** Admin only.

**Query Parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | Filter by `new`, `contacted`, `converted`, `closed` |
| `venture_id` | string | No | Filter by venture |
| `since` | ISO8601 string | No | Return leads captured after this date |
| `limit` | integer | No | Default 50, max 200 |
| `offset` | integer | No | For pagination |

**Response Body (200 OK):**

```json
{
  "leads": [
    {
      "lead_id": "lead-00188",
      "name": "Jordan Rivera",
      "email": "jordan.r@example.com",
      "question": "Do you have a bundle for Instagram templates?",
      "venture_id": "venture-1",
      "source": "quorbz.com/products/instagram-templates",
      "status": "new",
      "captured_at": "2026-04-15T14:20:00Z",
      "last_updated_at": "2026-04-15T14:20:00Z",
      "notes": null
    }
  ],
  "total": 188,
  "limit": 50,
  "offset": 0
}
```

---

### PATCH /api/leads/:id

**Description:** Update a lead's status and add internal notes. Used by Elena or Nico when following up on a lead.

**Auth required:** Yes

**Who can call it:** Admin only.

**Path Parameters:**

| Param | Type | Notes |
|---|---|---|
| `id` | string | Lead ID |

**Request Body:**

```json
{
  "status": "contacted",
  "notes": "Replied via email on 2026-04-15 with bundle pricing info. Following up in 3 days.",
  "assigned_to": "agent-1"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | No | `new`, `contacted`, `converted`, `closed` |
| `notes` | string | No | Internal follow-up notes |
| `assigned_to` | string | No | Agent ID handling the lead |

**Response Body (200 OK):**

```json
{
  "lead_id": "lead-00188",
  "status": "contacted",
  "updated_at": "2026-04-15T14:25:00Z"
}
```

---

## 5. MONITORING

### GET /api/health

**Description:** Server health check endpoint. No authentication required. Returns whether Nexus and its database are reachable. Used by uptime monitors, load balancers, and agent startup checks.

**Auth required:** No

**Who can call it:** Anyone on the internal network.

**Response Body (200 OK — healthy):**

```json
{
  "status": "ok",
  "nexus_version": "1.0.0",
  "database": "connected",
  "uptime_seconds": 864000,
  "timestamp": "2026-04-15T14:30:00Z"
}
```

**Response Body (503 Service Unavailable — degraded):**

```json
{
  "status": "degraded",
  "nexus_version": "1.0.0",
  "database": "disconnected",
  "uptime_seconds": 864000,
  "timestamp": "2026-04-15T14:30:00Z",
  "error": "PostgreSQL connection pool exhausted"
}
```

---

### GET /api/metrics

**Description:** Returns an aggregate summary of agent activity — task counts by status, heartbeat health across all agents, error rates, and incident counts. Primary data source for the Grafana dashboard.

**Auth required:** Yes

**Who can call it:** Admin only.

**Query Parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `window` | string | No | Time window: `1h`, `6h`, `24h`, `7d`. Default: `24h` |

**Response Body (200 OK):**

```json
{
  "window": "24h",
  "generated_at": "2026-04-15T14:30:00Z",
  "agents": {
    "total": 6,
    "online": 5,
    "offline": 0,
    "degraded": 1,
    "heartbeat_health": [
      {
        "agent_id": "agent-0",
        "agent_name": "Nico",
        "status": "online",
        "last_heartbeat_at": "2026-04-15T14:29:00Z",
        "missed_heartbeats_last_hour": 0
      },
      {
        "agent_id": "agent-3",
        "agent_name": "Mila",
        "status": "degraded",
        "last_heartbeat_at": "2026-04-15T13:55:00Z",
        "missed_heartbeats_last_hour": 3
      }
    ]
  },
  "tasks": {
    "total_in_window": 42,
    "by_status": {
      "pending": 4,
      "running": 3,
      "completed": 33,
      "failed": 2,
      "cancelled": 0
    },
    "failure_rate_pct": 4.76,
    "avg_completion_time_seconds": 312
  },
  "incidents": {
    "total_in_window": 1,
    "by_severity": {
      "low": 0,
      "medium": 1,
      "high": 0,
      "critical": 0
    },
    "open": 1,
    "resolved": 0
  },
  "leads": {
    "total_in_window": 12,
    "by_status": {
      "new": 8,
      "contacted": 3,
      "converted": 1,
      "closed": 0
    }
  }
}
```

---

### GET /api/logs

**Description:** Returns recent structured log entries from Nexus. Useful for debugging, incident investigation, and audit trails. Logs include authentication events, task state changes, heartbeat anomalies, and system events.

**Auth required:** Yes

**Who can call it:** Admin only.

**Query Parameters:**

| Param | Type | Required | Notes |
|---|---|---|---|
| `level` | string | No | `debug`, `info`, `warn`, `error`. Default: `info` and above |
| `agent_id` | string | No | Filter logs by agent |
| `since` | ISO8601 string | No | Return logs after this time. Default: last 1 hour |
| `limit` | integer | No | Default 100, max 500 |
| `search` | string | No | Free-text substring search against `message` field |

**Response Body (200 OK):**

```json
{
  "logs": [
    {
      "log_id": "log-20260415-009921",
      "level": "warn",
      "agent_id": "agent-3",
      "message": "Heartbeat missed — expected at 13:56:00, received at 14:01:12",
      "context": {
        "expected_at": "2026-04-15T13:56:00Z",
        "received_at": "2026-04-15T14:01:12Z",
        "delay_seconds": 312
      },
      "timestamp": "2026-04-15T14:01:12Z"
    },
    {
      "log_id": "log-20260415-009922",
      "level": "info",
      "agent_id": "agent-4",
      "message": "Task task-0100 status changed to completed",
      "context": {
        "task_id": "task-0100",
        "old_status": "running",
        "new_status": "completed"
      },
      "timestamp": "2026-04-15T15:30:00Z"
    }
  ],
  "total": 2,
  "limit": 100,
  "offset": 0
}
```

---

## 6. DATABASE SCHEMA

All tables reside in the `nexus` schema on PostgreSQL running on DL380. Engine: PostgreSQL 15+.

---

### agents

Stores the canonical record for every agent in the org.

```sql
CREATE TABLE nexus.agents (
    agent_id          VARCHAR(32)   PRIMARY KEY,                -- e.g. 'agent-0', 'agent-1'
    agent_name        VARCHAR(64)   NOT NULL,                   -- e.g. 'Nico', 'Elena'
    role              VARCHAR(16)   NOT NULL                    -- 'admin' | 'agent' | 'readonly'
                      CHECK (role IN ('admin', 'agent', 'readonly')),
    status            VARCHAR(16)   NOT NULL DEFAULT 'offline'  -- 'online' | 'offline' | 'degraded'
                      CHECK (status IN ('online', 'offline', 'degraded')),
    status_reason     TEXT,
    hardware          VARCHAR(128),                             -- e.g. 'Mac Studio M4 Max'
    token_hash        VARCHAR(256)  NOT NULL,                   -- bcrypt hash of bearer token
    activated         BOOLEAN       NOT NULL DEFAULT FALSE,
    activated_at      TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ,
    last_active_at    TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_status ON nexus.agents(status);
```

---

### fingerprints

Stores registered machine fingerprints for each agent. Used to validate identity on every startup.

```sql
CREATE TABLE nexus.fingerprints (
    fingerprint_id    SERIAL        PRIMARY KEY,
    agent_id          VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id) ON DELETE CASCADE,
    hostname          VARCHAR(256),
    mac_addresses     TEXT[],                                   -- array of MAC strings
    cpu_id            VARCHAR(128),
    os                VARCHAR(256),
    kernel            VARCHAR(256),
    raw_fingerprint   JSONB,                                    -- full fingerprint object
    registered_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_verified_at  TIMESTAMPTZ,
    updated_by        VARCHAR(32),                              -- agent_id of admin who last updated
    update_reason     TEXT,
    UNIQUE (agent_id)
);
```

---

### manifests

Stores role manifests defining each agent's permissions, tools, egress rules, and model access.

```sql
CREATE TABLE nexus.manifests (
    manifest_id               VARCHAR(64)   PRIMARY KEY,        -- e.g. 'manifest-agent-1-v3'
    agent_id                  VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id) ON DELETE CASCADE,
    version                   INTEGER       NOT NULL DEFAULT 1,
    allowed_tools             TEXT[],
    egress_whitelist          TEXT[],
    permitted_nexus_endpoints TEXT[],
    model_permissions         JSONB,
    venture_scope             TEXT[],
    memory_scope              VARCHAR(128),
    notes                     TEXT,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_by                VARCHAR(32),
    UNIQUE (agent_id, version)
);

CREATE INDEX idx_manifests_agent ON nexus.manifests(agent_id);
```

---

### heartbeats

Rolling log of all heartbeat pings from agents. Retained for 30 days. Used for heartbeat gap detection and Grafana time-series.

```sql
CREATE TABLE nexus.heartbeats (
    heartbeat_id      BIGSERIAL     PRIMARY KEY,
    agent_id          VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id) ON DELETE CASCADE,
    status            VARCHAR(16)   NOT NULL,
    cpu_pct           NUMERIC(5,2),
    memory_used_pct   NUMERIC(5,2),
    disk_used_pct     NUMERIC(5,2),
    swap_used_gb      NUMERIC(8,2),
    load_avg_1m       NUMERIC(6,2),
    uptime_seconds    BIGINT,
    current_task_id   VARCHAR(64),
    agent_timestamp   TIMESTAMPTZ   NOT NULL,
    received_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heartbeats_agent_time ON nexus.heartbeats(agent_id, received_at DESC);

-- Automatic cleanup: retain 30 days
-- Implemented via pg_cron or a daily maintenance job
```

---

### tasks

Core task records — one row per task regardless of status.

```sql
CREATE TABLE nexus.tasks (
    task_id           VARCHAR(64)   PRIMARY KEY,                -- e.g. 'task-0100'
    title             VARCHAR(256)  NOT NULL,
    description       TEXT,
    status            VARCHAR(16)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress_pct      SMALLINT      DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    assigned_to       VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id),
    created_by        VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id),
    venture_id        VARCHAR(64),
    priority          VARCHAR(16)   NOT NULL DEFAULT 'medium'
                      CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    type              VARCHAR(32),
    tags              TEXT[],
    output            JSONB,
    error             JSONB,
    parent_task_id    VARCHAR(64)   REFERENCES nexus.tasks(task_id),
    due_at            TIMESTAMPTZ,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    metadata          JSONB,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON nexus.tasks(assigned_to, status);
CREATE INDEX idx_tasks_status ON nexus.tasks(status);
CREATE INDEX idx_tasks_venture ON nexus.tasks(venture_id);
CREATE INDEX idx_tasks_created ON nexus.tasks(created_at DESC);

-- Auto-generate task_id via sequence + trigger or application layer
```

---

### checkpoints

Stores task execution checkpoints for crash recovery. Retains all checkpoints for a task until it completes, then archives or prunes after 7 days.

```sql
CREATE TABLE nexus.checkpoints (
    checkpoint_id       VARCHAR(128)  PRIMARY KEY,              -- e.g. 'chk-task-0100-004'
    task_id             VARCHAR(64)   NOT NULL REFERENCES nexus.tasks(task_id) ON DELETE CASCADE,
    agent_id            VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id),
    checkpoint_index    INTEGER       NOT NULL,
    progress_pct        SMALLINT      DEFAULT 0,
    state               JSONB         NOT NULL,
    agent_timestamp     TIMESTAMPTZ   NOT NULL,
    stored_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, checkpoint_index)
);

CREATE INDEX idx_checkpoints_task ON nexus.checkpoints(task_id, checkpoint_index DESC);
```

---

### incidents

Security incidents and anomalies reported by agents or auto-generated by Nexus.

```sql
CREATE TABLE nexus.incidents (
    incident_id       VARCHAR(64)   PRIMARY KEY,                -- e.g. 'inc-20260415-00042'
    agent_id          VARCHAR(32)   NOT NULL REFERENCES nexus.agents(agent_id),
    severity          VARCHAR(16)   NOT NULL
                      CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    type              VARCHAR(64)   NOT NULL,                   -- 'crash' | 'anomaly' | 'intrusion_attempt' | etc.
    description       TEXT          NOT NULL,
    context           JSONB,
    status            VARCHAR(16)   NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_notes  TEXT,
    source            VARCHAR(16)   NOT NULL DEFAULT 'agent'    -- 'agent' | 'system'
                      CHECK (source IN ('agent', 'system')),
    occurred_at       TIMESTAMPTZ   NOT NULL,
    received_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    resolved_at       TIMESTAMPTZ,
    resolved_by       VARCHAR(32)
);

CREATE INDEX idx_incidents_severity ON nexus.incidents(severity, status);
CREATE INDEX idx_incidents_agent ON nexus.incidents(agent_id, occurred_at DESC);
CREATE INDEX idx_incidents_status ON nexus.incidents(status);
```

---

### leads

Customer leads captured by Pico (Agent 7) from Quorbz venture sites.

```sql
CREATE TABLE nexus.leads (
    lead_id               VARCHAR(64)   PRIMARY KEY,            -- e.g. 'lead-00188'
    name                  VARCHAR(256),
    email                 VARCHAR(256)  NOT NULL,
    question              TEXT,
    venture_id            VARCHAR(64)   NOT NULL,
    source                VARCHAR(512),
    chatbot_session_id    VARCHAR(128),
    status                VARCHAR(16)   NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    notes                 TEXT,
    assigned_to           VARCHAR(32)   REFERENCES nexus.agents(agent_id),
    metadata              JSONB,
    captured_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON nexus.leads(status);
CREATE INDEX idx_leads_venture ON nexus.leads(venture_id);
CREATE INDEX idx_leads_captured ON nexus.leads(captured_at DESC);
CREATE INDEX idx_leads_email ON nexus.leads(email);
```

---

### logs

Structured log entries written by Nexus server processes. Rolling retention — 7 days default.

```sql
CREATE TABLE nexus.logs (
    log_id        VARCHAR(64)   PRIMARY KEY,
    level         VARCHAR(8)    NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    agent_id      VARCHAR(32)   REFERENCES nexus.agents(agent_id),
    message       TEXT          NOT NULL,
    context       JSONB,
    timestamp     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_level_time ON nexus.logs(level, timestamp DESC);
CREATE INDEX idx_logs_agent_time ON nexus.logs(agent_id, timestamp DESC);
CREATE INDEX idx_logs_time ON nexus.logs(timestamp DESC);

-- Partition by day or use pg_cron for rolling 7-day cleanup
```

---

## Appendix A: Agent ID Reference

| Agent ID | Name | Role | Hardware |
|---|---|---|---|
| `agent-0` | Nico | CTO / Admin | Mac Studio M4 Max |
| `agent-1` | Elena | President | DL360 |
| `agent-2` | Leo | CFO / Legal | DL380 |
| `agent-3` | Mila | CMO | Mac Studio M4 Max |
| `agent-4` | Marco | CPO | Mac Mini M4 24GB |
| `agent-5` | Maya | CSO | Mac Mini M4 |
| `agent-7` | Pico | CS Bot | Isolated container |

---

## Appendix B: Task Status Lifecycle

```
pending → running → completed
                 → failed
         cancelled  (from any state except completed)
```

On agent restart, NanoClaw calls `GET /api/tasks/interrupted` to find all `pending` or `running` tasks, retrieves the latest checkpoint for each, and resumes execution from that checkpoint state.

---

## Appendix C: Heartbeat Gap Detection Logic

Nexus runs a background worker every 60 seconds that checks all `online` agents for heartbeat gaps:

- Gap > 120s → log `warn`, flag agent as potentially degraded
- Gap > 180s (3 missed) → set agent status to `degraded`, create `medium` incident
- Gap > 600s (10 missed) → set agent status to `offline`, create `high` incident, alert Grafana

---

## Appendix D: Security Incident Auto-Generation

Nexus generates incidents server-side (without agent action) for:

| Trigger | Severity | Type |
|---|---|---|
| Fingerprint mismatch on verify | `high` | `fingerprint_mismatch` |
| Token used from unknown agent ID | `high` | `token_failure` |
| Rate limit exceeded >3x in 5 minutes | `medium` | `anomaly` |
| Heartbeat gap >600s | `high` | `anomaly` |
| Database write failure during task update | `medium` | `anomaly` |

---

## Appendix E: NanoClaw Runtime Integration Points

NanoClaw superfork calls Nexus at the following lifecycle moments:

| Event | Nexus Call |
|---|---|
| Process start | `POST /api/security/verify` |
| Every 60 seconds | `POST /api/agents/:id/heartbeat` |
| Task received | `PATCH /api/tasks/:id` (status: running) |
| Milestone reached | `POST /api/tasks/checkpoint` |
| Crash detected | `POST /api/security/incidents` |
| Task completed | `PATCH /api/tasks/:id` (status: completed) |
| Process clean shutdown | `PATCH /api/agents/:id` (status: offline) |
| Process restart | `GET /api/tasks/interrupted` + resume from checkpoint |
