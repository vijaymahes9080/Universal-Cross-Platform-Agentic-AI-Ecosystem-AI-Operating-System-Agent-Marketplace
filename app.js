/* Core JavaScript Application logic for U-AIX OS Web Simulator */

// State Management (Persistent via localStorage)
const DEFAULT_STATE = {
    activeView: 'dashboard',
    installedSkills: ['deep-search', 'sql-engine', 'coder'],
    ollamaConnected: false,
    ollamaSettings: {
        host: 'http://localhost:11434',
        model: 'llama3'
    },
    memories: [
        { id: 'mem-1', content: 'User prefers Python for data tasks.', type: 'personal', date: '2026-06-23' },
        { id: 'mem-2', content: 'Project name is set to U-AIX OS.', type: 'team', date: '2026-06-23' },
        { id: 'mem-3', content: 'Security baseline requires sandbox isolation for external skills.', type: 'knowledge', date: '2026-06-23' },
        { id: 'mem-4', content: 'Router defaults to local FOSS Ollama nodes for zero-cost routing.', type: 'knowledge', date: '2026-06-23' }
    ],
    relations: [
        { source: 'mem-1', target: 'mem-2', type: 'RELATED_TO' },
        { source: 'mem-2', target: 'mem-3', type: 'DEPENDS_ON' },
        { source: 'mem-3', target: 'mem-4', type: 'RELATED_TO' }
    ],
    agents: [
        { id: 'planner', name: 'Planner Agent', status: 'idle', desc: 'Decomposes intent into Directed Acyclic Graphs (DAGs).' },
        { id: 'research', name: 'Research Agent', status: 'idle', desc: 'Performs deep database memory scans and reports.' },
        { id: 'coder', name: 'Coder Agent', status: 'idle', desc: 'Writes and refactors WebAssembly-isolated scripts.' },
        { id: 'validator', name: 'Validator Agent', status: 'idle', desc: 'Checks execution outputs against structural parameters.' }
    ],
    customSkills: []
};

let UAIX_STATE = {};

// Load state from localStorage or initialize defaults
function loadState() {
    try {
        const stored = localStorage.getItem('UAIX_STATE');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Reconstruct Sets or check structures
            UAIX_STATE = parsed;
        } else {
            UAIX_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
            saveState();
        }
    } catch (e) {
        UAIX_STATE = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
}

function saveState() {
    try {
        localStorage.setItem('UAIX_STATE', JSON.stringify(UAIX_STATE));
    } catch (e) {
        console.error('Error saving state to localStorage:', e);
    }
}

// Available Marketplace items
const MARKETPLACE_ITEMS = [
    {
        id: 'financial-advisor',
        name: 'Financial Advisor Agent',
        type: 'agent',
        developer: 'U-AIX Core',
        desc: 'Analyzes stock tickers, balances portfolios, and drafts financial strategy templates.',
        manifest: {
            name: "Financial Advisor Agent",
            version: "1.2.0",
            type: "agent",
            permissions: ["network", "read_docs"],
            dependencies: ["sql-engine"]
        },
        source: `// Financial Advisor Agent loop
class FinancialAgent extends Agent {
    async execute(portfolio) {
        const tickerData = await this.skills.sqlEngine.query("SELECT * FROM tickers");
        const prompt = \`Assess allocation rules: \${JSON.stringify(tickerData)}\`;
        const actionPlan = await this.router.generate(prompt);
        return actionPlan;
    }
}`
    },
    {
        id: 'marketing-copy',
        name: 'Copywriter Agent',
        type: 'agent',
        developer: 'Community',
        desc: 'Generates ad content, social feeds, and SEO optimized summaries.',
        manifest: {
            name: "Copywriter Agent",
            version: "1.0.5",
            type: "agent",
            permissions: ["clipboard"],
            dependencies: []
        },
        source: `// Copywriter Agent loop
class CopywriterAgent extends Agent {
    async generateCopy(targetAudience, topic) {
        const draft = await this.router.generate(\`Write ads for \${targetAudience} on \${topic}\`);
        await this.context.clipboard.writeText(draft);
        return draft;
    }
}`
    },
    {
        id: 'csv-analyst',
        name: 'CSV Data Skill',
        type: 'skill',
        developer: 'U-AIX Core',
        desc: 'Directly parses, queries, and filters local CSV tables in sandbox.',
        manifest: {
            name: "CSV Data Skill",
            version: "2.1.0",
            type: "skill",
            permissions: ["file_system"],
            dependencies: []
        },
        source: `// CSV parser entrypoint
async function parseCSV(context, csvString) {
    const lines = csvString.split('\\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map(l => {
        const vals = l.split(',');
        return headers.reduce((acc, h, i) => {
            acc[h.trim()] = vals[i]?.trim();
            return acc;
        }, {});
    });
    return rows;
}`
    },
    {
        id: 'audio-transcriber',
        name: 'Voice Transcriber Skill',
        type: 'skill',
        developer: 'WhisperLocal',
        desc: 'Converts local voice audio files to text using localized parameters.',
        manifest: {
            name: "Voice Transcriber Skill",
            version: "1.0.1",
            type: "skill",
            permissions: ["file_system", "network"],
            dependencies: []
        },
        source: `// Voice Transcriber entrypoint
async function transcribe(context, audioBuffer) {
    context.log("Feeding buffer to Whisper local API...");
    const transcription = await context.wasm.run("whisper_tiny", audioBuffer);
    return transcription.text;
}`
    },
    {
        id: 'web-scraper',
        name: 'Web Scraper Skill',
        type: 'skill',
        developer: 'WebCrawler Inc.',
        desc: 'Crawls URLs, extracts headers, paragraph texts, and metadata tags.',
        manifest: {
            name: "WebScraper",
            version: "1.4.2",
            type: "skill",
            permissions: ["network"],
            dependencies: []
        },
        source: `// Web Scraper logic
async function scrapeUrl(context, targetUrl) {
    context.log(\`Requesting url: \${targetUrl}\`);
    const html = await context.network.fetch(targetUrl);
    return {
        title: html.match(/<title>(.*?)<\\/title>/)?.[1] || "No Title",
        length: html.length
    };
}`
    }
];

// Document Index
const DOCUMENTATION_FILES = [
    { file: '1_architecture.md', title: '1. Full Architecture' },
    { file: '2_ui_screens.md', title: '2. UI Screens Specification' },
    { file: '3_database_design.md', title: '3. Database Design' },
    { file: '4_apis.md', title: '4. API Specification' },
    { file: '5_sdk_structure.md', title: '5. SDK Structure' },
    { file: '6_marketplace_logic.md', title: '6. Marketplace Logic' },
    { file: '7_agent_lifecycle.md', title: '7. Agent Lifecycle' },
    { file: '8_deployment.md', title: '8. Deployment Specs' },
    { file: '9_cost_estimates.md', title: '9. Cost Estimates' },
    { file: '10_growth_strategy.md', title: '10. Growth Strategy' },
    { file: '11_investor_deck.md', title: '11. Investor Deck' },
    { file: '12_technical_documents.md', title: '12. Technical Documents' },
    { file: '13_competitive_positioning.md', title: '13. Competitive Positioning' },
    { file: '14_global_launch_plan.md', title: '14. Global Launch Plan' }
];

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initNavigation();
    initSkills();
    initMemories();
    initMarketplace();
    initSettings();
    initTerminal();
    initDocHub();
    initSkillBuilder();
    initOrchestrator();
    checkOllamaConnection();

    // Start background canvas loops
    startMemoryGraph();
    startRouterTelemetry();
    startSimulationMetricsTicker();
});

// View Navigation Router
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetView = btn.getAttribute('data-view');
            switchView(targetView);
        });
    });
    // Set initial view from state
    switchView(UAIX_STATE.activeView || 'dashboard');
}

function switchView(viewId) {
    UAIX_STATE.activeView = viewId;
    saveState();
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update active view panel
    document.querySelectorAll('.page-view').forEach(panel => {
        if (panel.id === `${viewId}-view`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    // Trigger canvas resized updates
    if (viewId === 'memory') {
        resizeMemoryCanvas();
    } else if (viewId === 'router') {
        resizeRouterCanvas();
    } else if (viewId === 'orchestrator') {
        drawCurrentDAG();
    }
}

// Skills Controller
function initSkills() {
    renderSkillsGrid();
}

function renderSkillsGrid() {
    const grid = document.getElementById('skills-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const coreSkills = [
        { id: 'deep-search', name: 'Deep Search' },
        { id: 'sql-engine', name: 'SQL Engine' },
        { id: 'coder', name: 'WASM Coder' }
    ];

    // Combine core, marketplace & compiled custom skills
    const customList = UAIX_STATE.customSkills || [];
    const installedMarketSkills = MARKETPLACE_ITEMS
        .filter(item => item.type === 'skill' && UAIX_STATE.installedSkills.includes(item.id))
        .map(item => ({ id: item.id, name: item.name }));

    const allSkillsList = [...coreSkills, ...installedMarketSkills, ...customList];

    allSkillsList.forEach(skill => {
        const badge = document.createElement('div');
        badge.className = 'skill-badge installed';
        badge.innerText = skill.name;
        badge.title = 'Click to toggle/remove capability';
        badge.addEventListener('click', () => {
            if (coreSkills.some(cs => cs.id === skill.id)) {
                appendLog('error', `Cannot remove system-critical skill: ${skill.name}`);
                return;
            }
            if (confirm(`Remove skill "${skill.name}" from workspace?`)) {
                if (UAIX_STATE.installedSkills.includes(skill.id)) {
                    UAIX_STATE.installedSkills = UAIX_STATE.installedSkills.filter(id => id !== skill.id);
                }
                UAIX_STATE.customSkills = customList.filter(s => s.id !== skill.id);
                saveState();
                renderSkillsGrid();
                appendLog('system', `De-registered skill workspace: ${skill.name}`);
            }
        });
        grid.appendChild(badge);
    });
}

// Memory Vault Controller
function initMemories() {
    renderMemories();

    const memForm = document.getElementById('add-memory-form');
    if (memForm) {
        memForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('memory-input');
            const type = document.getElementById('memory-type').value;
            if (!input.value.trim()) return;

            const newId = `mem-${Date.now()}`;
            const newMemory = {
                id: newId,
                content: input.value.trim(),
                type: type,
                date: new Date().toISOString().split('T')[0]
            };

            UAIX_STATE.memories.unshift(newMemory);
            saveState();
            input.value = '';
            renderMemories();
            appendLog('system', `New long-term semantic token added: "${newMemory.content.substring(0, 30)}..."`);
            
            // Add dynamically as node in memory physics simulation
            addNodeToGraph(newMemory);
        });
    }

    // Bind purge button
    const purgeBtn = document.getElementById('purge-memory-btn');
    if (purgeBtn) {
        purgeBtn.addEventListener('click', () => {
            if (confirm('Purge all memory nodes and custom relations? This is irreversible.')) {
                UAIX_STATE.memories = [];
                UAIX_STATE.relations = [];
                saveState();
                renderMemories();
                location.reload();
            }
        });
    }

    // Bind export button
    const exportBtn = document.getElementById('export-memory-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(UAIX_STATE.memories, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "uaix_memory_vault_export.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            appendLog('success', 'Memory vault JSON database exported successfully.');
        });
    }

    // Link relations form triggers
    const relationBtn = document.getElementById('add-relation-btn');
    if (relationBtn) {
        relationBtn.addEventListener('click', () => {
            const source = document.getElementById('relation-source').value;
            const type = document.getElementById('relation-type').value;
            const target = document.getElementById('relation-target').value;

            if (!source || !target || source === target) {
                alert("Invalid source/target selections. Cannot link a node to itself.");
                return;
            }

            const exists = UAIX_STATE.relations.some(r => r.source === source && r.target === target && r.type === type);
            if (exists) {
                alert("Relationship link already exists between these nodes.");
                return;
            }

            const newRelation = { source, target, type };
            UAIX_STATE.relations.push(newRelation);
            saveState();
            updateRelationSelectors();
            addLinkToGraph(newRelation);
            appendLog('system', `Created semantic relationship: [Node A] --${type}--> [Node B]`);
        });
    }
}

function renderMemories() {
    const container = document.getElementById('memory-list');
    if (!container) return;
    container.innerHTML = '';

    UAIX_STATE.memories.forEach(mem => {
        const card = document.createElement('div');
        card.className = 'memory-node-card';
        card.style.position = 'relative';
        
        // Setup visual color indicators for types
        let typeColor = 'var(--accent-violet)';
        if (mem.type === 'team') typeColor = 'var(--accent-cyan)';
        if (mem.type === 'knowledge') typeColor = 'var(--accent-green)';

        card.innerHTML = `
            <div style="padding-right: 20px;">${mem.content}</div>
            <div class="memory-node-meta">
                <span style="color: ${typeColor}; font-weight: 600;">Type: ${mem.type}</span>
                <span>${mem.date}</span>
            </div>
            <button class="close-btn" style="position: absolute; top: 6px; right: 10px; font-size: 0.9rem; background:none; border:none;" title="Delete Node">&times;</button>
        `;

        card.querySelector('.close-btn').addEventListener('click', () => {
            if (confirm(`Remove this memory node?\n"${mem.content}"`)) {
                deleteMemoryNode(mem.id);
            }
        });

        container.appendChild(card);
    });

    updateRelationSelectors();
}

function deleteMemoryNode(id) {
    UAIX_STATE.memories = UAIX_STATE.memories.filter(m => m.id !== id);
    UAIX_STATE.relations = UAIX_STATE.relations.filter(r => r.source !== id && r.target !== id);
    saveState();
    renderMemories();
    
    // Remove from physical simulation
    graphNodes = graphNodes.filter(n => n.id !== id);
    graphLinks = graphLinks.filter(l => l.source.id !== id && l.target.id !== id);
    appendLog('system', `Memory node "${id}" destroyed.`);
}

function updateRelationSelectors() {
    const sourceSelect = document.getElementById('relation-source');
    const targetSelect = document.getElementById('relation-target');
    if (!sourceSelect || !targetSelect) return;

    sourceSelect.innerHTML = '';
    targetSelect.innerHTML = '';

    if (UAIX_STATE.memories.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.innerText = "No memories available";
        sourceSelect.appendChild(opt);
        targetSelect.appendChild(opt.cloneNode(true));
        return;
    }

    UAIX_STATE.memories.forEach(mem => {
        const textTrunc = mem.content.length > 35 ? mem.content.substring(0, 35) + '...' : mem.content;
        const opt = document.createElement('option');
        opt.value = mem.id;
        opt.innerText = textTrunc;
        sourceSelect.appendChild(opt);
        targetSelect.appendChild(opt.cloneNode(true));
    });
}

// Marketplace & Inspect Source Controller
function initMarketplace() {
    const searchInput = document.getElementById('market-search');
    const filterSelect = document.getElementById('market-filter-type');

    if (searchInput) {
        searchInput.addEventListener('input', () => renderMarketplace());
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', () => renderMarketplace());
    }

    renderMarketplace();
    setupInspectorModal();
}

function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const query = document.getElementById('market-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('market-filter-type')?.value || 'all';

    MARKETPLACE_ITEMS.forEach(item => {
        // Apply search & type filters
        if (query && !item.name.toLowerCase().includes(query) && !item.desc.toLowerCase().includes(query)) {
            return;
        }
        if (filter !== 'all' && item.type !== filter) {
            return;
        }

        const card = document.createElement('div');
        card.className = 'market-card';

        const isInstalled = item.type === 'skill' 
            ? UAIX_STATE.installedSkills.includes(item.id)
            : UAIX_STATE.agents.some(a => a.id === item.id && a.isInstalled);

        card.innerHTML = `
            <div class="market-card-header">
                <div class="market-card-title">${item.name}</div>
                <div class="market-card-badge">${item.type}</div>
            </div>
            <div class="market-card-desc">${item.desc}</div>
            <div class="market-card-footer">
                <span>By: ${item.developer}</span>
                <div style="display: flex; gap: 8px;">
                    <button class="nav-btn inspect-src-btn" style="padding: 4px 10px; font-size: 0.75rem; border: 1px solid var(--border-color)">Inspect</button>
                    <button class="market-card-btn ${isInstalled ? 'installed' : ''}" ${isInstalled ? 'disabled' : ''}>
                        ${isInstalled ? 'Installed' : 'Install (FOSS)'}
                    </button>
                </div>
            </div>
        `;

        // Install button click
        const btn = card.querySelector('.market-card-btn');
        if (!isInstalled) {
            btn.addEventListener('click', () => installMarketplaceItem(item));
        }

        // Inspect Source modal trigger
        card.querySelector('.inspect-src-btn').addEventListener('click', () => openInspectorModal(item));

        grid.appendChild(card);
    });
}

function installMarketplaceItem(item) {
    if (item.type === 'skill') {
        UAIX_STATE.installedSkills.push(item.id);
        renderSkillsGrid();
    } else {
        const agent = UAIX_STATE.agents.find(a => a.id === item.id);
        if (agent) {
            agent.isInstalled = true;
        } else {
            UAIX_STATE.agents.push({
                id: item.id,
                name: item.name,
                status: 'idle',
                desc: item.desc,
                isInstalled: true
            });
        }
        renderSidebarAgents();
    }
    saveState();
    appendLog('success', `Installed package successfully: ${item.name}`);
    renderMarketplace();
}

// Source Inspector Modal Manager
let currentInspectorItem = null;
function setupInspectorModal() {
    const modal = document.getElementById('inspector-modal');
    const closeBtn = document.getElementById('inspector-close-btn');
    const tabBtns = document.querySelectorAll('.modal-tab-btn');
    const installBtn = document.getElementById('inspector-install-btn');

    if (!modal) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateInspectorTabContent(btn.getAttribute('data-tab'));
        });
    });

    installBtn.addEventListener('click', () => {
        if (currentInspectorItem) {
            installMarketplaceItem(currentInspectorItem);
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
}

function openInspectorModal(item) {
    currentInspectorItem = item;
    const modal = document.getElementById('inspector-modal');
    const title = document.getElementById('inspector-title');
    const installBtn = document.getElementById('inspector-install-btn');
    const tabBtns = document.querySelectorAll('.modal-tab-btn');

    if (!modal) return;

    title.innerText = `Inspect: ${item.name}`;
    
    // Check install status
    const isInstalled = item.type === 'skill' 
        ? UAIX_STATE.installedSkills.includes(item.id)
        : UAIX_STATE.agents.some(a => a.id === item.id && a.isInstalled);

    if (isInstalled) {
        installBtn.innerText = "Installed";
        installBtn.disabled = true;
        installBtn.classList.add('installed');
    } else {
        installBtn.innerText = "Install Package";
        installBtn.disabled = false;
        installBtn.classList.remove('installed');
    }

    // Set first tab active
    tabBtns.forEach(b => {
        if (b.getAttribute('data-tab') === 'manifest') b.classList.add('active');
        else b.classList.remove('active');
    });

    modal.style.display = 'flex';
    // Reflow trigger
    modal.offsetHeight;
    modal.classList.add('active');

    updateInspectorTabContent('manifest');
}

function updateInspectorTabContent(tabName) {
    const codeBlock = document.getElementById('inspector-code-block');
    if (!codeBlock || !currentInspectorItem) return;

    if (tabName === 'manifest') {
        codeBlock.innerText = JSON.stringify(currentInspectorItem.manifest, null, 4);
        codeBlock.className = 'language-json';
    } else {
        codeBlock.innerText = currentInspectorItem.source;
        codeBlock.className = 'language-javascript';
    }
}

function renderSidebarAgents() {
    const list = document.getElementById('active-agents-list');
    if (!list) return;
    list.innerHTML = '';

    // Filter agents displayed by installation state
    const displayAgents = UAIX_STATE.agents;

    displayAgents.forEach(agent => {
        const item = document.createElement('div');
        item.className = 'agent-item';
        
        let statusLabel = agent.status.toUpperCase();
        let indicatorClass = `status-indicator ${agent.status}`;

        item.innerHTML = `
            <div class="agent-info">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-status">
                    <span class="${indicatorClass}"></span>
                    <span>${statusLabel}</span>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Custom Skill Builder Compiler Controller
function initSkillBuilder() {
    const compileBtn = document.getElementById('builder-compile-btn');
    const resetBtn = document.getElementById('builder-reset-btn');

    if (compileBtn) {
        compileBtn.addEventListener('click', () => compileCustomSkill());
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Reset layout template back to defaults?")) {
                document.getElementById('skill-name').value = "ImageOptimizer";
                document.getElementById('skill-version').value = "1.0.0";
                document.getElementById('skill-desc').value = "Compresses and scales local images inside sandbox.";
                document.getElementById('perm-network').checked = true;
                document.getElementById('perm-fs').checked = false;
                document.getElementById('perm-process').checked = false;
                document.getElementById('perm-clip').checked = true;
                document.getElementById('skill-code').value = `// Declare entrypoint skill handler
@skill({
    name: "ImageOptimizer",
    version: "1.0.0"
})
async function optimize(context, filepath, quality = 80) {
    const file = await context.fs.readFile(filepath);
    context.log("Compressing image buffer...");
    
    // Simulating WASM canvas operation
    const output = await context.wasm.run("img_compress", file, { quality });
    return {
        outputPath: filepath.replace(/\\.[^/.]+$/, "") + "_opt.jpg",
        sizeReduction: "45%"
    };
}`;
            }
        });
    }
}

async function compileCustomSkill() {
    const overlay = document.getElementById('compiler-scan-overlay');
    const statusText = document.getElementById('scan-status-text');
    const progressFill = document.getElementById('scan-progress-fill');

    const name = document.getElementById('skill-name').value.trim();
    const version = document.getElementById('skill-version').value.trim();
    const desc = document.getElementById('skill-desc').value.trim();
    const code = document.getElementById('skill-code').value;

    if (!name || !version) {
        alert("Please provide a valid skill name and version manifest.");
        return;
    }

    // Toggle loader visibility
    if (overlay) overlay.style.display = 'flex';

    const steps = [
        { progress: 15, text: "Generating AST (Abstract Syntax Tree)..." },
        { progress: 40, text: "Analyzing code references & dependencies..." },
        { progress: 65, text: "Scanning sandboxed namespace validation..." },
        { progress: 85, text: "Signing execution checksum key..." },
        { progress: 100, text: "Validation Passed. Compiling skill binary..." }
    ];

    for (const step of steps) {
        if (progressFill) progressFill.style.width = `${step.progress}%`;
        if (statusText) statusText.innerText = step.text;
        await sleep(400 + Math.random() * 300);
    }

    // Security Check: Block raw unauthorized window accesses or direct evals (FOSS compliance)
    const normalizedCode = code.replace(/\s+/g, '');
    const containsEval = code.includes('eval(') || code.includes('eval ');
    const containsLocationBypass = code.includes('window.location') || code.includes('document.cookie');
    const permissionFS = document.getElementById('perm-fs').checked;

    let success = true;
    let compileError = '';

    if (containsEval) {
        success = false;
        compileError = "SECURITY COMPLIANCE ERROR: Forbidden raw usage of 'eval' function blocks sandbox runtime. Switch to context.wasm execution parameters.";
    } else if (containsLocationBypass) {
        success = false;
        compileError = "AST SANDBOX POLICY ERROR: Unauthorized access of global browser cookies or redirect paths detected. Code execution aborted.";
    } else if (code.includes('context.fs') && !permissionFS) {
        success = false;
        compileError = "COMPILER LINK WARNING: Source code utilizes context.fs APIs, but Allow File System permissions flag was unchecked in manifest.";
    }

    if (overlay) overlay.style.display = 'none';

    if (!success) {
        appendLog('error', `Skill Compilation Failed: ${compileError}`);
        alert(`Compilation Failed:\n\n${compileError}`);
        return;
    }

    // Save custom skill to state
    const skillId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingIndex = UAIX_STATE.customSkills.findIndex(s => s.id === skillId);

    const permissionFlags = [];
    if (document.getElementById('perm-network').checked) permissionFlags.push('network');
    if (document.getElementById('perm-fs').checked) permissionFlags.push('file_system');
    if (document.getElementById('perm-process').checked) permissionFlags.push('subprocesses');
    if (document.getElementById('perm-clip').checked) permissionFlags.push('clipboard');

    const newCustomSkill = {
        id: skillId,
        name: name,
        version: version,
        permission_flags: permissionFlags.join(','),
        entrypoint_js: code,
        manifest_json: JSON.stringify({ name, version, description: desc, permissions: permissionFlags })
    };

    if (existingIndex !== -1) {
        UAIX_STATE.customSkills[existingIndex] = newCustomSkill;
    } else {
        UAIX_STATE.customSkills.push(newCustomSkill);
    }

    // Add to installed skills listing
    if (!UAIX_STATE.installedSkills.includes(skillId)) {
        UAIX_STATE.installedSkills.push(skillId);
    }

    saveState();
    renderSkillsGrid();
    switchView('dashboard');
    appendLog('success', `Compiled custom skill: "${name}" v${version}. Loaded into execution context.`);
}

// Model Router Settings Controller
function initSettings() {
    const hostInput = document.getElementById('ollama-host');
    const modelInput = document.getElementById('ollama-model');
    const saveBtn = document.getElementById('save-settings-btn');

    if (hostInput) hostInput.value = UAIX_STATE.ollamaSettings.host;
    if (modelInput) modelInput.value = UAIX_STATE.ollamaSettings.model;

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            UAIX_STATE.ollamaSettings.host = hostInput.value.trim();
            UAIX_STATE.ollamaSettings.model = modelInput.value.trim();
            saveState();
            appendLog('system', `Settings saved. Attempting to link local node endpoint: ${UAIX_STATE.ollamaSettings.host}`);
            checkOllamaConnection();
        });
    }
}

// Ollama Connection Checker (Local, Offline-first)
async function checkOllamaConnection() {
    const dot = document.getElementById('ollama-status-dot');
    const label = document.getElementById('ollama-status-label');
    const routerModel = document.getElementById('router-active-model');

    if (dot) {
        dot.className = 'metric-dot connecting';
        label.innerText = 'Connecting...';
    }

    try {
        const response = await fetch(`${UAIX_STATE.ollamaSettings.host}/api/tags`, {
            method: 'GET',
            mode: 'cors'
        });
        if (response.ok) {
            UAIX_STATE.ollamaConnected = true;
            if (dot) {
                dot.className = 'metric-dot';
                label.innerText = 'Local Node Active';
                routerModel.innerText = `Ollama: ${UAIX_STATE.ollamaSettings.model}`;
            }
            appendLog('success', `Link established with local AI server at ${UAIX_STATE.ollamaSettings.host}`);
        } else {
            throw new Error();
        }
    } catch (e) {
        UAIX_STATE.ollamaConnected = false;
        if (dot) {
            dot.className = 'metric-dot disconnected';
            label.innerText = 'Simulator Node';
            routerModel.innerText = 'U-AIX Engine Simulator';
        }
    }
    saveState();
}

// Terminal Shell execution Engine
function initTerminal() {
    const input = document.getElementById('terminal-input');
    if (input) {
        input.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                const prompt = input.value.trim();
                if (!prompt) return;

                input.value = '';
                await executeIntent(prompt);
            }
        });
    }
}

function appendLog(type, text) {
    const terminalLogs = document.getElementById('terminal-logs');
    if (!terminalLogs) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `[${time}] [${type.toUpperCase()}] ${text}`;
    
    terminalLogs.appendChild(entry);
    terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

// Orchestrator Simulator Logic with dynamic DAG representation & Suspended permission authorizations
let simulationSpeedMultiplier = 1;
async function executeIntent(prompt) {
    appendLog('user', prompt);

    // 1. Created & Planning State
    setAgentState('planner', 'running');
    appendLog('agent', 'Planner Agent: Analyzing user intent constraints...');
    await sleep(700);

    // Decompose into visual DAG nodes
    let stepsList = [];
    if (prompt.toLowerCase().includes('scraper') || prompt.toLowerCase().includes('crawl') || prompt.toLowerCase().includes('scrape')) {
        stepsList = [
            { id: 'step-1', name: 'Retrieve Memory Context', status: 'running' },
            { id: 'step-2', name: 'Network Scrape Request', status: 'pending' },
            { id: 'step-3', name: 'WASM Code Sanitization', status: 'pending' },
            { id: 'step-4', name: 'Output Verification', status: 'pending' }
        ];
    } else if (prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('portfolio') || prompt.toLowerCase().includes('finance')) {
        stepsList = [
            { id: 'step-1', name: 'Retrieve Financial Context', status: 'running' },
            { id: 'step-2', name: 'Fetch Ticker DB Records', status: 'pending' },
            { id: 'step-3', name: 'Execute Risk Calculations', status: 'pending' },
            { id: 'step-4', name: 'Schema Output Verification', status: 'pending' }
        ];
    } else {
        // Default standard DAG
        stepsList = [
            { id: 'step-1', name: 'Analyze Context Vault', status: 'running' },
            { id: 'step-2', name: 'Compose Script Logic', status: 'pending' },
            { id: 'step-3', name: 'Execute Safe Dry-run', status: 'pending' },
            { id: 'step-4', name: 'Audit Output Structures', status: 'pending' }
        ];
    }

    // Append visual DAG component in the logs panel
    const dagBlock = document.createElement('div');
    dagBlock.className = 'dag-log-block';
    dagBlock.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-mono); font-weight:700;">EXECUTING INTENT FLOW DAG:</div>
        <div class="dag-nodes-row" id="dag-nodes-row-content"></div>
    `;
    const logsContainer = document.getElementById('terminal-logs');
    if (logsContainer) {
        logsContainer.appendChild(dagBlock);
    }
    updateVisualDagRow(stepsList);
    logsContainer.scrollTop = logsContainer.scrollHeight;

    setAgentState('planner', 'idle');

    // Peak telemetry chart values during run
    activeSimulationPeaks = true;

    // Execute DAG step by step
    // Step 1: Memory lookup
    setAgentState('research', 'running');
    appendLog('agent', 'Research Agent: Scanning vector databases...');
    await sleep(900);
    
    // Scan matching memory nodes
    const match = queryLocalMemory(prompt);
    if (match) {
        appendLog('agent', `Research Agent: Recall Context Hit -> "${match.content}"`);
    } else {
        appendLog('agent', 'Research Agent: No relevant context found. Proceeding with system general templates.');
    }
    
    stepsList[0].status = 'completed';
    stepsList[1].status = 'running';
    updateVisualDagRow(stepsList);
    setAgentState('research', 'idle');
    await sleep(600);

    // Step 2: Coder / script processing
    setAgentState('coder', 'running');
    appendLog('agent', 'Coder Agent: Initializing sandbox operations...');
    await sleep(1000);

    // Interactive Authorization check (Suspended state simulation)
    // If scraper task - request Network permission approval. If database task - request File system write permissions.
    const isNetworkTask = prompt.toLowerCase().includes('scraper') || prompt.toLowerCase().includes('crawl') || prompt.toLowerCase().includes('scrape');
    const isDBTask = prompt.toLowerCase().includes('stock') || prompt.toLowerCase().includes('portfolio') || prompt.toLowerCase().includes('finance');
    
    let permissionApproved = true;
    if (isNetworkTask || isDBTask) {
        stepsList[1].status = 'suspended';
        updateVisualDagRow(stepsList);
        setAgentState('coder', 'suspended');
        
        const reqPermission = isNetworkTask ? 'Network Connection (example.com)' : 'Database Write (local_memory.db)';
        
        appendLog('system', `Orchestrator: Agent execution loop SUSPENDED. Human approval required.`);
        
        // Render inline authorization card in terminal logs
        const approvalCard = document.createElement('div');
        approvalCard.className = 'approval-card';
        approvalCard.innerHTML = `
            <div class="approval-title">⚠️ SYSTEM SECURITY APPROVAL REQUIRED</div>
            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-primary);">
                Coder Agent requests authorization to execute <strong>${reqPermission}</strong>. Installed skill permissions must be verified.
            </div>
            <div class="approval-buttons">
                <button class="approval-btn approve" id="btn-approve-perms">Approve Permission</button>
                <button class="approval-btn deny" id="btn-deny-perms">Abort Lifecycle</button>
            </div>
        `;
        logsContainer.appendChild(approvalCard);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        permissionApproved = await new Promise((resolve) => {
            approvalCard.querySelector('#btn-approve-perms').addEventListener('click', () => {
                approvalCard.remove();
                resolve(true);
            });
            approvalCard.querySelector('#btn-deny-perms').addEventListener('click', () => {
                approvalCard.remove();
                resolve(false);
            });
        });

        if (!permissionApproved) {
            stepsList[1].status = 'failed';
            updateVisualDagRow(stepsList);
            setAgentState('coder', 'idle');
            appendLog('error', `Execution Loop Aborted: User denied permission request for: ${reqPermission}`);
            activeSimulationPeaks = false;
            return;
        }

        appendLog('success', `Permission Granted. Resuming agent execution loop.`);
        stepsList[1].status = 'running';
        updateVisualDagRow(stepsList);
        setAgentState('coder', 'running');
        await sleep(800);
    }

    appendLog('agent', 'Coder Agent: Executing WebAssembly binary scripts...');
    await sleep(1000);
    
    stepsList[1].status = 'completed';
    stepsList[2].status = 'running';
    updateVisualDagRow(stepsList);
    setAgentState('coder', 'idle');
    await sleep(600);

    // Step 3: Validator Check
    setAgentState('validator', 'running');
    appendLog('agent', 'Validator Agent: Inspecting structural schemas and limits...');
    await sleep(900);
    
    stepsList[2].status = 'completed';
    stepsList[3].status = 'running';
    updateVisualDagRow(stepsList);
    await sleep(600);

    // Output delivery & save memory
    stepsList[3].status = 'completed';
    updateVisualDagRow(stepsList);
    setAgentState('validator', 'idle');

    // Restore simulator metrics peak values
    activeSimulationPeaks = false;

    // Insert output directly into memories vault as knowledge context
    const outputContent = `Generated custom workflows for query: "${prompt}". Status: success.`;
    const newMemId = `mem-sys-${Date.now()}`;
    const newMemNode = {
        id: newMemId,
        content: outputContent,
        type: 'knowledge',
        date: new Date().toISOString().split('T')[0]
    };
    UAIX_STATE.memories.unshift(newMemNode);
    // Bind relations to source matched memory if present
    if (match) {
        UAIX_STATE.relations.push({ source: match.id, target: newMemId, type: 'CREATED_BY' });
    }
    saveState();
    renderMemories();
    addNodeToGraph(newMemNode);
    if (match) {
        addLinkToGraph({ source: match.id, target: newMemId, type: 'CREATED_BY' });
    }

    appendLog('success', `Orchestration Success. Token cost: $0.00. Output result synced locally to vault.`);
}

function setAgentState(id, status) {
    const agent = UAIX_STATE.agents.find(a => a.id === id);
    if (agent) {
        agent.status = status;
        renderSidebarAgents();
    }
}

function updateVisualDagRow(steps) {
    const container = document.getElementById('dag-nodes-row-content');
    if (!container) return;
    container.innerHTML = '';

    steps.forEach((step, idx) => {
        const node = document.createElement('div');
        node.className = `dag-node ${step.status}`;
        
        let statusSymbol = '○';
        if (step.status === 'running') statusSymbol = '●';
        if (step.status === 'suspended') statusSymbol = '⚠️';
        if (step.status === 'completed') statusSymbol = '✓';
        if (step.status === 'failed') statusSymbol = '✗';

        node.innerHTML = `<span>${statusSymbol}</span> ${step.name}`;
        container.appendChild(node);

        if (idx < steps.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'dag-arrow';
            arrow.innerText = '→';
            container.appendChild(arrow);
        }
    });
}

function queryLocalMemory(prompt) {
    const queryWords = prompt.toLowerCase().split(/\s+/);
    for (const mem of UAIX_STATE.memories) {
        const memText = mem.content.toLowerCase();
        for (const word of queryWords) {
            if (word.length > 3 && memText.includes(word)) {
                return mem; // Return first matching semantic hit
            }
        }
    }
    return null;
}

// Documentation Hub Controller
function initDocHub() {
    const listContainer = document.getElementById('doc-menu-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    DOCUMENTATION_FILES.forEach((doc, idx) => {
        const btn = document.createElement('button');
        btn.className = `doc-menu-btn ${idx === 0 ? 'active' : ''}`;
        btn.innerText = doc.title;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.doc-menu-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadDocument(doc.file);
        });
        listContainer.appendChild(btn);
    });

    // Load first doc by default
    if (DOCUMENTATION_FILES.length > 0) {
        loadDocument(DOCUMENTATION_FILES[0].file);
    }
}

async function loadDocument(filename) {
    const viewer = document.getElementById('doc-viewer');
    if (!viewer) return;

    viewer.innerHTML = '<p style="color: var(--text-muted)">Loading document text...</p>';

    try {
        const response = await fetch(`./docs/${filename}`);
        if (!response.ok) throw new Error("File not found");
        const markdown = await response.text();
        viewer.innerHTML = renderMarkdown(markdown);
    } catch (e) {
        // Fallback for CORS blocks (e.g. double clicking index.html directly)
        const matchedDoc = FALLBACK_DOCS[filename];
        if (matchedDoc) {
            viewer.innerHTML = renderMarkdown(matchedDoc);
        } else {
            viewer.innerHTML = `<p style="color: var(--accent-red)">Error loading document. Inspect file directly at: <code>docs/${filename}</code></p>`;
        }
    }
}

// Enhanced Markdown compiler supporting Headers, Lists, Tables, Codes, and alerts
function renderMarkdown(md) {
    let html = md;

    // Parse blockquotes/alerts first
    // Capture alert tags: > [!NOTE] text...
    html = html.replace(/^\>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(.*?)$/gim, (match, type, content) => {
        return `<div class="doc-alert ${type.toLowerCase()}"><strong>${type}</strong>: ${content}</div>`;
    });

    // Capture standard blockquotes
    html = html.replace(/^\>\s*(.*?)$/gim, '<blockquote>$1</blockquote>');

    // Headings
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');

    // Code blocks with syntax wrapping
    html = html.replace(/```([\s\S]*?)```/gim, (match, code) => {
        return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Bold & Italics
    html = html.replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/gim, '<em>$1</em>');

    // Bullet list parser
    // Simple line replacements for standard unordered lists
    html = html.replace(/^\s*\-\s*(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, ''); // Combine consecutive lists

    // Markdown Table parser
    // Check if table structure exists
    const lines = html.split('\n');
    let insideTable = false;
    let tableBuffer = [];
    let outputLines = [];

    lines.forEach(line => {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!insideTable) {
                insideTable = true;
                tableBuffer = [];
            }
            // Skip separating formatting line (e.g. |---|---|)
            if (!line.includes('---')) {
                const cells = line.split('|').slice(1, -1).map(c => c.trim());
                tableBuffer.push(cells);
            }
        } else {
            if (insideTable) {
                insideTable = false;
                outputLines.push(compileHtmlTable(tableBuffer));
            }
            outputLines.push(line);
        }
    });
    if (insideTable) {
        outputLines.push(compileHtmlTable(tableBuffer));
    }
    html = outputLines.join('\n');

    // Clean up empty line breaks
    html = html.replace(/\n$/gim, '<br />');

    return html;
}

function compileHtmlTable(rows) {
    if (rows.length === 0) return '';
    let tableHtml = '<table>';
    
    // First row header
    tableHtml += '<thead><tr>';
    rows[0].forEach(cell => {
        tableHtml += `<th>${cell}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Body rows
    rows.slice(1).forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Helpers
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// ==========================================================================
// PHYSICALLY SIMULATED 2D MEMORY GRAPH CANVAS
// ==========================================================================
let graphNodes = [];
let graphLinks = [];
let selectedGraphNode = null;
let draggedGraphNode = null;
let memoryGraphCanvas = null;
let memoryGraphCtx = null;
let graphZoom = 1;
let graphOffset = { x: 0, y: 0 };
let isCanvasDragging = false;
let canvasDragStart = { x: 0, y: 0 };

function startMemoryGraph() {
    memoryGraphCanvas = document.getElementById('memory-graph-canvas');
    if (!memoryGraphCanvas) return;
    memoryGraphCtx = memoryGraphCanvas.getContext('2d');

    // Setup coordinates from state elements
    UAIX_STATE.memories.forEach(mem => {
        graphNodes.push({
            id: mem.id,
            label: mem.content.length > 25 ? mem.content.substring(0, 25) + '...' : mem.content,
            fullText: mem.content,
            type: mem.type,
            x: Math.random() * 400 + 100,
            y: Math.random() * 300 + 100,
            vx: 0,
            vy: 0,
            radius: 12
        });
    });

    UAIX_STATE.relations.forEach(rel => {
        const srcNode = graphNodes.find(n => n.id === rel.source);
        const tgtNode = graphNodes.find(n => n.id === rel.target);
        if (srcNode && tgtNode) {
            graphLinks.push({
                source: srcNode,
                target: tgtNode,
                type: rel.type
            });
        }
    });

    resizeMemoryCanvas();
    window.addEventListener('resize', () => {
        if (UAIX_STATE.activeView === 'memory') resizeMemoryCanvas();
    });

    // Hook canvas event handlers
    memoryGraphCanvas.addEventListener('mousedown', onCanvasMouseDown);
    memoryGraphCanvas.addEventListener('mousemove', onCanvasMouseMove);
    memoryGraphCanvas.addEventListener('mouseup', onCanvasMouseUp);
    memoryGraphCanvas.addEventListener('mouseleave', onCanvasMouseUp);
    memoryGraphCanvas.addEventListener('wheel', onCanvasWheel);

    // Initial physics tick Loop
    requestAnimationFrame(tickMemoryPhysicsLoop);
}

function resizeMemoryCanvas() {
    if (!memoryGraphCanvas) return;
    const parent = memoryGraphCanvas.parentElement;
    if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        memoryGraphCanvas.width = rect.width * dpr;
        memoryGraphCanvas.height = rect.height * dpr;
        memoryGraphCanvas.style.width = `${rect.width}px`;
        memoryGraphCanvas.style.height = `${rect.height}px`;
    }
}

function addNodeToGraph(mem) {
    if (!memoryGraphCanvas) return;
    const n = {
        id: mem.id,
        label: mem.content.length > 25 ? mem.content.substring(0, 25) + '...' : mem.content,
        fullText: mem.content,
        type: mem.type,
        x: memoryGraphCanvas.width / 2 + (Math.random() - 0.5) * 50,
        y: memoryGraphCanvas.height / 2 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        radius: 12
    };
    graphNodes.push(n);
    updateRelationSelectors();
}

function addLinkToGraph(rel) {
    const srcNode = graphNodes.find(n => n.id === rel.source);
    const tgtNode = graphNodes.find(n => n.id === rel.target);
    if (srcNode && tgtNode) {
        graphLinks.push({
            source: srcNode,
            target: tgtNode,
            type: rel.type
        });
    }
}

function tickMemoryPhysicsLoop() {
    if (UAIX_STATE.activeView === 'memory' && memoryGraphCtx) {
        updateGraphPhysics();
        drawGraph();
    }
    requestAnimationFrame(tickMemoryPhysicsLoop);
}

function updateGraphPhysics() {
    const dpr = window.devicePixelRatio || 1;
    const width = memoryGraphCanvas.width / dpr;
    const height = memoryGraphCanvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;

    const gravity = 0.04;
    const repulsion = 1200;
    const springLength = 80;
    const springStrength = 0.05;
    const damping = 0.85;

    // 1. Attraction to center (gravity)
    graphNodes.forEach(node => {
        if (node === draggedGraphNode) return;
        node.vx += (centerX - node.x) * gravity * 0.1;
        node.vy += (centerY - node.y) * gravity * 0.1;
    });

    // 2. Node-node repulsion (Coulomb forces)
    for (let i = 0; i < graphNodes.length; i++) {
        const nodeA = graphNodes[i];
        for (let j = i + 1; j < graphNodes.length; j++) {
            const nodeB = graphNodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy + 0.01;
            const dist = Math.sqrt(distSq);

            if (dist < 250) {
                const force = repulsion / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                if (nodeA !== draggedGraphNode) {
                    nodeA.vx -= fx;
                    nodeA.vy -= fy;
                }
                if (nodeB !== draggedGraphNode) {
                    nodeB.vx += fx;
                    nodeB.vy += fy;
                }
            }
        }
    }

    // 3. Link spring force
    graphLinks.forEach(link => {
        const nodeA = link.source;
        const nodeB = link.target;
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;

        const force = (dist - springLength) * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (nodeA !== draggedGraphNode) {
            nodeA.vx += fx;
            nodeA.vy += fy;
        }
        if (nodeB !== draggedGraphNode) {
            nodeB.vx -= fx;
            nodeB.vy -= fy;
        }
    });

    // 4. Update coordinates & apply damping
    graphNodes.forEach(node => {
        if (node === draggedGraphNode) return;

        // Cap maximum velocity to prevent instabilities
        const maxSpeed = 12;
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > maxSpeed) {
            node.vx = (node.vx / speed) * maxSpeed;
            node.vy = (node.vy / speed) * maxSpeed;
        }

        node.x += node.vx;
        node.y += node.vy;
        node.vx *= damping;
        node.vy *= damping;

        // Clip constraints to canvas area
        const pad = 15;
        if (node.x < pad) { node.x = pad; node.vx = 0; }
        if (node.x > width - pad) { node.x = width - pad; node.vx = 0; }
        if (node.y < pad) { node.y = pad; node.vy = 0; }
        if (node.y > height - pad) { node.y = height - pad; node.vy = 0; }
    });
}

function drawGraph() {
    const ctx = memoryGraphCtx;
    const dpr = window.devicePixelRatio || 1;
    const width = memoryGraphCanvas.width / dpr;
    const height = memoryGraphCanvas.height / dpr;

    ctx.clearRect(0, 0, memoryGraphCanvas.width, memoryGraphCanvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    // Translate and Zoom
    ctx.translate(graphOffset.x + width/2, graphOffset.y + height/2);
    ctx.scale(graphZoom, graphZoom);
    ctx.translate(-width/2, -height/2);

    // 1. Draw Links
    graphLinks.forEach(link => {
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw relationship tag text mid-line
        const midX = (link.source.x + link.target.x) / 2;
        const midY = (link.source.y + link.target.y) / 2;
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '7px var(--font-mono)';
        ctx.textAlign = 'center';
        ctx.fillText(link.type, midX, midY - 3);
    });

    // 2. Draw Nodes
    graphNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        
        let strokeColor = 'rgba(255,255,255,0.2)';
        let fillColor = 'rgba(139, 92, 246, 0.15)'; // Personal
        
        if (node.type === 'team') {
            fillColor = 'rgba(6, 182, 212, 0.15)';
            strokeColor = 'rgba(6, 182, 212, 0.5)';
        } else if (node.type === 'knowledge') {
            fillColor = 'rgba(16, 185, 129, 0.15)';
            strokeColor = 'rgba(16, 185, 129, 0.5)';
        } else {
            strokeColor = 'rgba(139, 92, 246, 0.5)';
        }

        if (node === selectedGraphNode) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = strokeColor;
            ctx.lineWidth = 3;
        } else {
            ctx.shadowBlur = 0;
            ctx.lineWidth = 1.5;
        }

        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        // Draw node labels text
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = '8px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + node.radius + 12);
    });

    ctx.restore();
}

function getTransformedMouseCoords(clientX, clientY) {
    const rect = memoryGraphCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const w = memoryGraphCanvas.width;
    const h = memoryGraphCanvas.height;

    // Inverse transform zoom and translation offset
    const tx = (x - graphOffset.x - w/2) / graphZoom + w/2;
    const ty = (y - graphOffset.y - h/2) / graphZoom + h/2;
    return { x: tx, y: ty };
}

function onCanvasMouseDown(e) {
    const coords = getTransformedMouseCoords(e.clientX, e.clientY);
    
    // Find node clicked
    const clickedNode = graphNodes.find(node => {
        const dx = node.x - coords.x;
        const dy = node.y - coords.y;
        return Math.sqrt(dx*dx + dy*dy) < node.radius + 8;
    });

    if (clickedNode) {
        draggedGraphNode = clickedNode;
        selectedGraphNode = clickedNode;
        showGraphTooltip(clickedNode, e.clientX, e.clientY);
    } else {
        selectedGraphNode = null;
        hideGraphTooltip();
        isCanvasDragging = true;
        canvasDragStart = { x: e.clientX - graphOffset.x, y: e.clientY - graphOffset.y };
        memoryGraphCanvas.style.cursor = 'grabbing';
    }
}

function onCanvasMouseMove(e) {
    if (draggedGraphNode) {
        const coords = getTransformedMouseCoords(e.clientX, e.clientY);
        draggedGraphNode.x = coords.x;
        draggedGraphNode.y = coords.y;
        draggedGraphNode.vx = 0;
        draggedGraphNode.vy = 0;
        showGraphTooltip(draggedGraphNode, e.clientX, e.clientY);
    } else if (isCanvasDragging) {
        graphOffset.x = e.clientX - canvasDragStart.x;
        graphOffset.y = e.clientY - canvasDragStart.y;
    }
}

function onCanvasMouseUp() {
    draggedGraphNode = null;
    isCanvasDragging = false;
    if (memoryGraphCanvas) memoryGraphCanvas.style.cursor = 'grab';
}

function onCanvasWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.05;
    if (e.deltaY < 0) {
        graphZoom = Math.min(graphZoom * zoomFactor, 3.0);
    } else {
        graphZoom = Math.max(graphZoom / zoomFactor, 0.4);
    }
}

function showGraphTooltip(node, clientX, clientY) {
    const tooltip = document.getElementById('graph-tooltip');
    if (!tooltip) return;

    tooltip.style.display = 'block';
    
    // Position near the cursor
    const rect = memoryGraphCanvas.getBoundingClientRect();
    const tx = clientX - rect.left + 15;
    const ty = clientY - rect.top + 15;

    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `${ty}px`;

    tooltip.innerHTML = `
        <div style="font-weight: 700; color: #fff; margin-bottom: 4px; font-size:0.8rem; text-transform: uppercase;">
            ${node.type} Node
        </div>
        <div style="color: var(--text-secondary); line-height: 1.3; font-size: 0.75rem; word-break: break-word;">
            ${node.fullText}
        </div>
        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 8px;">
            Double-click canvas node to delete.
        </div>
    `;

    // Hook double click on canvas to delete
    memoryGraphCanvas.addEventListener('dblclick', handleNodeDoubleClickDelete);
}

function handleNodeDoubleClickDelete() {
    if (selectedGraphNode) {
        if (confirm(`Remove this memory node?\n"${selectedGraphNode.fullText}"`)) {
            deleteMemoryNode(selectedGraphNode.id);
            hideGraphTooltip();
        }
    }
}

function hideGraphTooltip() {
    const tooltip = document.getElementById('graph-tooltip');
    if (tooltip) tooltip.style.display = 'none';
    
    if (memoryGraphCanvas) {
        memoryGraphCanvas.removeEventListener('dblclick', handleNodeDoubleClickDelete);
    }
}


// ==========================================================================
// REAL-TIME CANVAS NEON METRICS OSCILLOSCOPE
// ==========================================================================
let routerCanvas = null;
let routerCtx = null;
let telemetryHistory = [];
const telemetryLength = 60;
let activeSimulationPeaks = false;

function startRouterTelemetry() {
    routerCanvas = document.getElementById('router-metrics-canvas');
    if (!routerCanvas) return;
    routerCtx = routerCanvas.getContext('2d');

    // Prepopulate telemetry nodes history
    for (let i = 0; i < telemetryLength; i++) {
        telemetryHistory.push({
            speed: 0,
            latency: 12 + Math.random() * 2,
            vram: 4.2
        });
    }

    resizeRouterCanvas();
    window.addEventListener('resize', () => {
        if (UAIX_STATE.activeView === 'router') resizeRouterCanvas();
    });

    requestAnimationFrame(tickRouterTelemetryLoop);
}

function resizeRouterCanvas() {
    if (!routerCanvas) return;
    const parent = routerCanvas.parentElement;
    if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        routerCanvas.width = rect.width * dpr;
        routerCanvas.height = rect.height * dpr;
        routerCanvas.style.width = `${rect.width}px`;
        routerCanvas.style.height = `${rect.height}px`;
    }
}

// Live simulation metrics value ticks
function startSimulationMetricsTicker() {
    setInterval(() => {
        // Ticks current system values
        let speedPeak = activeSimulationPeaks ? (50 + Math.random() * 15) : (Math.random() > 0.85 ? Math.random() * 8 : 0);
        let latencyVal = activeSimulationPeaks ? (20 + Math.random() * 10) : (11 + Math.random() * 3);
        let cpuLoad = activeSimulationPeaks ? (65 + Math.random() * 15) : (10 + Math.random() * 5);
        let vramLoad = activeSimulationPeaks ? (6.4 + Math.random() * 0.8) : (4.2 + Math.random() * 0.1);

        // Update Nav panel numbers
        const cpuText = document.getElementById('system-cpu-val');
        const vramText = document.getElementById('system-vram-val');
        if (cpuText) cpuText.innerText = `${Math.floor(cpuLoad)}%`;
        if (vramText) vramText.innerText = `${vramLoad.toFixed(1)} GB`;

        // Update settings panels
        const speedSpan = document.getElementById('metrics-speed-val');
        const latencySpan = document.getElementById('metrics-latency-val');
        if (speedSpan) speedSpan.innerText = `${Math.floor(speedPeak)} t/s`;
        if (latencySpan) latencySpan.innerText = `${Math.floor(latencyVal)} ms`;

        // Add history point
        telemetryHistory.shift();
        telemetryHistory.push({
            speed: speedPeak,
            latency: latencyVal,
            vram: vramLoad
        });
    }, 150);
}

function tickRouterTelemetryLoop() {
    if (UAIX_STATE.activeView === 'router' && routerCtx) {
        drawTelemetry();
    }
    requestAnimationFrame(tickRouterTelemetryLoop);
}

function drawTelemetry() {
    const ctx = routerCtx;
    const dpr = window.devicePixelRatio || 1;
    const width = routerCanvas.width / dpr;
    const height = routerCanvas.height / dpr;

    ctx.clearRect(0, 0, routerCanvas.width, routerCanvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridCols = 8;
    const gridRows = 4;
    for (let c = 0; c <= gridCols; c++) {
        const x = (width / gridCols) * c;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let r = 0; r <= gridRows; r++) {
        const y = (height / gridRows) * r;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Graph plotting margins
    const margin = 20;
    const plotWidth = width - margin * 2;
    const plotHeight = height - margin * 2;

    const step = plotWidth / (telemetryLength - 1);

    // 1. Draw speed line (Cyan neon curve)
    ctx.beginPath();
    telemetryHistory.forEach((pt, idx) => {
        const x = margin + step * idx;
        // Normalize speed: max speed is roughly 80 t/s
        const y = height - margin - (pt.speed / 80) * plotHeight;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'var(--accent-cyan)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'var(--accent-cyan-glow)';
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // 2. Draw Latency line (Violet curve)
    ctx.beginPath();
    telemetryHistory.forEach((pt, idx) => {
        const x = margin + step * idx;
        // Normalize latency: max represented latency is 40 ms
        const y = height - margin - (pt.latency / 40) * plotHeight;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'var(--accent-violet)';
    ctx.lineWidth = 1.8;
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'var(--accent-violet-glow)';
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Draw telemetry legends labels
    ctx.fillStyle = 'var(--accent-cyan)';
    ctx.font = '8px var(--font-mono)';
    ctx.fillText('GENERATION SPEED (t/s)', margin, 15);

    ctx.fillStyle = 'var(--accent-violet)';
    ctx.fillText('LATENCY (ms)', margin + 140, 15);

    ctx.restore();
}

// ==========================================================================
// DAG ORCHESTRATOR SIMULATOR IMPLEMENTATION
// ==========================================================================

let currentPreset = 'developer';
let dagSteps = [];
let currentDAGStepIndex = -1;
let dagSimInterval = null;
let dagCost = 0.0;
let isDagSimRunning = false;
let isDagSimPaused = false;
let customDAGCtr = 1;

function initOrchestrator() {
    const presetSelect = document.getElementById('dag-preset');
    const customPromptContainer = document.getElementById('dag-custom-prompt-container');
    const compileBtn = document.getElementById('dag-compile-btn');
    const runBtn = document.getElementById('dag-run-btn');
    const resetBtn = document.getElementById('dag-reset-btn');
    const allowBtn = document.getElementById('dag-hitl-allow');
    const denyBtn = document.getElementById('dag-hitl-deny');
    const regBundleBtn = document.getElementById('dag-register-bundle-btn');
    const downBundleBtn = document.getElementById('dag-download-bundle-btn');

    if (presetSelect) {
        presetSelect.addEventListener('change', (e) => {
            currentPreset = e.target.value;
            if (currentPreset === 'custom') {
                customPromptContainer.style.display = 'block';
            } else {
                customPromptContainer.style.display = 'none';
            }
        });
    }

    if (compileBtn) {
        compileBtn.addEventListener('click', () => {
            compileActiveMission();
        });
    }

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            if (isDagSimRunning) {
                if (isDagSimPaused) {
                    resumeDAGSimulation();
                } else {
                    pauseDAGSimulation();
                }
            } else {
                startDAGSimulation();
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetDAGSimulation();
        });
    }

    if (allowBtn) {
        allowBtn.addEventListener('click', () => {
            handleHitlApproval(true);
        });
    }

    if (denyBtn) {
        denyBtn.addEventListener('click', () => {
            handleHitlApproval(false);
        });
    }

    if (regBundleBtn) {
        regBundleBtn.addEventListener('click', () => {
            registerDAGAsSkill();
        });
    }

    if (downBundleBtn) {
        downBundleBtn.addEventListener('click', () => {
            downloadDAGManifest();
        });
    }

    // Load initial layout
    compileActiveMission();
}

function compileActiveMission() {
    resetDAGSimulation();
    
    const preset = document.getElementById('dag-preset').value;
    const customPrompt = document.getElementById('dag-custom-prompt').value || "Custom Agent Task";
    
    dagSteps = [];
    
    const chatStream = document.getElementById('dag-chat-stream');
    if (chatStream) {
        chatStream.innerHTML = '';
    }
    
    if (preset === 'developer') {
        dagSteps = [
            { id: 'planner', name: 'Planner Agent', subtitle: 'planner.agent', icon: '🧠', x: 40, y: 150, status: 'pending', role: 'planner', info: 'Decomposes intent and sets constraints.' },
            { id: 'researcher', name: 'Research Agent', subtitle: 'researcher.agent', icon: '🔍', x: 230, y: 60, status: 'pending', role: 'researcher', info: 'Gathers context metadata and documentation.' },
            { id: 'coder', name: 'Coder Agent', subtitle: 'coder.agent', icon: '💻', x: 230, y: 240, status: 'pending', role: 'coder', info: 'Generates secure sandbox execution scripts.' },
            { id: 'validator', name: 'Validator Agent', subtitle: 'validator.agent', icon: '🛡️', x: 420, y: 150, status: 'pending', role: 'validator', info: 'Validates code syntax and sandbox compliance.' },
            { id: 'deployer', name: 'Deployer Skill', subtitle: 'deploy.wasm', icon: '🚀', x: 610, y: 150, status: 'pending', role: 'deployer', info: 'Installs package into local Registry.' }
        ];
        dagSteps.edges = [
            { from: 'planner', to: 'researcher' },
            { from: 'planner', to: 'coder' },
            { from: 'researcher', to: 'validator' },
            { from: 'coder', to: 'validator' },
            { from: 'validator', to: 'deployer' }
        ];
        dagSteps.dialogue = [
            { role: 'planner', msg: "Analyzing mission: Develop a secure AES-GCM encryption skill. Decomposing workflow: Research Agent will retrieve API parameters; Coder Agent will build the sandbox logic; Validator Agent will run security scans." },
            { role: 'researcher', msg: "Querying Memory Vault... Found AES template documentation (Ref: MV-3) and dependency schema configurations. Sending context payloads." },
            { role: 'coder', msg: "Context received. Generating safe WASM buffer structure for AES-GCM (256-bit). Compiling runtime module checks..." },
            { role: 'validator', msg: "Commencing compiler security AST scans. Checking for eval/system injection bypass... CLEAN. Validating sandboxed runtime bindings..." },
            { role: 'deployer', msg: "AST verified. Initializing registry injection. Workspace skill registered successfully: WasmSecureCrypto v1.0.0." }
        ];
    } else if (preset === 'feedback') {
        dagSteps = [
            { id: 'planner', name: 'Planner Agent', subtitle: 'planner.agent', icon: '🧠', x: 40, y: 150, status: 'pending', role: 'planner', info: 'Decomposes intent and sets constraints.' },
            { id: 'csv_analyst', name: 'CSV Analyst Skill', subtitle: 'csv_analyst.js', icon: '📊', x: 230, y: 60, status: 'pending', role: 'coder', info: 'Parses local customer feedback datasets.' },
            { id: 'vault_query', name: 'Memory Vault', subtitle: 'vault_query.js', icon: '🔍', x: 230, y: 240, status: 'pending', role: 'researcher', info: 'Performs semantic similarity scans.' },
            { id: 'validator', name: 'Validator Agent', subtitle: 'validator.agent', icon: '🛡️', x: 420, y: 150, status: 'pending', role: 'validator', info: 'Calculates cosine similarity distance scores.' },
            { id: 'reporter', name: 'Output Reporter', subtitle: 'report_maker.js', icon: '📝', x: 610, y: 150, status: 'pending', role: 'deployer', info: 'Formats markdown reports for outliers.' }
        ];
        dagSteps.edges = [
            { from: 'planner', to: 'csv_analyst' },
            { from: 'planner', to: 'vault_query' },
            { from: 'csv_analyst', to: 'validator' },
            { from: 'vault_query', to: 'validator' },
            { from: 'validator', to: 'reporter' }
        ];
        dagSteps.dialogue = [
            { role: 'planner', msg: "Analyzing mission: Analyze customer feedback dataset. Splitting DAG: CSV Analyst extracts tables; Memory Vault pulls historical profiles; Validator parses distance metrics." },
            { role: 'coder', msg: "Executing local file system read. Parsing feedback.csv... Extracted 42 records. Isolating feedback texts." },
            { role: 'researcher', msg: "Scanning local vector indexes matching negative flags: [error, crash, delay]. Extracted 4 template profiles." },
            { role: 'validator', msg: "Matching content. Row #12 has 94.2% semantic similarity to historical crash profiles. Flagging outlier entry." },
            { role: 'deployer', msg: "Writing summary reports. Flagged 1 outlier. Saved results matrix to workspace memory." }
        ];
    } else if (preset === 'security') {
        dagSteps = [
            { id: 'planner', name: 'Planner Agent', subtitle: 'planner.agent', icon: '🧠', x: 40, y: 150, status: 'pending', role: 'planner', info: 'Decomposes intent and sets constraints.' },
            { id: 'auditor', name: 'System Auditor', subtitle: 'auditor.js', icon: '🔍', x: 230, y: 60, status: 'pending', role: 'coder', info: 'Checks config file baselines.' },
            { id: 'keys_scan', name: 'TPM Keys Scan', subtitle: 'tpm_keys.js', icon: '🔑', x: 230, y: 240, status: 'pending', role: 'researcher', info: 'Scans cryptographic signature enclaves. (Requires HITL)' },
            { id: 'validator', name: 'Validator Agent', subtitle: 'validator.agent', icon: '🛡️', x: 420, y: 150, status: 'pending', role: 'validator', info: 'Compares credentials signature validation hashes.' },
            { id: 'console', name: 'Security Console', subtitle: 'console.wasm', icon: '💻', x: 610, y: 150, status: 'pending', role: 'deployer', info: 'Renders system security scorecard metrics.' }
        ];
        dagSteps.edges = [
            { from: 'planner', to: 'auditor' },
            { from: 'planner', to: 'keys_scan' },
            { from: 'auditor', to: 'validator' },
            { from: 'keys_scan', to: 'validator' },
            { from: 'validator', to: 'console' }
        ];
        dagSteps.dialogue = [
            { role: 'planner', msg: "Analyzing mission: Cryptographic security audit. Mapping tasks: Auditor examines configurations; TPM Keys Scan audits enclaves. (Checkpoint: Human Consent)." },
            { role: 'coder', msg: "Scanning local project env profiles. File audits complete. Zero plain-text credentials found. SSL/TLS version: 1.3." },
            { role: 'researcher', msg: "[HITL CHECKSUM] Requesting read access to local TPM chip key hashes. Awaiting user consent..." }
        ];
    } else {
        let s2Name = "Data Scraper Skill";
        let s3Name = "Data Parser Skill";
        let s2Sub = "scraper.js";
        let s3Sub = "parser.js";
        let s2Icon = "🔍";
        let s3Icon = "⚙️";

        const lowerPrompt = customPrompt.toLowerCase();
        if (lowerPrompt.includes('web') || lowerPrompt.includes('scrape') || lowerPrompt.includes('crawler')) {
            s2Name = "Web Scraper Skill";
            s2Sub = "crawler.js";
            s2Icon = "🌐";
            s3Name = "Content Extractor";
            s3Sub = "extractor.js";
            s3Icon = "📝";
        } else if (lowerPrompt.includes('finance') || lowerPrompt.includes('stock') || lowerPrompt.includes('crypto') || lowerPrompt.includes('price')) {
            s2Name = "Market Data Feed";
            s2Sub = "market_data.js";
            s2Icon = "📈";
            s3Name = "Financial Planner";
            s3Sub = "portfolio.js";
            s3Icon = "📊";
        } else if (lowerPrompt.includes('database') || lowerPrompt.includes('sql') || lowerPrompt.includes('db')) {
            s2Name = "SQL Query Skill";
            s2Sub = "sql_query.js";
            s2Icon = "💾";
            s3Name = "JSON Formatter";
            s3Sub = "json_out.js";
            s3Icon = "🔧";
        }

        dagSteps = [
            { id: 'planner', name: 'Planner Agent', subtitle: 'planner.agent', icon: '🧠', x: 40, y: 150, status: 'pending', role: 'planner', info: 'Decomposes intent and sets constraints.' },
            { id: 'step_2', name: s2Name, subtitle: s2Sub, icon: s2Icon, x: 230, y: 60, status: 'pending', role: 'researcher', info: 'Custom gathered data step.' },
            { id: 'step_3', name: s3Name, subtitle: s3Sub, icon: s3Icon, x: 230, y: 240, status: 'pending', role: 'coder', info: 'Custom logic parsing step.' },
            { id: 'validator', name: 'Validator Agent', subtitle: 'validator.agent', icon: '🛡️', x: 420, y: 150, status: 'pending', role: 'validator', info: 'Validates code syntax and sandbox compliance.' },
            { id: 'deployer', name: 'Custom Publisher', subtitle: 'publish.wasm', icon: '🚀', x: 610, y: 150, status: 'pending', role: 'deployer', info: 'Publishes outcome data to dashboard.' }
        ];
        dagSteps.edges = [
            { from: 'planner', to: 'step_2' },
            { from: 'planner', to: 'step_3' },
            { from: 'step_2', to: 'validator' },
            { from: 'step_3', to: 'validator' },
            { from: 'validator', to: 'deployer' }
        ];
        dagSteps.dialogue = [
            { role: 'planner', msg: `Analyzing custom mission: "${customPrompt}". Decomposing workflow: Initiating custom gathering via ${s2Name}; parsing logic via ${s3Name}.` },
            { role: 'researcher', msg: `Executing custom retrieve loops for ${s2Name}... Gathering payloads.` },
            { role: 'coder', msg: `Running custom JS sandbox algorithms in ${s3Name}. Transforming dataset.` },
            { role: 'validator', msg: "Validating custom task outputs against JSON schemas... Checklist passed." },
            { role: 'deployer', msg: "Publishing custom task outcomes. Event handler added to system console." }
        ];
    }
    
    currentDAGStepIndex = -1;
    drawCurrentDAG();
    
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerText = "Run Simulation";
    }
    
    const stateVal = document.getElementById('dag-state');
    if (stateVal) {
        stateVal.innerText = "Compiled";
        stateVal.style.color = "var(--accent-cyan)";
    }
    const indicatorVal = document.getElementById('dag-step-indicator');
    if (indicatorVal) {
        indicatorVal.innerText = `0 / ${dagSteps.length}`;
    }
}

function drawCurrentDAG() {
    const svg = document.getElementById('dag-svg');
    if (!svg) return;
    
    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    if (defs) {
        svg.appendChild(defs);
    } else {
        const newDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        newDefs.innerHTML = `
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.25)" />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
            </marker>
        `;
        svg.appendChild(newDefs);
    }
    
    if (dagSteps.edges) {
        dagSteps.edges.forEach(edge => {
            const fromNode = dagSteps.find(n => n.id === edge.from);
            const toNode = dagSteps.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                const x1 = fromNode.x + 150;
                const y1 = fromNode.y + 25;
                const x2 = toNode.x;
                const y2 = toNode.y + 25;
                
                const dx = x2 - x1;
                const pathData = `M ${x1} ${y1} C ${x1 + dx/2} ${y1}, ${x2 - dx/2} ${y2}, ${x2} ${y2}`;
                
                const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.setAttribute('d', pathData);
                
                const isFromActive = fromNode.status === 'success' || fromNode.status === 'running';
                const isToActive = toNode.status === 'running' || toNode.status === 'success';
                
                pathEl.setAttribute('class', `dag-edge ${isFromActive ? 'active' : ''}`);
                pathEl.setAttribute('marker-end', isToActive ? 'url(#arrow-active)' : 'url(#arrow)');
                svg.appendChild(pathEl);
                
                if (fromNode.status === 'success' && toNode.status === 'running') {
                    const flowEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    flowEl.setAttribute('d', pathData);
                    flowEl.setAttribute('class', 'dag-edge-flow');
                    svg.appendChild(flowEl);
                }
            }
        });
    }
    
    dagSteps.forEach((node, index) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', `dag-node ${node.status}`);
        group.setAttribute('transform', `translate(0, 0)`);
        
        group.addEventListener('mouseenter', (e) => showNodeTooltip(e, node));
        group.addEventListener('mouseleave', hideNodeTooltip);
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('class', 'dag-node-rect');
        rect.setAttribute('x', node.x);
        rect.setAttribute('y', node.y);
        rect.setAttribute('width', 150);
        rect.setAttribute('height', 50);
        group.appendChild(rect);
        
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('class', 'dag-node-icon');
        icon.setAttribute('x', node.x + 12);
        icon.setAttribute('y', node.y + 31);
        icon.textContent = node.icon;
        group.appendChild(icon);
        
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('class', 'dag-node-title');
        title.setAttribute('x', node.x + 38);
        title.setAttribute('y', node.y + 23);
        title.textContent = node.name;
        group.appendChild(title);
        
        const subtitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtitle.setAttribute('class', 'dag-node-subtitle');
        subtitle.setAttribute('x', node.x + 38);
        subtitle.setAttribute('y', node.y + 39);
        subtitle.textContent = node.subtitle;
        group.appendChild(subtitle);
        
        svg.appendChild(group);
    });
}

function showNodeTooltip(e, node) {
    const tooltip = document.getElementById('dag-node-tooltip');
    if (!tooltip) return;
    
    let statusColor = 'var(--text-muted)';
    if (node.status === 'running') statusColor = 'var(--accent-cyan)';
    else if (node.status === 'success') statusColor = 'var(--accent-green)';
    else if (node.status === 'suspended') statusColor = 'var(--accent-amber)';
    else if (node.status === 'failed') statusColor = 'var(--accent-red)';
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px; color: ${statusColor}">${node.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">Status: <span style="text-transform: uppercase; font-weight: bold; color: ${statusColor}">${node.status}</span></div>
        <div style="font-size: 0.75rem; color: var(--text-primary); line-height: 1.3;">${node.info}</div>
    `;
    
    const container = document.getElementById('dag-canvas-container');
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

function hideNodeTooltip() {
    const tooltip = document.getElementById('dag-node-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function startDAGSimulation() {
    isDagSimRunning = true;
    isDagSimPaused = false;
    currentDAGStepIndex = 0;
    
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) {
        runBtn.innerText = "Pause Simulation";
    }
    const stateVal = document.getElementById('dag-state');
    if (stateVal) {
        stateVal.innerText = "Running";
        stateVal.style.color = "var(--accent-cyan)";
    }
    
    runNextDAGStep();
}

function pauseDAGSimulation() {
    isDagSimPaused = true;
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) {
        runBtn.innerText = "Resume Simulation";
    }
    const stateVal = document.getElementById('dag-state');
    if (stateVal) {
        stateVal.innerText = "Paused";
        stateVal.style.color = "var(--accent-amber)";
    }
}

function resumeDAGSimulation() {
    isDagSimPaused = false;
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) {
        runBtn.innerText = "Pause Simulation";
    }
    const stateVal = document.getElementById('dag-state');
    if (stateVal) {
        stateVal.innerText = "Running";
        stateVal.style.color = "var(--accent-cyan)";
    }
    
    runNextDAGStep();
}

function resetDAGSimulation() {
    isDagSimRunning = false;
    isDagSimPaused = false;
    currentDAGStepIndex = -1;
    dagCost = 0.0;
    
    if (dagSimInterval) {
        clearTimeout(dagSimInterval);
        dagSimInterval = null;
    }
    
    const hitlPanel = document.getElementById('dag-hitl-panel');
    if (hitlPanel) hitlPanel.style.display = 'none';
    
    const resCard = document.getElementById('dag-result-card');
    if (resCard) resCard.style.display = 'none';
    
    dagSteps.forEach(node => {
        node.status = 'pending';
    });
    
    drawCurrentDAG();
    
    const costText = document.getElementById('dag-cost');
    if (costText) costText.innerText = "$0.0000";
    
    const tokenText = document.getElementById('dag-tokens');
    if (tokenText) tokenText.innerText = "0 tokens/sec";
    
    const stepText = document.getElementById('dag-step-indicator');
    if (stepText) stepText.innerText = `0 / ${dagSteps.length}`;
    
    const stateText = document.getElementById('dag-state');
    if (stateText) {
        stateText.innerText = "Idle";
        stateText.style.color = "var(--text-muted)";
    }
    
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) {
        runBtn.innerText = "Run Simulation";
    }
    
    const chatStream = document.getElementById('dag-chat-stream');
    if (chatStream) {
        chatStream.innerHTML = `
            <div class="chat-placeholder" style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 40px; padding: 20px;">
                Compile a mission above to establish the multi-agent communication tunnel.
            </div>
        `;
    }
}

function runNextDAGStep() {
    if (!isDagSimRunning || isDagSimPaused) return;
    
    if (currentDAGStepIndex >= dagSteps.length) {
        completeDAGSimulation();
        return;
    }
    
    const node = dagSteps[currentDAGStepIndex];
    
    if (node.id === 'keys_scan' && node.status !== 'success') {
        suspendForHITL();
        return;
    }
    
    node.status = 'running';
    drawCurrentDAG();
    
    const stepText = document.getElementById('dag-step-indicator');
    if (stepText) stepText.innerText = `${currentDAGStepIndex + 1} / ${dagSteps.length}`;
    
    const speedPeak = 45 + Math.floor(Math.random() * 15);
    const tokenText = document.getElementById('dag-tokens');
    if (tokenText) tokenText.innerText = `${speedPeak} tokens/sec`;
    
    dagCost += 0.0002 + (Math.random() * 0.0001);
    const costText = document.getElementById('dag-cost');
    if (costText) costText.innerText = `$${dagCost.toFixed(4)}`;
    
    if (dagSteps.dialogue && dagSteps.dialogue[currentDAGStepIndex]) {
        const d = dagSteps.dialogue[currentDAGStepIndex];
        appendAgentMessage(d.role, d.msg);
    } else {
        const randomMessages = [
            "Decomposing complex DAG constraints.",
            "Analyzing dataset matrices and processing variables.",
            "Applying target safety analyzer checks on sandbox.",
            "Validating execution payload against schema thresholds.",
            "Exporting results database."
        ];
        appendAgentMessage(node.role, randomMessages[currentDAGStepIndex % randomMessages.length]);
    }
    
    dagSimInterval = setTimeout(() => {
        node.status = 'success';
        currentDAGStepIndex++;
        drawCurrentDAG();
        
        runNextDAGStep();
    }, 2800);
}

function suspendForHITL() {
    const node = dagSteps[currentDAGStepIndex];
    node.status = 'suspended';
    drawCurrentDAG();
    
    const stateText = document.getElementById('dag-state');
    if (stateText) {
        stateText.innerText = "Suspended";
        stateText.style.color = "var(--accent-amber)";
    }
    
    const hitlPanel = document.getElementById('dag-hitl-panel');
    const hitlMessage = document.getElementById('dag-hitl-message');
    if (hitlMessage) {
        hitlMessage.innerHTML = `Researcher Agent wishes to access TPM keys located at secure memory vault <code>TPM_HASH_KEYSTORE</code>. Allow access?`;
    }
    if (hitlPanel) {
        hitlPanel.style.display = 'flex';
    }
    
    appendAgentMessage('researcher', "[REQUEST] Security checkpoint: Awaiting explicit developer credential keys audit consent.");
}

function handleHitlApproval(approved) {
    const hitlPanel = document.getElementById('dag-hitl-panel');
    if (hitlPanel) hitlPanel.style.display = 'none';
    
    const node = dagSteps[currentDAGStepIndex];
    if (approved) {
        appendAgentMessage('researcher', "[APPROVED] User granted read access to TPM_HASH_KEYSTORE. Commencing credentials search.");
        node.status = 'success';
        currentDAGStepIndex++;
        
        isDagSimPaused = false;
        const runBtn = document.getElementById('dag-run-btn');
        if (runBtn) runBtn.innerText = "Pause Simulation";
        const stateText = document.getElementById('dag-state');
        if (stateText) {
            stateText.innerText = "Running";
            stateText.style.color = "var(--accent-cyan)";
        }
        
        runNextDAGStep();
    } else {
        appendAgentMessage('researcher', "[DENIED] Access to TPM key repositories was aborted by user.");
        node.status = 'failed';
        drawCurrentDAG();
        
        isDagSimRunning = false;
        const runBtn = document.getElementById('dag-run-btn');
        if (runBtn) runBtn.disabled = true;
        const stateText = document.getElementById('dag-state');
        if (stateText) {
            stateText.innerText = "Failed";
            stateText.style.color = "var(--accent-red)";
        }
        
        appendAgentMessage('planner', "[CRITICAL] Mission halted. Dependency TPM key scan failed safety checks due to credentials block.");
    }
}

function completeDAGSimulation() {
    isDagSimRunning = false;
    
    const runBtn = document.getElementById('dag-run-btn');
    if (runBtn) runBtn.disabled = true;
    const stateText = document.getElementById('dag-state');
    if (stateText) {
        stateText.innerText = "Completed";
        stateText.style.color = "var(--accent-green)";
    }
    const tokenText = document.getElementById('dag-tokens');
    if (tokenText) tokenText.innerText = "0 tokens/sec";
    
    const resultCard = document.getElementById('dag-result-card');
    const resultDesc = document.getElementById('dag-result-description');
    
    if (resultCard) resultCard.style.display = 'flex';
    
    const preset = document.getElementById('dag-preset').value;
    if (resultDesc) {
        if (preset === 'developer') {
            resultDesc.innerText = "AES Cryptographic Module created and sandbox AST safety checks verified. Ready to register package WasmSecureCrypto.";
        } else if (preset === 'feedback') {
            resultDesc.innerText = "Semantic feedback report compiled. 1 Crash outlier detected and saved into Memory Vault database index.";
        } else if (preset === 'security') {
            resultDesc.innerText = "Cryptographic credentials scan completed. 100% security coverage baseline confirmed.";
        } else {
            resultDesc.innerText = "Custom mission executed. Agent package output compiles successfully.";
        }
    }
}

function appendAgentMessage(role, text) {
    const stream = document.getElementById('dag-chat-stream');
    if (!stream) return;
    
    const placeholder = stream.querySelector('.chat-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const msg = document.createElement('div');
    msg.className = 'agent-msg';
    
    let avatarChar = '🧠';
    let label = 'Planner';
    if (role === 'researcher') { avatarChar = '🔍'; label = 'Researcher'; }
    else if (role === 'coder') { avatarChar = '💻'; label = 'Coder'; }
    else if (role === 'validator') { avatarChar = '🛡️'; label = 'Validator'; }
    else if (role === 'deployer') { avatarChar = '🚀'; label = 'Deployer'; }
    
    msg.innerHTML = `
        <div class="agent-avatar ${role}">${avatarChar}</div>
        <div class="agent-bubble">
            <div class="agent-name">${label} Agent</div>
            <div class="agent-text">${text}</div>
        </div>
    `;
    
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
}

function registerDAGAsSkill() {
    const preset = document.getElementById('dag-preset').value;
    let name = "CustomMissionSkill";
    let desc = "Custom generated skill by DAG Orchestrator.";
    
    if (preset === 'developer') {
        name = "WasmSecureCrypto";
        desc = "AES-GCM (256-bit) file encryptor sandbox module.";
    } else if (preset === 'feedback') {
        name = "FeedbackAnalyzer";
        desc = "Customer reviews parser and similarity scanner.";
    } else if (preset === 'security') {
        name = "CryptoKeysAuditor";
        desc = "TPM credential registers and system variables scan.";
    }
    
    if (!UAIX_STATE.customSkills) {
        UAIX_STATE.customSkills = [];
    }
    
    const exists = UAIX_STATE.customSkills.some(s => s.name === name) || UAIX_STATE.installedSkills.includes(name.toLowerCase());
    if (exists) {
        alert(`Skill "${name}" is already registered in this workspace.`);
        return;
    }
    
    const id = name.toLowerCase();
    const newSkill = {
        id: id,
        name: name,
        desc: desc,
        version: "1.0.0"
    };
    
    UAIX_STATE.customSkills.push(newSkill);
    UAIX_STATE.installedSkills.push(id);
    saveState();
    
    renderSkillsGrid();
    
    alert(`Success! "${name}" has been registered as an active workspace skill. You can view it in the Dashboard's Installed Skills.`);
}

function downloadDAGManifest() {
    const preset = document.getElementById('dag-preset').value;
    let manifestName = "custom_mission_agent";
    let manifestData = {
        name: manifestName,
        version: "1.0.0",
        description: "Custom DAG Orchestrated Skill Module.",
        permissions: ["sandbox_execute"],
        dependencies: []
    };
    
    if (preset === 'developer') {
        manifestData = {
            name: "WasmSecureCrypto",
            version: "1.0.0",
            description: "AES-GCM (256-bit) local file encryption module.",
            permissions: ["file_system", "cryptography"],
            dependencies: ["sql-engine"]
        };
        manifestName = "wasm_secure_crypto";
    } else if (preset === 'feedback') {
        manifestData = {
            name: "FeedbackAnalyzer",
            version: "1.0.0",
            description: "Analyses feedback CSV documents and retrieves matches.",
            permissions: ["file_system", "memory_vault"],
            dependencies: ["csv-analyst"]
        };
        manifestName = "feedback_analyzer";
    } else if (preset === 'security') {
        manifestData = {
            name: "CryptoKeysAuditor",
            version: "1.0.0",
            description: "Audits TPM registers and matches local signature key hash.",
            permissions: ["tpm_read", "network_baseline"],
            dependencies: []
        };
        manifestName = "crypto_keys_auditor";
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifestData, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${manifestName}_manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// Pre-compiled short descriptions/snippets for when CORS blocks fetching files (e.g. double clicking index.html directly)
const FALLBACK_DOCS = {
    '1_architecture.md': `# U-AIX OS Architecture Specification

This document details the complete 5-layer system architecture of the **Universal AI Operating System (U-AIX OS)**.

- **Layer 1: User Experience (U-AIX UX)**: Intent shell logs and telemetry widgets.
- **Layer 2: Identity + Memory Cloud**: Universal secure keys (TPM) and vector database sync loops.
- **Layer 3: Agent Runtime Engine**: Orchestrator, WASM sandboxes, and Pub/Sub event loops.
- **Layer 4: Multi-Model Intelligence Router**: Scores requirements to route queries (local LLM default).
- **Layer 5: Universal Skill Store**: Package registry validation schemas.

> [!NOTE]
> Unlike traditional SaaS orchestration libraries, the U-AIX OS executes 100% locally by prioritizing zero-cost local LLM routing parameters.

### IPC Broadcast Message Payload
\`\`\`json
{
  "event": "dag_created",
  "execution_id": "exec_40912ae-330f",
  "steps": [
    { "step_id": "s-1", "agent": "research_agent", "action": "query_memories" }
  ]
}
\`\`\``,

    '2_ui_screens.md': `# U-AIX OS User Experience (UX) Specification

This document defines the layout grids, typography scales, active states, and responsive dimensions of U-AIX OS:

| Breakpoint Target | Screen Width Range | Layout Configuration |
|---|---|---|
| **Large Desktop** | \`>= 1200px\` | 3-Column / Sidebars Pinned |
| **Tablet/Standard**| \`901px - 1199px\`| 2-Column / Condensed menus |
| **Mobile Port** | \`<= 900px\` | Single column stacked |

> [!TIP]
> Hovering nodes inside the memory network highlights linked associations directly in the 2D Canvas viewport.`,

    '3_database_design.md': `# U-AIX OS Database Schema Specification

This document details the SQLite schema design for U-AIX local-first storage operations:

\`\`\`sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    public_key TEXT NOT NULL,
    profile_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed', 'suspended')),
    input_prompt TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
\`\`\`

> [!IMPORTANT]
> SQLite utilizes virtual tables mapping sqlite-vss parameters to handle 384-dimensional vector indexes.`,

    '4_apis.md': `# U-AIX OS API Specification

This document defines the REST API endpoints and WebSockets stream format:

### Endpoint: Run Agent Intent Loop
- **Path & Method**: \`POST /agent/run\`
- **Payload Schema**:
\`\`\`json
{
  "intent": "Scrape site data and compile reports",
  "agent_id": "auto_planner_agent",
  "model_override": "llama3"
}
\`\`\`
- **Response (202 Accepted)**:
\`\`\`json
{
  "success": true,
  "execution_id": "exec_40912ae-330f"
}
\`\`\``,

    '5_sdk_structure.md': `# U-AIX OS SDK Structure Specification

This document outlines standard wrapper libraries and decorators in Python and TS:

### Python Skill Decorator
\`\`\`python
@skill(
    name="WebScraper",
    version="1.0.0",
    permissions=["network"],
    description="Fetches text payload from target URLs"
)
def fetch_url(context: AgentContext, url: str) -> str:
    import urllib.request
    return urllib.request.urlopen(url).read().decode('utf-8')
\`\`\``,

    '6_marketplace_logic.md': `# U-AIX OS Marketplace Logic Specification

This document details AST verification checks and developer signature validation:

- **AST Token Analysis**: Checks for raw \`eval()\`, cookies access, or blocked global bypasses.
- **WASM Dry Run**: Enforces memory limitations and runtime timeouts.
- **Cryptographic Signature Verification**: Manifest is signed using developer public keys.

> [!CAUTION]
> Supply chain attacks are mitigated by executing dry-run tests inside isolated WebAssembly structures prior to package publishing.`,

    '7_agent_lifecycle.md': `# U-AIX OS Agent State Machine & Lifecycle Specification

This document defines the transitions, retry routines, and self-repair cycles:

- **Created**: Initialize configuration context.
- **Planning**: Generate sub-task execution DAG nodes.
- **Executing**: Run sandbox skills, handle user prompt approvals.
- **Suspended**: Human-in-the-loop authorization waits.
- **Validating**: Confirm schema alignment.
- **Completed**: Save metrics and sync data to local vaults.

> [!WARNING]
> If external skills attempt execution actions without declared permissions, the runtime halts, entering the Suspended state to await human verification.`,

    '8_deployment.md': `# U-AIX OS Deployment Specification

This document details self-hosting configurations:

### Docker Compose Stack
\`\`\`yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
  uaix-daemon:
    image: uaix/daemon:v1.0.0
    ports:
      - "5000:5000"
    depends_on:
      - ollama
\`\`\``,

    '9_cost_estimates.md': `# U-AIX OS Cost Estimates Financial Specification

Financial calculations comparing proprietary API consumption against local FOSS execution:

| Budget Metric | Closed Cloud API Stack | U-AIX OS Local-First |
|---|---|---|
| **Input Tokens (per 1M)** | ~$3.00 | **$0.00** |
| **Output Tokens (per 1M)** | ~$15.00 | **$0.00** |
| **Average Monthly Bill** | **$700.00** | **$0.00** |

> [!NOTE]
> Local hardware execution cost is fixed at $0.00, rendering multi-agent loops economically viable at enterprise scales.`,

    '10_growth_strategy.md': `# U-AIX OS Ecosystem Growth Strategy

Outlines developer loop flywheels, hackathons, and software integrations:

- **Integration Bridges**:
  - *Ollama*: Local model provider.
  - *CrewAI*: Sandbox agent orchestrator.
  - *LlamaIndex*: Sovereign RAG document database.
- **Acquisition Campaign**: Sponsoring global virtual hackathons to build custom local-first connector skills.`,

    '11_investor_deck.md': `# U-AIX OS Investor Pitch Deck Specification

Fundraising slides, speaker guide, TAM metric models, and timelines:

- **TAM (Total Addressable Market)**: $150B (Global AI spend).
- **SAM (Serviceable Addressable Market)**: $35B (Private/sovereign AI spent).
- **SOM (Serviceable Obtainable Market)**: $1.8B (FOSS middlewares & local registries).
- **Fundraising Target**: $2.5M Seed round for WASM compiler setups and enterprise clusters dashboard.`,

    '12_technical_documents.md': `# U-AIX OS Technical Specifications Document

Details vector memory sync loops and multi-model routing scoring weights:

### Routing Weight Score Code
\`\`\`javascript
if (task.isSensitive) {
    scores.localLLM += 100;
    scores.cloudProprietary -= 100;
}
if (task.complexity === 'high') {
    scores.cloudProprietary += 100;
}
\`\`\``,

    '13_competitive_positioning.md': `# U-AIX OS Competitive Positioning Specification

Strategic SWOT analysis comparing U-AIX against developer SDKs:

- **SWOT Strengths**: 100% offline security, zero token billing, package validation scan, sandboxed WASM execution.
- **Differentiators**: Frameworks (CrewAI/LangChain) are libraries requiring developers code. U-AIX is a runtime dashboard environment for immediate drag, edit, configure, and execute.`,

    '14_global_launch_plan.md': `# U-AIX OS Global Go-To-Market (GTM) Launch Plan

12-month calendar and GTM metrics index:

- **Month 1**: GitHub CLI tool repositories launch.
- **Month 3**: Public Skill Store registry submissions open.
- **Month 6**: Double-clickable Desktop App releases.
- **Month 12**: Centralized Kubernetes cluster hub integration.

| KPI Category | Metric Indicator | Target Threshold |
|---|---|---|
| **Adoption** | Daily Active Workspaces | 15,000+ local |
| **Ecosystem** | Verified skills registry | 400+ plugins |`
};

