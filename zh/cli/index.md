---
layout: home

hero:
  name: Softprobe 命令已迁移
  text: "`sp` 现在归入测试文档"
  tagline: 安装、设置、命令参考、自动化和生命周期文档都在测试区域。
  actions:
    - theme: brand
      text: 测试命令
      link: /zh/testing/commands/
    - theme: alt
      text: 安装 Softprobe
      link: /zh/testing/installation/

features:
  - title: Java-agent lifecycle
    details: Create an app, list it, set recording policy, install `sp-agent.jar`, run the app with a stable `sp.app.id`, and list recorded cases before replay.
  - title: Auto mock and compare
    details: Replay uses recorded dependency data to mock configured calls and compare replay behavior against the original recording.
  - title: JSON-first automation
    details: Stable `--json` output, exit codes, and artifact paths let AI coding agents and CI jobs script replay diagnosis without parsing tables.
---

旧 CLI 区域仅作为兼容入口保留。主要用户文档现在位于 [测试命令](/zh/testing/commands/)。
