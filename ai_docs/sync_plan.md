# 中文文档与英文源同步计划

## 总体目标

将 `i18n/zh/` 目录下的中文文档，在**目录结构**和**文件内容**上，与 `docs/` 目录下的英文源文档完全保持一致，解决当前存在的版本脱节和结构不匹配问题。

---

### 阶段一：结构对齐与文件清理

此阶段的目标是使中文翻译的目录结构与英文源的扁平化结构完全匹配。

**步骤 1.1：分析文件差异**

- **英文源 (`docs/`)**:
  - `account-setup.md`
  - `config.md`
  - `index.md`
  - `installation.md`
  - `quick-start.md`
- **中文翻译 (`i18n/zh/.../current/`)**:
  - 存在于 `getting-started/` 和 `deployment/` 等子目录中。
  - 包含一些在英文源中**已不存在**的文件，如 `architecture.md`, `deployment/development.md` 等。

**步骤 1.2：移动并重命名文件**

我会执行一系列 `mv` 命令，将现有的中文翻译文件移动到 `i18n/zh/docusaurus-plugin-content-docs/current/` 根目录下，使其路径与英文文件对应。

**步骤 1.3：处理已废弃的中文文档**

对于那些在当前英文 `docs/` 目录中已不存在对应文件的中文文档（如 `architecture.md`），我会将它们移动到一个临时备份目录 `i18n/zh/docusaurus-plugin-content-docs/current_backup/` 中。这样做可以避免直接删除可能还有用的内容，方便后续审查。

**步骤 1.4：删除空的旧目录**

在移动完所有文件后，我会删除 `i18n/zh/docusaurus-plugin-content-docs/current/` 下遗留的空目录（如 `getting-started/`, `deployment/` 等）。

---

### 阶段二：内容更新与翻译

此阶段的目标是确保每一篇中文文档的内容都是其对应英文文档的最新、最准确的翻译。

**步骤 2.1：逐一对比与翻译**

我会逐一处理以下文件对：

1.  `docs/index.md` -> `i18n/zh/.../current/index.md`
2.  `docs/account-setup.md` -> `i18n/zh/.../current/account-setup.md`
3.  `docs/quick-start.md` -> `i18n/zh/.../current/quick-start.md`
4.  `docs/installation.md` -> `i18n/zh/.../current/installation.md`
5.  `docs/config.md` -> `i18n/zh/.../current/config.md`

对于每一对文件，我会：

1.  读取最新的英文版本内容。
2.  读取当前的中文版本内容。
3.  **进行差异分析**，找出英文版中新增、修改或删除的部分。
4.  **更新中文翻译**，将差异部分进行翻译并合并到中文文件中，同时保留未改动部分的现有翻译。

---

### 阶段三：UI 与配置同步

此阶段的目标是确保网站的 UI 文本（如导航栏、页脚）与英文主配置保持同步。

**步骤 3.1：检查主配置文件中的 UI 文本**

- 检查 `docusaurus.config.ts` 文件中 `themeConfig` 部分的 `navbar` 和 `footer` 配置，识别所有需要翻译的文本和链接。

**步骤 3.2：同步 UI 翻译文件**

- 对比 `i18n/zh/docusaurus-theme-classic/navbar.json` 和 `i18n/zh/docusaurus-theme-classic/footer.json` 的内容，确保所有链接和标签都与主配置保持同步和翻译准确。

---

### 执行计划

这个计划会通过一系列的文件操作（移动、删除）和文件编辑（读取、写入）来完成。
