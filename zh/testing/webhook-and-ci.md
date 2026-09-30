---
title: 发版后自动回放（CI/CD）
---

# 发版后自动回放（CI/CD）

新版本部署到测试环境后，可以由流水线自动触发一次回放，再根据回放结论决定流水线是否继续。本页提供一个通用脚本，以及在 Jenkins、GitLab CI、GitHub Actions 中接入的示例。

::: tip 先手动完成一次回放
流水线只负责触发回放，不会录制用例。接入前，请先参照 [录制流量](/zh/testing/recording) 和 [回放与对比](/zh/testing/replay-and-diff) 手动完成一次回放，确认应用已有录制数据、测试环境可以访问。
:::

## 准备工作 {#before-you-start}

::: warning 仅限内网调用
回放触发接口（`/openapi/v1/...`）没有鉴权，任何能访问后端的人都可以触发回放、修改通知渠道。请只允许内网中的 CI 机器访问，不要暴露到公网。
:::

- **部署方式**：仅私有化部署可用，SaaS 暂未开放这组接口。
- **网络**：CI 机器需要能访问 SoftProbe 后端，后端需要能访问被测服务。独立部署时，CI 直接访问后端，默认端口为 8090。
- **All-in-One 部署**：需要先开启转发。在部署的环境变量中设置 `SP_REPLAY_OPENAPI=true`，然后重启服务（Docker 部署需重建容器）。未开启时，请求会返回 404、405 或一个网页。
- **回放环境**：回放会向被测服务发送真实请求，下游的数据库、Redis、HTTP 调用使用录制时的数据。被测服务应部署在测试环境，回放目标地址不要指向生产环境。建议关闭回放环境的录制，或减少录制量，避免再次录制回放流量。
- **工具**：执行脚本的机器需要安装 bash、curl 和 jq。

## 获取触发地址 {#get-url}

打开设置页的「通知」，顶部「CI 触发回放（OpenAPI）」中给出了触发地址，以及一段带有当前应用 appId 的 curl 示例，可直接复制。

![设置页中的 CI 触发回放地址](/img/docs/testing/zh/settings-ci-trigger.png)

- 地址随页面顶部选择的环境变化。有多个后端时，请先切换到要回放的环境。
- 页面优先给出后端自身的地址。如果后端只能在本机或容器网络内访问，则给出经本服务转发的地址，并提示如何开启转发。
- 使用转发地址且本服务设置了登录密码时，curl 需要加上 `-u 'opencode:<登录密码>'`。下文的脚本默认直连后端，改用转发地址时，脚本中的两处 curl 也需要加上这个参数。

## 触发回放 {#trigger}

最少只需两个参数：应用的 `appId` 和被测服务地址 `targetEnv`。

```bash
curl -X POST http://sp-backend.internal:8090/openapi/v1/replay-triggers \
  -H 'Content-Type: application/json' \
  -d '{"appId": "order-service", "targetEnv": "http://order-service.test:8080"}'
```

接口立即返回，回放在后台执行：

```json
{
  "planId": "6abb8559e5eb34767296c557",
  "statusUrl": "/openapi/v1/replay-runs/6abb8559e5eb34767296c557",
  "errorCode": null,
  "errorMessage": null
}
```

触发失败时，HTTP 状态码仍为 200，由 `errorCode` 说明原因。例如传入的接口路径没有录制过，会返回 `UNKNOWN_OPERATION`，并列出具体是哪几个。全部错误码见 [回放触发 Open API](/zh/testing/reference/replay-openapi#trigger-errors)。

常用参数：

| 参数 | 说明 |
|---|---|
| `appId` | 必填。应用的 appId |
| `targetEnv` | 必填。被测服务地址，如 `http://order-service.test:8080` |
| `operations` | 只回放指定的接口，填写接口路径（与录制列表中显示的一致），如 `["/order/create", "/order/pay"]`。不填则回放整个应用 |
| `caseSource` | 用例来源：`rolling`（默认）使用最近录制的流量，`pinned` 使用 [固化用例](/zh/testing/pinned-cases)。两种来源请分别触发，分别查看结论 |
| `caseSourceHours` | 使用最近多少小时的录制，默认 24。对 `pinned` 无效 |
| `caseTags` | 按录制时的标签筛选用例，如 `{"env": "prod"}`。同一应用录制了多个环境的流量时，需要设置此参数，避免回放测试环境自身录制的流量 |
| `attributes` | 本次发版的信息，如提交、分支、流水线编号和链接、环境名，会显示在群通知中 |

完整参数说明见 [回放触发 Open API](/zh/testing/reference/replay-openapi#trigger)。

## 查询回放进度 {#wait}

每隔几秒查询一次：

```bash
curl http://sp-backend.internal:8090/openapi/v1/replay-runs/6abb8559e5eb34767296c557
```

`status` 为 `PENDING` 或 `RUNNING` 时继续等待，变为 `COMPLETED` 表示回放已结束、结论已确定。回放跑完后，SoftProbe 先等 AI 降噪结束再确定结论，在此之前 `status` 仍为 `RUNNING`。降噪被跳过或失败也算结束；没有部署 AI 时，回放跑完 3 分钟后确定结论。`COMPLETED` 不代表没有问题，还需要查看回放结论。

## 根据结论决定是否继续 {#decide}

回放结束后，查看响应中的 `findings.state`。只有 `CLEAN` 表示已完成验证且未发现问题。

| `findings.state` | 含义 | 示例脚本的处理 |
|---|---|---|
| `CLEAN` | 已验证，未发现问题 | 继续（退出码 0） |
| `NEEDS_ACTION` | 存在需要处理的问题，如接口返回 500 或 404、字段值变化、字段缺失、下游调用减少 | 停止（退出码 1） |
| `REVIEW_ONLY` | 只有需要人工核对的差异，如新增字段、下游调用增加、个别接口返回 401 或超时 | 停止（退出码 1）。团队也可以决定放行 |
| `LOW_COVERAGE` | 未发现问题，但回放的接口或请求太少，不足以判断这次发版是否有问题 | 停止（退出码 2） |
| `NO_CASES` | 没有可回放的请求 | 停止（退出码 2） |
| `INTERRUPTED` | 回放没有跑完 | 停止（退出码 2） |
| `ENVIRONMENT_FAILURE` | 超过一半的接口出现同一种失败，且出现该失败的接口至少有 3 个，如都无法连接或都返回 500，通常是测试环境的问题 | 停止（退出码 2） |

响应中的 `reportUrl` 是这次回放的 [回放报告](/zh/testing/replay-report) 地址。流水线停止时，建议把它输出到日志，方便查看。

::: warning 不要根据通过率判断
通过率 95% 的回放，可能恰好是下单接口出了问题；通过率 100% 的回放，也可能只验证了三个接口。响应中的 `verdict` 和 `passRate` 只反映通过率，不能代替 `findings.state`。
:::

### 只回放少量接口时，先登记主链路接口 {#main-operations}

只有回放正常结束，且没有需要处理或核对的问题时，才会检查覆盖是否足够。未登记主链路接口时，只要回放的接口少于 10 个或请求少于 30 条，即使用例全部通过，结论也会是 `LOW_COVERAGE`。

如果发版后只回放几个关键接口，请先把它们登记为该应用的主链路接口。登记后，覆盖检查改为看主链路接口是否都已回放，不再按数量判断，其他判断不变。目前界面上没有入口，需通过接口登记：

```bash
curl -X POST http://sp-backend.internal:8090/api/config/schedule/modify/UPDATE \
  -H 'Content-Type: application/json' \
  -d '{"appId": "order-service", "mainOperations": ["/order/create", "/order/pay"]}'
```

将 `mainOperations` 设为空数组 `[]` 即可取消登记。

## 完整脚本 {#script}

下面的脚本完成上述全部步骤：触发回放、等待回放结束，并根据 `findings.state` 返回退出码。将它保存为仓库中的 `ci/softprobe-replay.sh`，在流水线中调用即可。

| 退出码 | 含义 |
|---|---|
| 0 | `CLEAN`，未发现问题 |
| 1 | `NEEDS_ACTION` 或 `REVIEW_ONLY`，有问题需要处理或核对 |
| 2 | 未完成验证（`LOW_COVERAGE`、`NO_CASES`、`INTERRUPTED`、`ENVIRONMENT_FAILURE`），或调用出错、等待超时 |

```bash
#!/usr/bin/env bash
# 部署完成后触发回放，等待回放结束，根据 findings.state 决定流水线是否继续。
# 退出码：0 = 未发现问题（CLEAN）；1 = 有问题需要处理或核对；2 = 未完成验证，或调用出错。
set -euo pipefail

# 必填：SP_BACKEND（SoftProbe 后端地址）、SP_APP_ID（应用 appId）、SP_TARGET（被测服务地址）
for name in SP_BACKEND SP_APP_ID SP_TARGET; do
  if [ -z "${!name:-}" ]; then
    echo "请设置 $name"
    exit 2
  fi
done
case_source="${SP_CASE_SOURCE:-rolling}"   # rolling：最近录制的流量；pinned：固化用例
timeout_seconds="${SP_TIMEOUT_SECONDS:-1800}"
if [[ ! "$timeout_seconds" =~ ^[1-9][0-9]*$ ]]; then
  echo "SP_TIMEOUT_SECONDS 必须是正整数"
  exit 2
fi

# 1. 触发回放。用 jq 生成请求体，分支名中有引号也不会破坏 JSON。
if ! body=$(jq -n \
  --arg appId "$SP_APP_ID" \
  --arg targetEnv "$SP_TARGET" \
  --arg caseSource "$case_source" \
  --arg operations "${SP_OPERATIONS:-}" \
  --arg caseTags "${SP_CASE_TAGS:-}" \
  --arg hours "${SP_CASE_SOURCE_HOURS:-}" \
  --arg environment "${SP_ENVIRONMENT:-}" \
  --arg revision "${SP_REVISION:-}" \
  --arg branch "${SP_BRANCH:-}" \
  --arg runId "${SP_PIPELINE_RUN_ID:-}" \
  --arg runUrl "${SP_PIPELINE_RUN_URL:-}" \
  '{appId: $appId, targetEnv: $targetEnv, caseSource: $caseSource,
    attributes: ({"deployment.environment.name": $environment,
                  "vcs.ref.head.revision": $revision, "vcs.ref.head.name": $branch,
                  "cicd.pipeline.run.id": $runId, "cicd.pipeline.run.url.full": $runUrl}
                 | with_entries(select(.value != "")))}
   + (if $operations == "" then {} else {operations: ($operations | split(","))} end)
   + (if $caseTags == "" then {} else {caseTags: ($caseTags | fromjson)} end)
   + (if $hours == "" then {} else {caseSourceHours: ($hours | tonumber)} end)' 2>/dev/null); then
  echo "参数有误：SP_CASE_TAGS 必须是 JSON，SP_CASE_SOURCE_HOURS 必须是数字"
  exit 2
fi

if ! resp=$(curl -sS --fail --max-time 30 -X POST "$SP_BACKEND/openapi/v1/replay-triggers" \
    -H 'Content-Type: application/json' -d "$body"); then
  echo "触发请求失败，请检查 SP_BACKEND 地址和网络"
  exit 2
fi
if ! jq -e 'type == "object"' >/dev/null 2>&1 <<<"$resp"; then
  echo "返回内容不是预期的 JSON，通常是地址有误，或未开启 /openapi 转发"
  exit 2
fi
error=$(jq -r '.errorCode // empty | tostring' <<<"$resp")
if [ -n "$error" ]; then
  echo "触发回放失败：$error $(jq -r '.errorMessage // empty' <<<"$resp")"
  exit 2
fi
plan_id=$(jq -r '.planId | strings' <<<"$resp")
if [ -z "$plan_id" ]; then
  echo "返回内容中没有 planId：$resp"
  exit 2
fi
echo "已触发回放，planId=$plan_id"

# 2. 等待回放结束。个别查询失败时继续等待，直到超时。
deadline=$((SECONDS + timeout_seconds))
while :; do
  run=$(curl -sS --fail --max-time 30 "$SP_BACKEND/openapi/v1/replay-runs/$plan_id" 2>/dev/null) || run=""
  status=$(jq -r '.status? | strings' 2>/dev/null <<<"$run") || status=""
  [ "$status" = "COMPLETED" ] && break
  if [ "$status" = "UNKNOWN" ]; then
    echo "找不到这次回放：$(jq -r '.errorCode // empty' <<<"$run")"
    exit 2
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "已等待 $timeout_seconds 秒，回放仍未结束，planId=$plan_id"
    exit 2
  fi
  sleep 10
done

# 3. 根据回放结论决定。只有 CLEAN 视为通过，不看通过率。
state=$(jq -r '.findings.state? | strings' 2>/dev/null <<<"$run") || state=""
echo "回放结论：${state:-无法获取}"
echo "报告：$(jq -r '.reportUrl // "无"' <<<"$run")"
case "$state" in
  CLEAN) exit 0 ;;
  NEEDS_ACTION | REVIEW_ONLY) exit 1 ;;
  *) exit 2 ;;  # NO_CASES、INTERRUPTED、ENVIRONMENT_FAILURE、LOW_COVERAGE，或无法获取结论
esac
```

脚本读取以下环境变量：

| 变量 | 必填 | 说明 |
|---|---|---|
| `SP_BACKEND` | 是 | SoftProbe 后端地址，如 `http://sp-backend.internal:8090` |
| `SP_APP_ID` | 是 | 应用的 appId |
| `SP_TARGET` | 是 | 被测服务地址 |
| `SP_OPERATIONS` | 否 | 只回放这些接口，多个接口用逗号分隔，如 `/order/create,/order/pay` |
| `SP_CASE_SOURCE` | 否 | `rolling`（默认）或 `pinned` |
| `SP_CASE_SOURCE_HOURS` | 否 | 使用最近多少小时的录制，默认 24 |
| `SP_CASE_TAGS` | 否 | 按录制标签筛选用例，JSON 格式，如 `{"env":"prod"}` |
| `SP_ENVIRONMENT` | 否 | 环境名，显示在群通知中 |
| `SP_REVISION`、`SP_BRANCH` | 否 | 本次发版的提交和分支 |
| `SP_PIPELINE_RUN_ID`、`SP_PIPELINE_RUN_URL` | 否 | 流水线编号和链接，群通知中的「流水线」会链接到这里 |
| `SP_TIMEOUT_SECONDS` | 否 | 最长等待时间（秒），默认 1800 |

脚本不会重试触发请求：触发请求超时时，回放可能已经创建，重试会再执行一次。

## 在流水线中使用

把这一步放在部署到测试环境、服务启动完成之后。以下三个示例都只是调用上面的脚本，区别仅在于各平台的写法。

### Jenkins

```groovy
stage('SoftProbe 回放') {
  environment {
    SP_BACKEND          = 'http://sp-backend.internal:8090'
    SP_APP_ID           = 'order-service'
    SP_TARGET           = 'http://order-service.test:8080'
    SP_ENVIRONMENT      = 'test'
    SP_REVISION         = "${env.GIT_COMMIT ?: ''}"
    SP_BRANCH           = "${env.BRANCH_NAME ?: ''}"   // BRANCH_NAME 只在多分支流水线中有值
    SP_PIPELINE_RUN_ID  = "${env.BUILD_NUMBER}"
    SP_PIPELINE_RUN_URL = "${env.BUILD_URL}"
  }
  steps {
    sh 'bash ci/softprobe-replay.sh'
  }
}
```

### GitLab CI

```yaml
softprobe-replay:
  stage: verify            # 需要先在 stages 中声明，并排在部署到测试环境的 stage 之后
  tags: [intranet]         # 使用能访问内网的 runner
  variables:
    SP_BACKEND: http://sp-backend.internal:8090
    SP_APP_ID: order-service
    SP_TARGET: http://order-service.test:8080
    SP_ENVIRONMENT: test
    SP_REVISION: $CI_COMMIT_SHA
    SP_BRANCH: $CI_COMMIT_REF_NAME
    SP_PIPELINE_RUN_ID: $CI_PIPELINE_ID
    SP_PIPELINE_RUN_URL: $CI_PIPELINE_URL
  script:
    - bash ci/softprobe-replay.sh
```

### GitHub Actions

GitHub 托管的 runner 位于公网，无法访问内网中的后端，需要使用部署在内网的自托管 runner。

```yaml
jobs:
  softprobe-replay:
    needs: deploy-test               # 部署到测试环境的 job
    runs-on: [self-hosted, intranet]
    steps:
      - uses: actions/checkout@v4
      - name: SoftProbe 回放
        env:
          SP_BACKEND: http://sp-backend.internal:8090
          SP_APP_ID: order-service
          SP_TARGET: http://order-service.test:8080
          SP_ENVIRONMENT: test
          SP_REVISION: ${{ github.sha }}
          SP_BRANCH: ${{ github.ref_name }}
          SP_PIPELINE_RUN_ID: ${{ github.run_id }}
          SP_PIPELINE_RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: bash ci/softprobe-replay.sh
```

## AI 分析原因

[流程设置](/zh/testing/replay-report#flow-settings) 中的「CI 触发的回放」默认开启：回放结束、AI 降噪完成后，服务端会自动分析未通过的用例，结果写入 [回放报告](/zh/testing/replay-report)。

- 流水线不需要等待分析完成，根据 `findings.state` 即可决定是否继续。
- 轮询响应中的 `analysis` 是分析结果的汇总，例如有多少条用例的差异由代码改动引起。它不会改变 `findings.state`，即使 AI 判断有误，也不会因此放行流水线。如果希望根据「是否有代码改动引起的差异」决定流水线是否继续，可以自行读取 `analysis`。字段说明见 [回放触发 Open API](/zh/testing/reference/replay-openapi#analysis)。

## 结果通知

回放结果可以推送到飞书群、钉钉群或你自己的系统。只有通过本页接口触发的回放才会推送。配置方法见 [回放结果通知](/zh/testing/notifications)。

## 常见问题

| 现象 | 原因及处理 |
|---|---|
| 返回一个网页，或 404、405 | 地址有误；All-in-One 部署还需检查是否设置了 `SP_REPLAY_OPENAPI=true` |
| `APP_NOT_REGISTERED` | 传入了 `operations`，但 appId 有误，或该应用还没有录制到流量 |
| `UNKNOWN_OPERATION` | 接口路径与录制的不一致，返回信息中会列出具体是哪几个 |
| 结论为 `NO_CASES` | 这段时间内没有录制到流量，或 `caseTags` 把用例全部筛掉了 |
| 结论总是 `LOW_COVERAGE` | 见 [只回放少量接口时，先登记主链路接口](#main-operations) |
| 结论为 `ENVIRONMENT_FAILURE` | 先检查被测服务是否已启动、地址是否正确、网络是否连通。如果大量接口返回同一个状态码（如 500），也可能是应用本身出错，请打开报告查看 |
| 等待超时 | 用例较多或被测服务响应较慢。可调大 `SP_TIMEOUT_SECONDS`，或用 `SP_OPERATIONS` 缩小回放范围 |

## 其他触发方式 {#other-ways}

以下两种方式也能发起回放，但**不会推送通知**。新接入的流水线建议使用本页前面介绍的接口。

### `GET /api/createPlan`

只创建回放计划，不等待结果：

```bash
curl -G http://sp-backend.internal:8090/api/createPlan \
  --data-urlencode "appId=order-service" \
  --data-urlencode "targetEnv=http://order-service.test:8080"
```

成功时，返回中的 `data.replayPlanId` 即 planId。默认使用最近 24 小时的录制，可以通过 `caseSourceFrom`、`caseSourceTo`（毫秒时间戳）调整时间范围。获取 planId 后，也可以使用 [查询回放进度](#wait) 中的接口查询结论。

### `sp` 命令

```bash
sp replay run --app order-service --env http://order-service.test:8080 \
  --suite Pinned --name "ci-${BUILD_NUMBER}" --watch --json
```

`--suite Pinned` 只回放手动固化的用例。命令用法见 [replay 命令](/zh/testing/commands/replay)。

## 相关文档

- [回放报告](/zh/testing/replay-report)
- [回放结果通知](/zh/testing/notifications)
- [回放触发 Open API](/zh/testing/reference/replay-openapi)
- [固化用例与测试集](/zh/testing/pinned-cases)
