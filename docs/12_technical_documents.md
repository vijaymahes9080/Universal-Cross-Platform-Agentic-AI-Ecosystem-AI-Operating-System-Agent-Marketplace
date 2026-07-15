# U-AIX OS Technical Specifications Document

This document details the internal sub-systems of U-AIX OS: **Memory Syncing Specification** and **Multi-Model Router Scoring Logic**.

---

## 1. Memory Syncing Specification

Session contexts in U-AIX transition from active memory (RAM) variables down to persistent database schemas:

```
[Agent Execution Session]
           │
           ▼ (Collect thoughts, tool inputs & outputs)
   [Session log array (RAM)]
           │
           ▼ (Parse content via local embedder model)
   [Generate 384-dimensional vector embedding]
           │
     ┌─────┴──────────────────────────────────────┐
     ▼                                            ▼
[SQLite-vss Virtual Table]             [memory_relations SQL Table]
(Stores vector dimensions index)       (Maps links: Node A --relation--> Node B)
```

### Context Persistence Sequence
1. **Collector Loop**: The SDK tracks inputs, executed functions, outputs, and model replies, saving them in a session log array.
2. **Dynamic Segmenting**: Upon completion, logs are chunked using sentence-boundary algorithms (typically 500-1000 tokens).
3. **ONNX Vectorization**: Chunks are processed via a local embedding model (e.g. `all-MiniLM-L6-v2` loaded in browser web assembly or ONNX runtime) to generate a 384-dimensional floating point vector.
4. **Relational Sync**: Entities are extracted via regex or local models (e.g., matching "Python", "Project Alpha", "Ollama") and links are stored in the `memory_relations` SQL table.

---

## 2. Multi-Model Router Scoring Logic Schema

The router dynamically scores candidate models across four metrics: **Privacy Requirements**, **Task Complexity**, **Latency Constraints**, and **Cost Budgets**.

### Multi-Model Routing Logic Matrix

| Target Option | Privacy Weight | Complexity Weight | Latency Weight | Cost Weight |
|---|---|---|---|---|
| **Local LLM** (Ollama/Llama.cpp) | **+100** (Strict local) | **+50** (Low) / **+10** (High) | **+40** (Low latency) | **+100** ($0.00 cost) |
| **Cloud FOSS** (RunPod Cluster) | **-50** (Needs network) | **+30** (Low) / **+50** (High) | **+10** (Cloud lag) | **+40** (Medium cost) |
| **Cloud Closed** (Claude/GPT-4o) | **-100** (Forbids privacy)| **+10** (Low) / **+100** (High) | **-20** (Network lag) | **-100** (Linear token cost)|

### Reference Routing Scoring Algorithm
```javascript
class MultiModelRouter {
    constructor(host, model) {
        this.host = host;
        this.model = model;
    }

    evaluateRoute(task) {
        const scores = {
            localLLM: 0,
            cloudFOSS: 0,
            cloudProprietary: 0
        };

        // 1. Privacy Evaluator
        if (task.isSensitive || task.containsCredentials || task.enforceOffline) {
            scores.localLLM += 100;
            scores.cloudProprietary -= 100;
            scores.cloudFOSS -= 50;
        }

        // 2. Complexity Evaluator
        if (task.complexity === 'low') {
            scores.localLLM += 50;
            scores.cloudFOSS += 20;
        } else if (task.complexity === 'medium') {
            scores.localLLM += 30;
            scores.cloudFOSS += 50;
            scores.cloudProprietary += 30;
        } else { // High Complexity (Advanced code synthesis)
            scores.localLLM += 10;
            scores.cloudFOSS += 45;
            scores.cloudProprietary += 100;
        }

        // 3. Latency Evaluator
        if (task.latencyTolerance === 'low') {
            scores.localLLM += 40; // Avoid network round-trips
            scores.cloudProprietary -= 20;
        }

        // 4. Cost Evaluator
        if (task.costSensitive) {
            scores.localLLM += 100; // Local run is $0.00
            scores.cloudProprietary -= 100;
        }

        // Resolve highest score
        const resolvedRoute = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        return {
            route: resolvedRoute,
            scores: scores
        };
    }
}
```
