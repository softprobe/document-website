---
title: Softprobe UI Testing
---

# Softprobe UI 测试

从用户视角测试应用：在浏览器中完成一段操作，再检查页面显示的结果。可以先只检查页面；检查服务端请求和采集真实用户会话都可按需选择。

## 检查页面

如果只需检查页面和用户操作，用 Playwright 即可。无需修改应用，也无需配置 Softprobe。

- [Playwright 编写测试指南](https://playwright.dev/docs/writing-tests)
- [用自然语言描述 UI 测试](/zh/ui-testing/natural-language)。只检查 UI 时，不配置后端跟踪即可。

## 可选：检查后端请求

页面显示“成功”，不代表应用真的发出了邮件或请求了支付服务。需要检查这类请求时，再启用 Softprobe 跟踪。无需修改前端代码，但可能需要开发人员为服务端启用跟踪。

- [比较不同的采集方式](/zh/ui-testing/frontend-instrumentation)
- [查看后端请求检查教程](/zh/ui-testing/tutorial)
- [从录制的用户操作生成测试](/zh/ui-testing/from-sessions)（需要先采集会话）

只有在需要采集真实用户会话并据此生成测试时，才需要接入前端 SDK。

## 选择平台

- [Web 测试](/zh/ui-testing/web)
- [移动端测试](/zh/ui-testing/mobile)
