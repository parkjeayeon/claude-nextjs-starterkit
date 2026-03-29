#!/bin/bash
# Send Slack notification when git commit is made

# Load webhook URL from project .env.local
ENV_FILE="${CLAUDE_PROJECT_DIR:-.}/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep '^CLAUDE_SLACK_WEBHOOK_URL=' "$ENV_FILE" | xargs)
fi

if [ -z "$CLAUDE_SLACK_WEBHOOK_URL" ]; then
  exit 0
fi

INPUT=$(cat)

# Check if the command was a git commit
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
if ! echo "$COMMAND" | grep -q 'git commit'; then
  exit 0
fi

# Check if commit succeeded
RESPONSE=$(echo "$INPUT" | jq -r '.tool_response.stdout // ""')
if ! echo "$RESPONSE" | grep -q '^\['; then
  exit 0
fi

CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')
PROJECT=$(basename "$CWD")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')

# Extract commit info from git
COMMIT_HASH=$(git -C "$CWD" log -1 --format='%h' 2>/dev/null)
COMMIT_MSG=$(git -C "$CWD" log -1 --format='%s' 2>/dev/null)
CHANGED_FILES=$(git -C "$CWD" diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | head -5)
FILE_COUNT=$(git -C "$CWD" diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | wc -l | tr -d ' ')

# Build message
TEXT=$(printf ':git-commit: *커밋 생성*\n\n>프로젝트: %s\n>시간: %s\n>커밋: `%s` %s\n>변경 파일: %s개' \
  "$PROJECT" "$TIMESTAMP" "$COMMIT_HASH" "$COMMIT_MSG" "$FILE_COUNT")

if [ -n "$CHANGED_FILES" ]; then
  FILE_LIST=$(echo "$CHANGED_FILES" | sed 's/^/• /' | tr '\n' ',' | sed 's/,$//' | sed 's/,/, /g')
  TEXT=$(printf '%s\n>%s' "$TEXT" "$FILE_LIST")
fi

PAYLOAD=$(jq -n --arg text "$TEXT" '{text: $text}')

curl -s -X POST "$CLAUDE_SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" \
  > /dev/null 2>&1

exit 0
