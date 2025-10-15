#!/bin/bash

# Pull the latest tags from the remote repository
git pull --tags

# Fetch the most recent tag
latest_tag=$(git tag --sort=-v:refname | head -n 1)

# Extract the major, minor, and patch versions
major=$(echo $latest_tag | cut -d. -f1 | tr -d 'v')
minor=$(echo $latest_tag | cut -d. -f2)
patch=$(echo $latest_tag | cut -d. -f3)

# Increase the patch version
new_patch=$((patch + 1))

# Form the new version
new_version="v${major}.${minor}.${new_patch}"

# Create the new tag and release
gh release create $new_version --title "Release $new_version" -n "Description for release $new_version"

echo "Created new release: $new_version"


# Get the GitHub repository owner and name from the remote URL
repo_url=$(git config --get remote.origin.url)
repo_owner=$(echo "$repo_url" | sed 's|.*github.com[:/]\([^/]\+\)/\([^/]\+\)\.git|\1|')
repo_name=$(echo "$repo_url" | sed 's|.*github.com[:/]\([^/]\+\)/\([^/]\+\)\.git|\2|')

echo "Repository Owner: $repo_owner"
echo "Repository Name: $repo_name"

# Wait for GitHub Actions workflow to complete successfully
echo "Waiting for GitHub Actions workflow to complete..."
workflow_status="pending"
while [ "$workflow_status" != "success" ]; do
  sleep 30 # Wait for 30 seconds before checking again
  workflow_run=$(gh api "/repos/$repo_owner/$repo_name/actions/runs" | jq -r ".workflow_runs | sort_by(.created_at) | reverse | .[0].conclusion")
  echo "Workflow run: $workflow_run"
  workflow_status=$(echo "$workflow_run")
  echo "Workflow status: $workflow_status"
  if [ "$workflow_status" == "failure" ]; then
    echo "GitHub Actions workflow failed. Exiting."
    exit 1
  fi
done
echo "GitHub Actions workflow completed successfully."

# Update YAML file in GitHub repository
file_path="pro/saas/doc/deployment.yaml"
yaml_url="https://github.com/softprobe/deployment-k8s/blob/main/pro/saas/doc/deployment.yaml"

echo "Updating YAML file: $yaml_url"

# Get current YAML file content and SHA
deployment_repo_name="deployment-k8s"
yaml_content_info=$(gh api "/repos/$repo_owner/$deployment_repo_name/contents/$file_path")
current_yaml_content=$(echo "$yaml_content_info" | jq -r ".content" | base64 -d)
sha=$(echo "$yaml_content_info" | jq -r ".sha")

echo "Current SHA: $sha"

# Replace the version number in the image tag
updated_yaml_content=$(echo "$current_yaml_content" | sed "s|image: sjc.ocir.io/axqjl8ow85vi/saas-doc:v[0-9]\+\.[0-9]\+\.[0-9]\+|image: sjc.ocir.io/axqjl8ow85vi/saas-doc:${new_version}|")

# Encode the updated content to base64
updated_yaml_content_base64=$(echo "$updated_yaml_content" | base64 | tr -d '\n')

echo "New YAML content prepared."

# Update the YAML file in the repository
commit_message="Update version to ${new_version}"
gh api -X PUT "/repos/$repo_owner/$deployment_repo_name/contents/$file_path" \
  -f message="$commit_message" \
  -f content="$updated_yaml_content_base64" \
  -f sha="$sha" \
  -f branch="main"

echo "YAML file updated to version ${new_version}."
echo "Release process completed."
