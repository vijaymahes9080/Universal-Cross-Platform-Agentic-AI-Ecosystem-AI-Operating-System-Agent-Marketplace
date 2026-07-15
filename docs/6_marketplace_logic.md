# U-AIX OS Marketplace Logic Specification

This document details the registry policies, security verification pipelines, AST analysis rules, and licensing structures of the decentralized **U-AIX Agent Marketplace**.

---

## 1. Security Verification Pipeline

Before any community skill or agent is indexed in the public registry directory as **"Verified"**, the U-AIX Indexing Node runs it through an automated security checkpoint:

```
               [Incoming Zip/Git package Submit]
                              │
                              ▼
           [AST Static Analysis: Scan Source Code]
                              │
               (Contains forbidden tokens?)
               ├─── Yes ──► [Flag & Reject]
               └─── No  ──► [Verify Manifest Declared Permissions]
                              │
               (Declares root filesystem access?)
               ├─── Yes ──► [Flag & Reject]
               └─── No  ──► [WASM Dry Run Sandbox Simulation]
                              │
               (Exceeds CPU / memory quotas?)
               ├─── Yes ──► [Flag & Reject]
               └─── No  ──► [Sign package & Publish as Verified FOSS]
```

---

## 2. AST Static Code Analyzer Rules

The validator parses source script files into an Abstract Syntax Tree (AST) to identify safety violations.

### Forbidden Tokens & Patterns Checklist
The compiler scanning checks block packages containing:
- **Obfuscation**: Excessive hex character escapes, encrypted string evaluations, or complex base64 payload references.
- **Forbidden Globals**: Direct manipulation of runtime objects like `window`, `document.cookie`, `eval()`, or `new Function()`.
- **System Leaks**: Raw `require('fs')` or `import 'os'` calls inside JS runtimes. All modifications must pipe through the `AgentContext` object wrappers.

### Reference AST Checker Mock Logic
```javascript
function scanScriptAST(codeSource, declaredPermissions) {
    const forbiddenTokens = ['eval', 'Function', 'document.cookie', 'window.location', 'localStorage'];
    
    // Check tokens existence
    for (const token of forbiddenTokens) {
        if (codeSource.includes(token)) {
            return {
                status: "failed",
                error: `SECURITY_VIOLATION: Code contains blocked system token [${token}].`
            };
        }
    }

    // Check undeclared file access triggers
    if (codeSource.includes('context.fs') && !declaredPermissions.includes('file_system')) {
        return {
            status: "failed",
            error: "PERMISSION_MISMATCH: Script queries context.fs APIs but manifest does not declare 'file_system' permission."
        };
    }

    return { status: "passed" };
}
```

---

## 3. Cryptographic Manifest Signature

When packages are built, the compiler hashes the manifest and code bundle and signs it with the developer's private key. The U-AIX client verifies this locally before running to prevent supply-chain injections:

```javascript
import { createVerify } from 'crypto';

function verifyDeveloperSignature(manifestJson, signatureHex, publicKeyPem) {
    try {
        const verify = createVerify('SHA256');
        verify.update(JSON.stringify(manifestJson));
        verify.end();
        
        return verify.verify(publicKeyPem, signatureHex, 'hex');
    } catch (e) {
        console.error("Signature verification error:", e);
        return false;
    }
}
```

---

## 4. Monetization & Pricing Tiers

U-AIX enforces a strict priority on FOSS options, while supporting creators via decentralized networks:

| License Tier | Pricing Model | Developer Share | Transparency Level | Runtime Sandbox Policy |
|---|---|---|---|---|
| **FOSS MIT / Apache** | **$0.00 (Free)** | 0% (None) | 100% (Open Github Repos) | Standard Sandboxed Loop |
| **Local Credit Model**| Micropayments | 100% to Creator | Shared-Source (Auditable) | Strict Isolation Sandbox |
| **Managed Cloud Split**| Billed per token| 80% Dev / 20% Host| Closed/SaaS | Remote Enclave Isolation |
