---
layout: home

hero:
  name: Softprobe commands have moved
  text: "`sp` now lives under Testing"
  tagline: Use Testing for installation, setup, command reference, automation, and lifecycle documentation.
  actions:
    - theme: brand
      text: Testing commands
      link: /en/testing/commands/
    - theme: alt
      text: Install Softprobe
      link: /en/testing/installation/

features:
  - title: Java-agent lifecycle
    details: Create an app, list it, set recording policy, install `sp-agent.jar`, run the app with a stable `sp.app.id`, and list recorded cases before replay.
  - title: Auto mock and compare
    details: Replay uses recorded dependency data to mock configured calls and compare replay behavior against the original recording.
  - title: JSON-first automation
    details: Stable `--json` output, exit codes, and artifact paths let AI coding agents and CI jobs script replay diagnosis without parsing tables.
---

The old CLI section is retained only as a compatibility entry point. Primary user documentation now lives under [Testing commands](/en/testing/commands/).
