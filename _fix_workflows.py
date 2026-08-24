import base64, json, subprocess, sys

BUGBIT_SHA = "5d243f5"
LABEL = "Review effort 4/5"

# Template with proper formatting
template = """name: PR Review (bugbit)

on:
  pull_request:
    types: [opened, reopened, ready_for_review, synchronize]
    branches:
      - dev
      - staging
  workflow_dispatch:
    inputs:
      pr_number:
        description: PR number to review
        required: true
        type: number

concurrency:
  group: bugbit-review-${{ github.event.pull_request.number || inputs.pr_number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  issues: write   # needed when describe-labels is set

jobs:
  bugbit_review:
    # Skip bots, drafts, and fork PRs (forks cannot access CURSOR_API_KEY secrets)
    if: >-
      ${{ github.event_name == 'workflow_dispatch'
          || (github.event.sender.type != 'Bot'
              && github.event.pull_request.draft == false
              && github.event.pull_request.head.repo.full_name == github.repository) }}
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - name: Resolve PR number
        id: pr
        run: |
          set -euo pipefail
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            echo "number=${{ github.event.pull_request.number }}" >> "$GITHUB_OUTPUT"
          else
            echo "number=${{ inputs.pr_number }}" >> "$GITHUB_OUTPUT"
          fi

      - name: Checkout PR head
        # Pin to v4.2.2 (not mutable @v4)
        uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
        with:
          fetch-depth: 0
          ref: refs/pull/${{ steps.pr.outputs.number }}/head
          persist-credentials: false

      - name: Run bugbit review + describe
        # JuicyBurger/bugbit v1.4.0 — auto-describe + progressive slim diffs
        uses: JuicyBurger/bugbit@5d243f5
        with:
          cursor-api-key: ${{ secrets.CURSOR_API_KEY }}
          github-token: ${{ github.token }}
          # Cursor SDK Auto (server-selected). Avoids pinning Claude/GPT/etc.
          model: auto
          review-modes: code-review
          auto-describe: true
          describe-labels: "{label}"
          post-clean-summary: true
          pr-number: ${{ steps.pr.outputs.number }}
""".format(label=LABEL)

def encode_base64_levels(content, levels):
    """Encode content to base64 for specified number of levels."""
    encoded = content
    for _ in range(levels):
        encoded = base64.b64encode(encoded.encode('utf-8')).decode('utf-8').replace('\n', '').replace('\r', '')
    return encoded

def patch_workflow(org, repo, branch):
    path = ".github/workflows/bugbit-pr-review.yml"
    full_repo = f"{org}/{repo}"
    print(f"Patching {full_repo}@{branch}")
    
    # Get current content
    resp = json.loads(subprocess.run(
        ['gh', 'api', f'repos/{full_repo}/contents/{path}'],
        capture_output=True, text=True
    ).stdout)
    
    sha = resp['sha']
    content = resp['content']
    
    # Decode to find number of base64 levels
    level_count = 0
    temp = content
    for _ in range(10):
        try:
            decoded = base64.b64decode(temp).decode('utf-8')
            if len(decoded) > 100 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in decoded):
                temp = decoded
                level_count += 1
            else:
                break
        except:
            break
    
    if level_count == 0:
        level_count = 3  # default to 3 levels
    
    print(f"  Found {level_count} base64 level(s), SHA: {sha}")
    
    # Encode template with same number of levels
    new_content = encode_base64_levels(template, level_count)
    
    # Commit
    body_file = "C:\\Users\\MSI-PC\\AppData\\Local\\Temp\\bugbit-patch.json"
    body = {
        "message": f"fix: repair bugbit workflow auto-describe config ({BUGBIT_SHA})",
        "content": new_content,
        "sha": sha,
        "branch": branch
    }
    
    with open(body_file, 'w') as f:
        json.dump(body, f)
    
    result = subprocess.run(
        ['gh', 'api', f'repos/{full_repo}/contents/{path}', '-X', 'PUT', '--input', body_file, '--jq', '.commit.sha'],
        capture_output=True, text=True
    )
    
    if result.returncode == 0 and result.stdout.strip():
        print(f"  -> Committed: {result.stdout.strip()}")
    else:
        print(f"  -> FAILED: {result.stderr}")

repos = [
    ("okejob-hrms", "web-hrms", "dev"),
    ("okejob-hrms", "mobile-hrms", "main"),
    ("Kost-co", "backoffice", "main"),
    ("Kost-co", "frontend", "master"),
    ("okejob-elorae", "elorae-mini-e-procurement", "master")
]

for org, repo, branch in repos:
    patch_workflow(org, repo, branch)

print("\nDone!")
