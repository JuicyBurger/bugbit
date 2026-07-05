# 🐛 bugbit

**Your own Cursor agent, reviewing every pull request.**

bugbit is a lightweight, self-hosted GitHub Action that reviews pull requests
using your own Cursor account and agent runtime. No opaque hosted reviewer in
the middle — bugbit calls the Cursor SDK directly from inside the workflow,
so every review runs with the same models, context handling, and codebase
understanding you already get inside the Cursor editor. It just happens
automatically, on every PR.

**How it works:**

1. 🔍 Checks out the PR and resolves the head/base branches from the Actions context
2. 🧠 Invokes Cursor built-in review skills (`/review`, `/review-security`, `/simplify`) with a GitHub Actions overlay for read-only, line-anchored findings
3. 💬 Posts findings back as **inline comments**, on the exact diff lines — via the standard Pull Request Review Comments API

No walls of text at the bottom of the conversation. Just clean, line-anchored feedback, powered by the agent you already trust.
