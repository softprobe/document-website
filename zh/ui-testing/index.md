---
title: Softprobe UI Testing
---

# Softprobe UI 测试

旅行应用显示“预订成功”，但它真的向邮件服务发送了确认邮件请求吗？Softprobe 让你用自然语言描述预订步骤，并检查页面显示的结果。启用后端跟踪后，同一个测试还可以检查邮件请求；出现问题时，你也可以查看关联的链路。

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

- [Playwright 编写测试指南](https://playwright.dev/docs/writing-tests)
- [编写第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test)
- [用自然语言描述 UI 测试](/zh/ui-testing/natural-language)。只检查 UI 时，不配置后端跟踪即可。

## 可选：检查后端请求

页面显示“成功”，不代表应用真的向邮件服务发出了邮件请求。启用 Softprobe 跟踪后，可以检查服务端请求并查看关联链路。可能需要开发人员为服务端启用跟踪。检查请求并不能证明邮件已经送达。

- [比较不同的采集方式](/zh/ui-testing/frontend-instrumentation)
- [查看后端请求检查教程](/zh/ui-testing/tutorial)
- [从录制的用户操作生成测试](/zh/ui-testing/from-sessions)（需要先采集会话）

只有在需要采集真实用户会话并据此生成测试时，才需要接入前端 SDK。

## 选择平台

- [Web 测试](/zh/ui-testing/web)
- [移动端测试](/zh/ui-testing/mobile)
