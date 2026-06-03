::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# Softprobe AI Engine CLI (`spcode`)

The **`spcode`** command-line interface is the local autonomous AI engine and developer companion for the **Softprobe** product suite.

While the backend Go `sp` CLI orchestrates record-and-replay pipelines, mock policies, and replay trace analysis, `spcode` powers the interactive, agent-driven side of the platform—running local terminal user interfaces (TUI), executing autonomous background tasks, serving as the bridge for IDE plugins, and hosting Model Context Protocol (MCP) servers.

---

## 1. Unified Configuration Standard

To ensure a seamless, friction-free developer experience, both the `sp` and `spcode` tools read from a unified configuration layout under the **`softprobe`** namespace. 

Credentials and base connectivity rules are co-located in a shared file, allowing single sign-on (SSO) out of the box, while CLI-specific settings are kept in separate domain files to avoid configuration pollution.

```text
~/.config/softprobe/
├── config.jsonc      <-- Shared parameters (Base URL and credentials, read by BOTH sp and spcode)
├── sp.jsonc          <-- Go "sp" CLI-specific profiles and configurations
└── spcode.jsonc      <-- Bun "spcode" AI-specific settings (models, permissions, etc.)
```

> [!NOTE]
> When you log in using `sp auth login`, your authentication token is automatically written into `~/.config/softprobe/config.jsonc`. The `spcode` AI engine natively reads from this shared file, meaning you never have to re-authenticate or manually duplicate access tokens.

---

## 2. Command Reference

The `spcode` CLI supports a robust, full-featured suite of commands for terminal-based AI automation.

### Interactive TUI Workspace
```bash
spcode
```
Launches the full, interactive **Terminal User Interface (TUI)**. This is a rich, Neovim-inspired workspace where you can chat with agents, inspect active trace files, run diagnostics, and edit code side-by-side with an LLM.

### Autonomous Task Execution
```bash
spcode run "Refactor the authentication logic in src/auth.ts to use the new session helper"
```
Executes an autonomous AI task directly from your shell in headless mode. Extremely useful for scripting, quick fixes, or running checks inside CI/CD pipelines.

### Configuration Parity
View and inspect active configuration schemas and system directories. This command mirrors the `sp config` command group to provide symmetrical configuration parity.

*   **`spcode config show`**: Displays the active fully-resolved config schema, including the model in use, allowed tool permissions, environment variable overrides, and loaded plugins.
    ```bash
    spcode config show
    ```
*   **`spcode config paths`**: Displays active directory paths where configuration, caching, application state, database records, and logs are persisted.
    ```bash
    spcode config paths
    ```

### LLM Providers & Models
Inspect available LLM backends, credentials, and cached models.

*   **`spcode models`**: Lists all LLM models currently cached and supported by the local AI engine.
    ```bash
    # List all supported models
    spcode models
    # Filter models by a specific provider
    spcode models vertex
    ```
*   **`spcode providers`**: Interactive command to manage, configure, and test credentials for LLM providers (Vertex AI, OpenAI, Anthropic, etc.).
    ```bash
    spcode providers
    ```

### Session Management
Query and manage agent chat sessions.

```bash
# List all active and archived chat sessions
spcode session list

# Export a session to a JSON or Markdown file
spcode session export <session-id> --out-dir ./exports

# Resume a specific session in TUI mode
spcode session resume <session-id>
```

### Model Context Protocol (MCP)
Manage Model Context Protocol servers to extend the AI agent's capabilities with external tools.

```bash
# List all registered and active MCP servers
spcode mcp list

# Register a new MCP server
spcode mcp register --name database-inspector --command "npx" --args "-y sql-mcp-server"
```

### Local Background Daemon
Launches the local agent service background daemon. This is used by IDE extensions (such as VS Code or JetBrains) and external integrations to orchestrate agent actions in the background.

```bash
spcode serve --port 4096
```

### Analytics & Metrics
Inspect operational analytics, token consumption, and success metrics for active agents.

```bash
spcode stats
```

### Interactive Web Dashboard
Launches a rich web-based UI workspace and dashboard to visually inspect past runs, inspect agent reasoning steps, and manage settings.

```bash
spcode web --port 3000
```

### Database Diagnostics
Performs diagnostics, maintenance, and schema migrations on the local SQLite agent database (`softprobe.db`).

```bash
spcode db status
spcode db migrate
```

### Lifecycle & Maintenance
*   **`spcode upgrade`**: Checks for updates and installs the latest version of the `spcode` CLI.
    ```bash
    spcode upgrade
    ```
*   **`spcode uninstall`**: Performs a comprehensive cleanup of the local AI engine. It removes binary installations, local database states (`softprobe.db`), temporary agent run repositories, and cached prompts.
    ```bash
    spcode uninstall
    ```

---

## 3. Workspace-Level Overrides

By default, `spcode` loads your global user-level configurations from `~/.config/softprobe/`. However, you can commit custom configurations directly into your Git repositories to share them with your entire team.

Whenever `spcode` is executed, it walks up the directory tree from your current working directory to find a **`.softprobe`** folder.

```text
my-project-repo/
├── .softprobe/
│   ├── config.jsonc      <-- Workspace-level shared connectivity overrides
│   └── spcode.jsonc      <-- Workspace-level AI model and agent rules
├── src/
└── package.json
```

### Example: `.softprobe/spcode.jsonc`
```jsonc
{
  "model": "vertex/gemini-2.5-pro", // Enforce a specific model for this project
  "sp": {
    "tool_permissions": {
      "sp_read": "allow",           // Auto-allow search & read tools for speed
      "sp_grep": "allow"
    }
  }
}
```

---

## 4. Environment Variables

Environment variables act as strict, runtime overrides for both JSON configuration files and system defaults.

| Environment Variable | JSON Equivalent | Description |
| :--- | :--- | :--- |
| `SP_API_URL` | `config.jsonc` -> `api_url` | Base URL of the Softprobe Backend API |
| `SP_STORAGE_URL` | `config.jsonc` -> `storage_url` | API Storage URL (falls back to API URL if unset) |
| `SP_RESOURCE_DIR` | `spcode.jsonc` -> `sp.resource_dir` | Directory where AI introspector tools store mock signatures |
| `XDG_CONFIG_HOME` | — | Overrides the root configuration directory (`~/.config/`) |
