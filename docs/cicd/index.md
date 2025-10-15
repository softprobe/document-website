---
sidebar_position: 1
---

# CI/CD Pipeline

This project includes automated GitHub Actions workflows:

## Integration Tests

- **Trigger**: Push to main/bill/deploy branches, Pull Requests
- **Workflow**: `.github/workflows/integration-test.yml`
- **Actions**: 
  - Builds WASM binary
  - Runs integration tests with Softprobe backend
  - Validates end-to-end telemetry pipeline

## Release Process

- **Trigger**: Git tags with format `v*.*.*` (e.g., `v1.2.3`)
- **Workflow**: `.github/workflows/release.yml`
- **Actions**:
  - Updates `Cargo.toml` version from tag
  - Builds and tests WASM binary
  - Publishes Docker images to `softprobe/sp-istio-wasm` and `softprobe/sp-envoy`
  - Creates GitHub release with WASM binary and deployment files

### Required GitHub Secrets for Release

- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

## Creating a Release

```bash
git tag v1.2.3
git push origin v1.2.3
```

The release workflow will automatically:
1. Extract version from tag
2. Update Cargo.toml version
3. Build and test
4. Publish Docker images 
5. Create GitHub release with assets
