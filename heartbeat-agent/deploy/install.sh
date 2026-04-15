#!/usr/bin/env bash
# Nexus Heartbeat Agent installer
# Run on each agent machine: bash install.sh <NEXUS_URL> <AGENT_ID>
# Example: bash install.sh http://192.168.50.112:3001 agent-elena

set -e

NEXUS_URL="${1:?Usage: bash install.sh <NEXUS_URL> <AGENT_ID>}"
AGENT_ID="${2:?Usage: bash install.sh <NEXUS_URL> <AGENT_ID>}"

INSTALL_DIR="$HOME/nexus-heartbeat"

echo "Installing Nexus Heartbeat Agent..."
echo "  → Nexus URL:  $NEXUS_URL"
echo "  → Agent ID:   $AGENT_ID"
echo "  → Install dir: $INSTALL_DIR"

# Clone or update
if [ -d "$INSTALL_DIR/.git" ]; then
  cd "$INSTALL_DIR"
  git pull
else
  git clone https://github.com/quorbz/quorbz-nexus.git /tmp/quorbz-nexus-src
  cp -r /tmp/quorbz-nexus-src/heartbeat-agent "$INSTALL_DIR"
  rm -rf /tmp/quorbz-nexus-src
  cd "$INSTALL_DIR"
fi

# Write .env
cat > .env <<EOF
NEXUS_URL=$NEXUS_URL
NEXUS_AGENT_ID=$AGENT_ID
HEARTBEAT_INTERVAL_SECS=300
EOF

# Install deps and build
npm install
npm run build

echo ""
echo "Build complete. Now install the service:"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  NODE_PATH=$(which node)
  sed "s|{{NODE_PATH}}|$NODE_PATH|g; s|{{HOME}}|$HOME|g" \
    deploy/com.quorbz.nexus-heartbeat.plist \
    > "$HOME/Library/LaunchAgents/com.quorbz.nexus-heartbeat.plist"
  launchctl load "$HOME/Library/LaunchAgents/com.quorbz.nexus-heartbeat.plist"
  echo "✓ Loaded launchd plist — heartbeat agent is running"
else
  mkdir -p "$HOME/.config/systemd/user"
  cp deploy/heartbeat.service "$HOME/.config/systemd/user/nexus-heartbeat.service"
  systemctl --user daemon-reload
  systemctl --user enable nexus-heartbeat
  systemctl --user start nexus-heartbeat
  echo "✓ systemd service enabled and started"
fi

echo "Done. Check with: tail -f $INSTALL_DIR/heartbeat.log"
