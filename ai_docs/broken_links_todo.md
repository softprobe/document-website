# 断开链接修复待办事项

## 配置文件问题

- [x] **修复 `docusaurus.config.ts` 中的弃用警告**
  - 将 `onBrokenMarkdownLinks: "warn"` 移动到 `markdown: { hooks: { onBrokenMarkdownLinks: "warn" } }` 中。

## Markdown 文件内部链接问题

以下文件（包括英文和中文）存在指向已不存在页面的链接，需要移除这些链接：

- [x] **`docs/account-setup.md` 和 `i18n/zh/docusaurus-plugin-content-docs/current/account-setup.md`**
  - 移除链接到 `troubleshooting` 的部分。
- [x] **`docs/installation.md` 和 `i18n/zh/docusaurus-plugin-content-docs/current/installation.md`**
  - 移除链接到 `deployment`, `troubleshooting`, `architecture` 的部分。
- [x] **`docs/quick-start.md` 和 `i18n/zh/docusaurus-plugin-content-docs/current/quick-start.md`**
  - 移除链接到 `development`, `architecture` 的部分。
- [x] **`docs/index.md` 和 `i18n/zh/docusaurus-plugin-content-docs/current/index.md`**
  - 移除链接到 `troubleshooting`, `development` 的部分。
