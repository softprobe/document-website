---
title: 如何选择 UI 动作采集方式
---

# 如何选择 UI 动作采集方式

先确定要检查的结果。检查页面显示内容时，无需修改应用。如果还要检查服务器请求，或从录制会话生成测试，需要另外配置。

## 选择路径 {#comparison}

| 目标 | 需要什么 | 从这里开始 |
|---|---|---|
| 在测试中检查 Web 页面 | 测试运行器。首次执行新的 `agent.act()` 步骤时还需要模型。不需要前端 SDK 或后端跟踪。 | [第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test) |
| 在测试中检查后端请求 | 配置 Blackbox 接收端，并在后端采集相关请求。前端 SDK 是可选的。 | [同时检查后端的自然语言测试](/zh/ui-testing/natural-language) |
| 从录制的 Web 会话生成测试 | 使用 `@softprobe/web-record` 采集 Web 动作，准备 Blackbox 会话和编码 Agent。只有检查后端时才需要后端跟踪。 | [从录制的 Web 会话生成测试](/zh/ui-testing/from-sessions) |
| 测试移动应用时采集动作 | `softprobeMobile` 可以在宿主机测试期间采集由测试驱动的动作，无需在应用中接入 SDK。要在 Blackbox 中查看会话，请配置接收端。 | [测试未改动的移动应用](/zh/ui-testing/mobile#path-1) |
| 采集手动测试或真实用户的移动端会话 | 在应用中接入对应平台的 SDK，并配置导出。此路径可以采集宿主机测试之外的动作。 | [为移动应用接入 SDK](/zh/ui-testing/mobile#path-2) |

移动端宿主机采集记录由测试引擎执行的动作，不能录制任意手动会话。通过代理检查后端时，应用还必须使用启动时传入的代理地址。

## 了解区别 {#benefits}

前端 SDK 在应用内部采集支持的动作。移动端宿主机采集则记录测试运行器执行的动作。将动作导出到 Blackbox 后，编码 Agent 可以使用会话历史编写测试。SDK 不会自行将录制内容转换为测试。

如果只检查用户看到的内容，可以不配置后端接收端和链路断言。检查服务器请求时，需要配置后端跟踪，并在 Blackbox 中验证相关请求。页面显示成功并不能证明服务器已发出请求或邮件。

## 下一步 {#examples}

### Web UI 测试 {#example-web-uninstrumented}

按照[第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test)开始。要增加后端请求检查，请参阅[同时检查后端的自然语言测试](/zh/ui-testing/natural-language)。

### 录制 Web 会话 {#example-web-instrumented}

配置 [Web 会话采集](/zh/ui-testing/from-sessions)，从浏览器 SDK 记录的动作生成测试。

### 移动端宿主机采集 {#example-mobile-uninstrumented}

查看[移动端宿主机采集路径](/zh/ui-testing/mobile#path-1)及其设备和代理要求。

### 移动端应用 SDK {#example-mobile-instrumented}

查看[移动端 SDK 路径](/zh/ui-testing/mobile#path-2)，了解 React Native、Android 和 iOS 的配置。

## 相关文档 {#related}

- [UI Testing 概览](/zh/ui-testing/)
- [测试 Web 应用](/zh/ui-testing/web)
- [测试 iOS 与 Android 应用](/zh/ui-testing/mobile)
