---
title: Softprobe UI Testing
---

# Softprobe UI 测试

预订页面显示“成功”，但应用是否真的请求邮件服务发送了确认邮件？只检查页面无法回答这个问题。

在 Web 示例中，`e2e` 运行器使用 AI 模型执行你描述的搜索航班、预订等操作；测试检查你指定的结果，例如是否显示航班。

**你也可以检查页面背后发生了什么。** 配置 Blackbox 和后端跟踪后，测试可以检查确认邮件请求，在请求缺失时帮助你查看关联链路。你也可以在 Playwright 测试中添加这些检查。这需要配置服务端，也不能证明邮件已经送达。

你可以先运行 Web 示例，无需修改应用或配置后端跟踪。如果只需要检查页面，[普通 Playwright 测试](https://playwright.dev/docs/writing-tests)也是一种选择。

测试移动应用？[iOS 与 Android 指南](/zh/ui-testing/mobile)介绍了 AI 辅助操作和从录制会话生成测试。当前移动端示例包含后端检查，无法作为独立演示运行。

## 选择起点

- **尝试 Web 测试：**[搜索航班并完成预订](/zh/ui-testing/classic-web-first-test)。第一个测试只检查页面，不会向 Blackbox 发送会话。
- **检查后端请求：**[为现有 Playwright 测试添加检查](/zh/ui-testing/web#playwright-fixture)，或查看[后端检查教程](/zh/ui-testing/tutorial)。两者都需要后端跟踪。
- **测试移动应用：**[选择移动端工作流](/zh/ui-testing/mobile#choose-workflow)。

## 看看航班预订

这个旅行示例搜索从伦敦到巴黎的航班。UI 测试可以检查是否出现航班，再完成预订并检查支付成功消息。

[编写第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test)，检查这个流程。

![旅行示例中的航班搜索结果](/img/ui-testing/travel-search-results.png)

视频展示同一示例的预订过程，使用虚构的乘客信息和测试卡。视频是浏览器操作演示，不是自动化测试通过的录屏。

<video controls playsinline preload="metadata" width="1280" height="720" poster="/img/ui-testing/travel-booking-confirmation.png" style="width: 100%; height: auto;">
  <source src="/videos/ui-testing/travel-booking.mp4" type="video/mp4">
  <track kind="captions" src="/videos/ui-testing/travel-booking.zh.vtt" srclang="zh" label="中文" default>
  <track kind="captions" src="/videos/ui-testing/travel-booking.en.vtt" srclang="en" label="English">
  <a href="/videos/ui-testing/travel-booking.mp4">下载预订演示视频</a>
</video>

<details>
<summary>视频内容说明</summary>
<p>旅客选择伦敦希思罗机场和巴黎戴高乐机场，搜索并选择航班。随后填写虚构的乘客和联系信息，确认预订并使用测试卡支付。示例网站显示预订参考号和支付成功消息。视频没有声音，也没有验证邮件是否送达。</p>
</details>

## 检查页面

用自然语言描述步骤，并检查页面显示的结果。开始时无需修改应用或配置后端跟踪。

- [Playwright 编写测试指南](https://playwright.dev/docs/writing-tests)（Playwright 官方文档）
- [编写第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test)
- [用自然语言描述 UI 测试](/zh/ui-testing/natural-language)。只检查 UI 时，不配置后端跟踪即可。

## 可选：检查后端请求

页面显示“成功”，不代表应用真的向邮件服务发出了邮件请求。启用 Softprobe 跟踪后，可以检查服务端请求并查看关联链路。可能需要开发人员为服务端启用跟踪。检查请求并不能证明邮件已经送达。

- [比较不同的采集方式](/zh/ui-testing/frontend-instrumentation)
- [查看后端请求检查教程](/zh/ui-testing/tutorial)
- [从录制的用户操作生成测试](/zh/ui-testing/from-sessions)（需要先采集会话）

需要采集浏览器会话（包括手动测试会话）并据此生成测试时，可以接入前端 SDK。

## 选择平台

- [Web 测试](/zh/ui-testing/web)
- [移动端测试](/zh/ui-testing/mobile)
