# U-AIX OS API Specification

This document defines the REST API endpoints and WebSocket protocols for communication between U-AIX OS clients, runtimes, and local model servers.

---

## 1. REST API Endpoints Specification

Base endpoint URL for local configurations defaults to `http://localhost:5000/api/v1`.

### Endpoint 1: Run Agent Intent Loop
- **Method & Path**: `POST /agent/run`
- **Headers**:
  - `Content-Type: application/json`
  - `X-UAIX-Identity: <Cryptographic Public Key Hash>`
- **Request Body JSON**:
  ```json
  {
    "intent": "Perform deep research on FOSS LLMs and compile markdown report",
    "agent_id": "auto_planner_agent",
    "model_override": "llama3",
    "parameters": {
      "temperature": 0.2,
      "max_tokens": 4096
    }
  }
  ```
- **Responses**:
  - `202 Accepted` (Task started in background thread):
    ```json
    {
      "success": true,
      "execution_id": "exec_40912ae-330f",
      "status": "pending",
      "created_at": "2026-06-23T08:15:00.000Z"
    }
    ```
  - `400 Bad Request` (Invalid payload parameters):
    ```json
    {
      "success": false,
      "error": "ERR_INVALID_INTENT",
      "message": "The intent parameter cannot be empty."
    }
    ```

---

### Endpoint 2: Get Execution Status & Logs
- **Method & Path**: `GET /agent/execution/:id`
- **Parameters**: `id` (String UUID of target execution)
- **Responses**:
  - `200 OK` (Execution retrieved successfully):
    ```json
    {
      "execution_id": "exec_40912ae-330f",
      "status": "completed",
      "runtime_ms": 4850,
      "steps": [
        { "name": "intent_analysis", "status": "completed", "duration_ms": 420 },
        { "name": "research_agent_run", "status": "completed", "duration_ms": 2200 },
        { "name": "validator_check", "status": "completed", "duration_ms": 2230 }
      ],
      "output": "Markdown Output: ..."
    }
    ```
  - `404 Not Found` (Target task not found in database):
    ```json
    {
      "success": false,
      "error": "ERR_EXECUTION_NOT_FOUND",
      "message": "The specified execution ID does not exist."
    }
    ```

---

### Endpoint 3: Register Custom Skill
- **Method & Path**: `POST /skills/install`
- **Request Body JSON**:
  ```json
  {
    "skill_id": "image-optimizer",
    "manifest": {
      "name": "ImageOptimizer",
      "version": "1.0.0",
      "permissions": ["file_system", "clipboard"],
      "script_url": "file:///local/scripts/optimizer.js"
    }
  }
  ```
- **Responses**:
  - `201 Created` (Skill parsed, scanned and compiled successfully):
    ```json
    {
      "success": true,
      "installed_id": "image-optimizer",
      "active_permissions": ["file_system", "clipboard"]
    }
    ```
  - `403 Forbidden` (AST Scanner detected security bypasses or blocked tokens):
    ```json
    {
      "success": false,
      "error": "ERR_AST_SAFETY_FAIL",
      "message": "Forbidden raw usage of eval() blocks sandbox compilation."
    }
    ```

---

### Endpoint 4: Direct Memory Vault Injection
- **Method & Path**: `POST /memory/store`
- **Request Body JSON**:
  ```json
  {
    "content": "User prefers coding in Python using VSCode.",
    "memory_type": "personal",
    "associated_keys": ["editor", "python"]
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "memory_id": "mem_88292ae-bb91",
      "vector_indexed": true
    }
    ```

---

## 2. WebSocket Protocol Specifications (Real-Time Streams)

Used to stream step-by-step logs from executing agent sandboxes to UI clients.
- **Connection URL**: `ws://localhost:5000/api/v1/stream`

### Frame 1: Client Subscription Event
```json
{
  "action": "subscribe",
  "execution_id": "exec_40912ae-330f"
}
```

### Frame 2: Log Emission Event (From Runtime Server)
```json
{
  "event": "log_emitted",
  "execution_id": "exec_40912ae-330f",
  "timestamp": "2026-06-23T08:15:02.124Z",
  "agent_name": "Coder Agent",
  "step": "compiling_wasm",
  "log_text": "Compiling entrypoint.js into sandboxed WebAssembly environment...",
  "status": "info"
}
```

### Frame 3: Verification Completed Event
```json
{
  "event": "execution_completed",
  "execution_id": "exec_40912ae-330f",
  "timestamp": "2026-06-23T08:15:04.850Z",
  "output_response": "Scrape completed successfully. Written to folder.",
  "cost_tokens": 1420,
  "runtime_ms": 4850
}
```
