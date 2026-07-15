# U-AIX OS Database Schema Specification

This document details the production SQLite (local-first) and PostgreSQL (cloud-scale) database design schemas for U-AIX OS.

---

## 1. Relational Entity Mapping (ERD)

```
  +------------------+          +-------------------+          +------------------+
  |      users       | 1      * |    executions     | *      1 |      agents      |
  |------------------|----------|-------------------|----------|------------------|
  | id (PK TEXT)     |          | id (PK TEXT)      |          | id (PK TEXT)     |
  | public_key TEXT  |          | user_id (FK TEXT) |          | name TEXT        |
  | profile_name TEXT|          | agent_id (FK TEXT)|          | manifest_json    |
  +------------------+          | status TEXT       |          +------------------+
                                | plan_json TEXT    |
                                +-------------------+
                                          | 1
                                          |
                                          | *
                                +-------------------+
                                |    agent_logs     |
                                |-------------------|
                                | id (PK INT)       |
                                | execution_id (FK) |
                                | step_name TEXT    |
                                | log_text TEXT     |
                                +-------------------+
```

---

## 2. Complete Database Schemas (SQL)

### Users & Identities
```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    profile_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_public_key ON users(public_key);
```

### Agents Directory
```sql
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    manifest_json TEXT NOT NULL,
    is_installed INTEGER DEFAULT 0,
    is_open_source INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_installed ON agents(is_installed);
```

### Skills Repository
```sql
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    permission_flags TEXT,
    entrypoint_js TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Executions & Workflows
```sql
CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    agent_id TEXT,
    status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'suspended')),
    input_prompt TEXT NOT NULL,
    output_response TEXT,
    plan_json TEXT,
    cost_tokens INTEGER DEFAULT 0,
    runtime_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    log_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(execution_id) REFERENCES executions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_execution ON agent_logs(execution_id);
```

### Memory Vault (Vector Semantic Store)
SQLite virtual structure using `sqlite-vss`:
```sql
-- Raw metadata and memory text
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    memory_type TEXT NOT NULL CHECK(memory_type IN ('session', 'personal', 'team', 'knowledge')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SQLite Vector Search Virtual Table
-- Compiled via: sqlite-vss load extension
CREATE VIRTUAL TABLE IF NOT EXISTS memory_embeddings USING vss0(
    vector_id INTEGER PRIMARY KEY,
    content_vector(384) -- 384 dimensions matching all-MiniLM-L6-v2 embeddings
);

-- Table linking UUID memories text to vss integer keys
CREATE TABLE IF NOT EXISTS memory_vector_map (
    memory_id TEXT NOT NULL,
    vector_id INTEGER NOT NULL,
    PRIMARY KEY (memory_id, vector_id),
    FOREIGN KEY(memory_id) REFERENCES memories(id) ON DELETE CASCADE
);
```

### Knowledge Graph Relations
```sql
CREATE TABLE IF NOT EXISTS memory_relations (
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, target_id, relation_type),
    FOREIGN KEY(source_id) REFERENCES memories(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES memories(id) ON DELETE CASCADE
);
```

---

## 3. Database Triggers & Auto-Updates

Auto-update execution modification dates:
```sql
CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```
