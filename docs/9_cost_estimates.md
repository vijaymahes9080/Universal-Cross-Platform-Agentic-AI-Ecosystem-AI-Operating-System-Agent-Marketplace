# U-AIX OS Cost Estimates Financial Specification

This document provides a detailed comparative financial audit between cloud-hosted closed API models, self-hosted open-source server clusters, and local-first sovereign execution on U-AIX OS.

---

## 1. Cost Math Formulation Model

To evaluate monthly operational costs ($C_{monthly}$), we apply the following formula:

$$C_{monthly} = N_{users} \times T_{tasks} \times \left( (Tok_{in} \times P_{in}) + (Tok_{out} \times P_{out}) \right) + C_{infra} + C_{license}$$

Where:
- $N_{users}$: Total active seats in organization.
- $T_{tasks}$: Average tasks run per user per month.
- $Tok_{in} / Tok_{out}$: Average tokens consumed per task.
- $P_{in} / P_{out}$: Price per token charged by API host.
- $C_{infra}$: Infrastructure hosting fees (Databases, server instances).
- $C_{license}$: Subscription seats platform fees.

---

## 2. Quantitative Comparative Financial Analysis

### Base Scenario Parameters
- Organization: **10 developers**
- Load: **1,000 tasks per user per month** (Total 10,000 tasks/month)
- Task Weight: **5,000 input tokens / 2,000 output tokens** (Context weight per agent loop run)
- Total Monthly Tokens: **50M Input / 20M Output**

### Expense Matrix Comparison

| Budget Metric | Closed Cloud API Stack (Claude 3.5 Sonnet / GPT-4o) | Self-Hosted Cloud FOSS Nodes (vLLM on RunPod/AWS) | U-AIX OS Local-First (RTX GPU / Apple Silicon) |
|---|---|---|---|
| **Input Token Unit Price** | $3.00 / 1M tokens | $0.20 / 1M tokens | **$0.00** |
| **Output Token Unit Price**| $15.00 / 1M tokens | $0.60 / 1M tokens | **$0.00** |
| **Tokens Consumption Bill**| $450.00 / month | $22.00 / month | **$0.00** |
| **Database Pinned Seats**  | $50.00 / month (Pinecone) | $30.00 / month (PGVector PG) | **$0.00** (Local SQLite-vss) |
| **Platform Licensing Seats**| $200.00 / month ($20/user seat) | **$0.00** (Open Source) | **$0.00** (FOSS MIT) |
| **Total Monthly Cost**     | **$700.00** | **$52.00** | **$0.00** |
| **Total Yearly Cost**      | **$8,400.00** | **$624.00** | **$0.00** |

---

## 3. Hardware Configurations Specification (Zero-Cost Runtimes)

The local engine routes workflows to local Ollama nodes based on client GPU/CPU profiles:

| Hardware Level | Hardware Specs | Model Target Quantization | Generation Velocity | Setup Overhead Cost |
|---|---|---|---|---|
| **Tier 1: Minimal** | 8GB RAM Laptop CPU only | Qwen-2.5-Coder-1.5B (Q4_K_M) | ~10-15 tokens/sec | **$0.00** (Existing laptop) |
| **Tier 2: Standard**| 16GB RAM M1/M2 Mac or RTX 3060 | Llama-3-8B (Q4_K_M) | ~35-50 tokens/sec | **$0.00** (Workstation GPU) |
| **Tier 3: Power**   | 32GB+ RAM or RTX 3090/4090 | Qwen-2.5-Coder-32B (Q4_K_M) | ~25-35 tokens/sec | **$0.00** (Development rig) |
| **Tier 4: Enterprise**| Dedicated server cluster (e.g. 1x NVIDIA A10G) | Llama-3-70B (FP8 / Q4) | ~40-60 tokens/sec | **$0.75 - $1.20 / hour** (AWS Node) |
