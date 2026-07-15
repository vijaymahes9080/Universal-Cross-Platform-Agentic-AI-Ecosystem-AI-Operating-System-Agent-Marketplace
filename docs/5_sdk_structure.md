# U-AIX OS SDK Structure Specification

This document provides the developer reference structure and full implementation interfaces for the **U-AIX SDK** in both Python and TypeScript.

---

## 1. Module Structure Mapping

```
uaix-sdk/
├── python/
│   ├── uaix/
│   │   ├── __init__.py
│   │   ├── agent.py         # Agent orchestrator & context loop classes
│   │   ├── skill.py         # Standard decorator declarations & parameter validation
│   │   ├── memory.py        # Vector lookup, schema mapping, and Graph relations
│   │   ├── router.py        # Local model endpoint bindings (Ollama / Llama.cpp)
│   │   └── client.py        # REST/WebSocket gateway
│   └── setup.py
└── typescript/
    ├── src/
    │   ├── agent.ts
    │   ├── skill.ts
    │   ├── memory.ts
    │   ├── router.ts
    │   └── client.ts
    ├── package.json
    └── tsconfig.json
```

---

## 2. Python SDK Library Reference

### `uaix/skill.py` (Decorator & Schema Mapping)
```python
import inspect
from typing import List, Callable, Dict, Any

class Skill:
    def __init__(self, name: str, version: str, permissions: List[str], description: str, handler: Callable):
        self.name = name
        self.version = version
        self.permissions = permissions
        self.description = description
        self.handler = handler

    def __call__(self, *args, **kwargs) -> Any:
        # Code safety parameters validation
        return self.handler(*args, **kwargs)

def skill(name: str, version: str, permissions: List[str] = None, description: str = ""):
    def decorator(func: Callable):
        return Skill(
            name=name,
            version=version,
            permissions=permissions or [],
            description=description,
            handler=func
        )
    return decorator
```

### `uaix/agent.py` (Core Agent Coordinator)
```python
class AgentContext:
    def __init__(self, execution_id: str):
        self.execution_id = execution_id
        self.log_buffer = []

    def log(self, message: str):
        self.log_buffer.append(message)
        print(f"[{self.execution_id}] {message}")

class Agent:
    def __init__(self, name: str, description: str, skills: List[Skill] = None):
        self.name = name
        self.description = description
        self.skills = {s.name: s for s in (skills or [])}
        self.status = "idle"

    def execute_task(self, prompt: str) -> str:
        raise NotImplementedError("Subclasses must implement execute_task.")
```

### `examples/cryptor_agent.py` (Executable Custom Script)
```python
from uaix.agent import Agent, AgentContext
from uaix.skill import skill
from uaix.memory import MemoryClient
from uaix.router import LocalRouter

# Connect local SQLite memory vault
memory = MemoryClient(endpoint="sqlite:///local_memory.db")
router = LocalRouter(host="http://localhost:11434", model="llama3")

@skill(
    name="WebScraper",
    version="1.0.0",
    permissions=["network"],
    description="Fetches text payload from target URLs"
)
def fetch_url(context: AgentContext, url: str) -> str:
    import urllib.request
    try:
        context.log(f"Scraping endpoint: {url}")
        with urllib.request.urlopen(url, timeout=5) as response:
            return response.read().decode('utf-8')[:3000]
    except Exception as e:
        return f"Fetch error: {str(e)}"

class CryptoAgent(Agent):
    def __init__(self):
        super().__init__(
            name="Cryptocurrency Auditor",
            description="Analyzes market patterns",
            skills=[fetch_url]
        )

    def execute_task(self, prompt: str) -> str:
        ctx = AgentContext(execution_id="exec_py_demo")
        
        # 1. Fetch relevant vector history
        history = memory.query(prompt, limit=2)
        
        # 2. Trigger scraper skill in sandbox
        data = self.skills["WebScraper"](ctx, "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
        
        # 3. Route parameters to local model
        response = router.generate(
            prompt=f"Context: {history}\nData: {data}\nTask: {prompt}"
        )
        
        # 4. Save results to graph
        memory.store(
            content=f"Crypto check result: {response[:100]}",
            memory_type="personal"
        )
        return response
```

---

## 3. TypeScript SDK Library Reference

### `src/skill.ts` (WASM Interface Type)
```typescript
export interface SkillConfig {
    name: string;
    version: string;
    permissions: string[];
    description?: string;
    handler: (context: AgentContext, ...args: any[]) => Promise<any>;
}

export function skill(config: SkillConfig): SkillConfig {
    // Validate parameters structure
    return config;
}
```

### `src/agent.ts` (Node-Link Orchestrator)
```typescript
import { SkillConfig } from './skill';

export interface AgentContext {
    executionId: string;
    fs: {
        readFile: (path: string) => Promise<string>;
        writeFile: (path: string, content: string) => Promise<void>;
    };
    log: (msg: string) => void;
}

export class Agent {
    public name: string;
    public skills: Record<string, Function>;

    constructor(config: { name: string; skills: SkillConfig[] }) {
        this.name = config.name;
        this.skills = {};
        config.skills.forEach(s => {
            this.skills[s.name] = s.handler;
        });
    }
}
```
