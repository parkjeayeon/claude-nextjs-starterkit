#!/bin/bash
# Send Slack notification for Claude Code hook events

# Load webhook URL from project .env.local
ENV_FILE="${CLAUDE_PROJECT_DIR:-.}/.env.local"
if [ -f "$ENV_FILE" ]; then
  export $(grep '^CLAUDE_SLACK_WEBHOOK_URL=' "$ENV_FILE" | xargs)
fi

if [ -z "$CLAUDE_SLACK_WEBHOOK_URL" ]; then
  exit 0
fi

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"')
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"')
PROJECT=$(basename "$CWD")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# Extract last assistant message as work summary
SUMMARY=""
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  SUMMARY=$(grep '"type":"assistant"' "$TRANSCRIPT" \
    | tail -1 \
    | jq -r '[.message.content[] | select(.type=="text") | .text] | join(" ")' 2>/dev/null \
    | head -c 200)
fi

case "$EVENT" in
  Notification)
    EMOJI=":rotating_light:"
    TITLE="*권한 요청*"
    DESC="Claude가 권한 승인을 기다리고 있습니다."
    ;;
  Stop)
    # Skip if the last tool use was a git commit (already notified by notify-commit.sh)
    if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
      LAST_BASH=$(grep '"tool_name":"Bash"' "$TRANSCRIPT" | tail -1)
      if echo "$LAST_BASH" | grep -q 'git commit'; then
        exit 0
      fi
    fi
    EMOJI=":white_check_mark:"
    TITLE="*작업 완료*"
    DESC="결과를 확인해주세요."
    ;;
  *)
    exit 0
    ;;
esac

# Build message with consistent format
TEXT=$(printf '%s %s\n\n>프로젝트: %s\n>시간: %s' "$EMOJI" "$TITLE" "$PROJECT" "$TIMESTAMP")
if [ -n "$SUMMARY" ]; then
  TEXT=$(printf '%s\n>요약: %s' "$TEXT" "$SUMMARY")
fi
TEXT=$(printf '%s\n%s' "$TEXT" "$DESC")

# Use jq to safely encode the message as JSON
PAYLOAD=$(jq -n --arg text "$TEXT" '{text: $text}')

curl -s -X POST "$CLAUDE_SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" \
  > /dev/null 2>&1

exit 0
