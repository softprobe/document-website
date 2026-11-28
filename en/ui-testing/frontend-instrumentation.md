---
title: Choosing how to capture UI actions
---

# Choose how to capture UI actions

Start with the result you want to check. You can test what appears on a page without changing the app. If you also want to inspect a server request or generate a test from a recorded session, that path has its own setup.

## Choose a path {#comparison}

| Your goal | What you need | Start here |
|---|---|---|
| Check a web page in a test | A test runner and, for new `agent.act()` steps, a model. No frontend SDK or backend tracing is required. | [Your first web UI test](/en/ui-testing/classic-web-first-test) |
| Check a backend request during a test | A configured Blackbox sink and backend telemetry that captures the relevant request. The frontend SDK is optional. | [Natural-language tests with backend checks](/en/ui-testing/natural-language) |
| Generate a test from a recorded web session | Web action spans from `@softprobe/web-record`, a Blackbox session, and a coding agent. Backend telemetry is needed only for backend checks. | [Generate tests from a recorded web session](/en/ui-testing/from-sessions) |
| Capture actions while testing a mobile app | `softprobeMobile` can capture actions driven by its host test without an SDK in the app. Export to a configured sink to inspect the session. | [Test an unmodified mobile app](/en/ui-testing/mobile#path-1) |
| Capture manual or real-user mobile sessions | Add the platform SDK and configure export from the app. This path can capture actions outside a host-driven test. | [Instrument a mobile app](/en/ui-testing/mobile#path-2) |

The mobile host capture path records actions performed through the test engine. It is not a recorder for arbitrary manual sessions. Its proxy-based backend checks also require the app to use the proxy address supplied at launch.

## Understand the difference {#benefits}

The frontend SDK records supported actions inside the application. Mobile host capture observes actions performed by the test runner. Both can provide semantic actions for a coding agent when those actions are exported to Blackbox. A coding agent uses the session history to write a test; the SDK does not turn the recording into a test by itself.

To check only what a user sees, omit the backend sink and trace assertions. For a server check, configure backend telemetry and verify the relevant request in Blackbox. A visible success message alone does not prove that a server request or an email was sent.

## Next steps {#examples}

### Web UI test {#example-web-uninstrumented}

Follow [your first web UI test](/en/ui-testing/classic-web-first-test). To add a backend request check, see [natural-language tests with backend checks](/en/ui-testing/natural-language).

### Recorded web session {#example-web-instrumented}

Set up [web session capture](/en/ui-testing/from-sessions) to generate a test from actions recorded by the browser SDK.

### Mobile host capture {#example-mobile-uninstrumented}

See [the mobile host capture path](/en/ui-testing/mobile#path-1) for its device and proxy requirements.

### Mobile app SDK {#example-mobile-instrumented}

See [the mobile SDK path](/en/ui-testing/mobile#path-2) for React Native, Android, and iOS setup.

## Related {#related}

- [UI Testing overview](/en/ui-testing/)
- [Test web applications](/en/ui-testing/web)
- [Test iOS and Android apps](/en/ui-testing/mobile)
