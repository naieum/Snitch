#!/usr/bin/env bash
set -euo pipefail

# Snitch Skill Installer
# Downloads and installs the Snitch security audit skill

VERSION="6.0.0"
API_BASE="https://snitch.live"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

usage() {
  cat <<'USAGE'
Snitch Skill Installer

Usage:
  install.sh [options]

Options:
  --tool=<name>      Install non-interactively. Valid names:
                       claude, gemini, codex, copilot-cli,
                       cursor, windsurf, cline, kilo, roo, zed,
                       copilot-vscode, aider, continue, custom
  --project=<path>   Project root for project-local tools (default: $PWD)
  --dir=<path>       Target directory (required for --tool=custom)
  --help             Show this help message

Environment:
  SNITCH_API_KEY     API key for downloading the skill.
                     If not set, the installer will prompt for it.

Examples:
  # Interactive
  ./install.sh

  # Non-interactive: Claude Code
  ./install.sh --tool=claude

  # Non-interactive: Cursor in a specific project
  ./install.sh --tool=cursor --project=~/myproject

  # Non-interactive: Custom directory
  ./install.sh --tool=custom --dir=/path/to/dir
USAGE
  exit 0
}

banner() {
  echo "┌─────────────────────────────────┐"
  echo "│  Snitch Skill Installer v$VERSION  │"
  echo "└─────────────────────────────────┘"
  echo ""
}

ask_project_root() {
  local default="${1:-$PWD}"
  read -rp "Enter project root [$default]: " PROJECT_ROOT
  PROJECT_ROOT="${PROJECT_ROOT:-$default}"
  # Expand ~ if present
  PROJECT_ROOT="${PROJECT_ROOT/#\~/$HOME}"
  if [ ! -d "$PROJECT_ROOT" ]; then
    echo "Error: Directory does not exist: $PROJECT_ROOT"
    exit 1
  fi
}

# Copy SKILL.md + categories/ into a target directory
install_skill_files() {
  local dest="$1"
  mkdir -p "$dest"
  cp "$TMP_DIR/snitch/SKILL.md" "$dest/SKILL.md"
  if [ -d "$TMP_DIR/snitch/categories" ]; then
    cp -R "$TMP_DIR/snitch/categories" "$dest/categories"
  fi
}

# Print success message
success_msg() {
  local dest="$1"
  echo ""
  echo "Snitch skill installed to: $dest"
  echo ""
  echo "To run an audit, use: /snitch"
  echo ""
}

# ---------------------------------------------------------------------------
# Parse CLI arguments
# ---------------------------------------------------------------------------

ARG_TOOL=""
ARG_PROJECT=""
ARG_DIR=""

for arg in "$@"; do
  case "$arg" in
    --help) usage ;;
    --tool=*) ARG_TOOL="${arg#--tool=}" ;;
    --project=*) ARG_PROJECT="${arg#--project=}" ;;
    --dir=*) ARG_DIR="${arg#--dir=}" ;;
    *) echo "Unknown option: $arg"; echo "Run with --help for usage."; exit 1 ;;
  esac
done

# Expand ~ in arguments
ARG_PROJECT="${ARG_PROJECT/#\~/$HOME}"
ARG_DIR="${ARG_DIR/#\~/$HOME}"

banner

# ---------------------------------------------------------------------------
# API key
# ---------------------------------------------------------------------------

if [ -z "${SNITCH_API_KEY:-}" ]; then
  read -rp "Enter your Snitch API key (from snitch.live/dashboard/keys): " SNITCH_API_KEY
  if [ -z "$SNITCH_API_KEY" ]; then
    echo "Error: API key is required. Get one at https://snitch.live/dashboard/keys"
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Determine tool choice
# ---------------------------------------------------------------------------

TOOL_CHOICE=""

if [ -n "$ARG_TOOL" ]; then
  case "$ARG_TOOL" in
    claude)          TOOL_CHOICE="1" ;;
    gemini)          TOOL_CHOICE="2" ;;
    codex)           TOOL_CHOICE="3" ;;
    copilot-cli)     TOOL_CHOICE="4" ;;
    cursor)          TOOL_CHOICE="5" ;;
    windsurf)        TOOL_CHOICE="6" ;;
    cline)           TOOL_CHOICE="7" ;;
    kilo)            TOOL_CHOICE="8" ;;
    roo)             TOOL_CHOICE="9" ;;
    zed)             TOOL_CHOICE="10" ;;
    copilot-vscode)  TOOL_CHOICE="11" ;;
    aider)           TOOL_CHOICE="12" ;;
    continue)        TOOL_CHOICE="13" ;;
    custom)          TOOL_CHOICE="14" ;;
    *)
      echo "Error: Unknown tool name '$ARG_TOOL'."
      echo "Valid names: claude, gemini, codex, copilot-cli, cursor, windsurf,"
      echo "  cline, kilo, roo, zed, copilot-vscode, aider, continue, custom"
      exit 1
      ;;
  esac
else
  # Interactive menu
  echo "Where would you like to install the Snitch skill?"
  echo ""
  echo "  AI Coding CLIs"
  echo "    1) Claude Code"
  echo "    2) Gemini CLI"
  echo "    3) Codex CLI"
  echo "    4) Copilot CLI"
  echo ""
  echo "  IDE Extensions (project-local)"
  echo "    5) Cursor"
  echo "    6) Windsurf"
  echo "    7) Cline"
  echo "    8) Kilo Code"
  echo "    9) Roo Code"
  echo "   10) Zed"
  echo "   11) GitHub Copilot (VS Code)"
  echo ""
  echo "  Config-based"
  echo "   12) Aider"
  echo "   13) Continue.dev"
  echo "   14) Custom directory"
  echo ""
  read -rp "Choice [1]: " TOOL_CHOICE
  TOOL_CHOICE="${TOOL_CHOICE:-1}"
fi

# ---------------------------------------------------------------------------
# Resolve target paths
# ---------------------------------------------------------------------------

# PROJECT_ROOT is used by options 5-13
PROJECT_ROOT="${ARG_PROJECT:-$PWD}"
TARGET_DIR=""
INSTALL_MODE="standard"  # standard | copilot-vscode | aider | continue

case "$TOOL_CHOICE" in
  # -- CLIs (global) --------------------------------------------------------
  1) TARGET_DIR="$HOME/.claude/plugins/snitch" ;;
  2) TARGET_DIR="$HOME/.gemini/extensions/snitch" ;;
  3) TARGET_DIR="$HOME/.codex/plugins/snitch" ;;
  4) TARGET_DIR="$HOME/.copilot/plugins/snitch" ;;

  # -- IDE extensions (project-local) ---------------------------------------
  5|6|7|8|9|10)
    if [ -z "$ARG_TOOL" ]; then
      ask_project_root "$PWD"
    else
      if [ -n "$ARG_PROJECT" ]; then
        PROJECT_ROOT="$ARG_PROJECT"
      fi
      if [ ! -d "$PROJECT_ROOT" ]; then
        echo "Error: Project directory does not exist: $PROJECT_ROOT"
        exit 1
      fi
    fi
    case "$TOOL_CHOICE" in
      5)  TARGET_DIR="$PROJECT_ROOT/.cursor/rules/snitch" ;;
      6)  TARGET_DIR="$PROJECT_ROOT/.windsurf/rules/snitch" ;;
      7)  TARGET_DIR="$PROJECT_ROOT/.clinerules/snitch" ;;
      8)  TARGET_DIR="$PROJECT_ROOT/.kilocode/rules/snitch" ;;
      9)  TARGET_DIR="$PROJECT_ROOT/.roo/rules/snitch" ;;
      10) TARGET_DIR="$PROJECT_ROOT/.rules/snitch" ;;
    esac
    ;;

  # -- GitHub Copilot VS Code -----------------------------------------------
  11)
    INSTALL_MODE="copilot-vscode"
    if [ -z "$ARG_TOOL" ]; then
      ask_project_root "$PWD"
    else
      if [ -n "$ARG_PROJECT" ]; then
        PROJECT_ROOT="$ARG_PROJECT"
      fi
      if [ ! -d "$PROJECT_ROOT" ]; then
        echo "Error: Project directory does not exist: $PROJECT_ROOT"
        exit 1
      fi
    fi
    TARGET_DIR="$PROJECT_ROOT/.github"
    ;;

  # -- Aider ----------------------------------------------------------------
  12)
    INSTALL_MODE="aider"
    if [ -z "$ARG_TOOL" ]; then
      ask_project_root "$PWD"
    else
      if [ -n "$ARG_PROJECT" ]; then
        PROJECT_ROOT="$ARG_PROJECT"
      fi
      if [ ! -d "$PROJECT_ROOT" ]; then
        echo "Error: Project directory does not exist: $PROJECT_ROOT"
        exit 1
      fi
    fi
    TARGET_DIR="$PROJECT_ROOT/.snitch"
    ;;

  # -- Continue.dev ---------------------------------------------------------
  13)
    INSTALL_MODE="continue"
    if [ -z "$ARG_TOOL" ]; then
      ask_project_root "$PWD"
    else
      if [ -n "$ARG_PROJECT" ]; then
        PROJECT_ROOT="$ARG_PROJECT"
      fi
      if [ ! -d "$PROJECT_ROOT" ]; then
        echo "Error: Project directory does not exist: $PROJECT_ROOT"
        exit 1
      fi
    fi
    TARGET_DIR="$PROJECT_ROOT/.snitch"
    ;;

  # -- Custom ---------------------------------------------------------------
  14)
    if [ -z "$ARG_TOOL" ]; then
      read -rp "Enter directory path: " TARGET_DIR
      TARGET_DIR="${TARGET_DIR/#\~/$HOME}"
    else
      if [ -z "$ARG_DIR" ]; then
        echo "Error: --dir=<path> is required when using --tool=custom"
        exit 1
      fi
      TARGET_DIR="$ARG_DIR"
    fi
    ;;

  *)
    echo "Invalid choice: $TOOL_CHOICE"
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

echo "Downloading Snitch skill..."

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TMP_DIR/snitch.zip" \
  -H "Authorization: Bearer $SNITCH_API_KEY" \
  "$API_BASE/api/skill/download")

if [ "$HTTP_CODE" = "403" ]; then
  echo "Error: Skill not purchased. Buy it at https://snitch.live/plugin"
  exit 1
elif [ "$HTTP_CODE" != "200" ]; then
  echo "Error: Download failed (HTTP $HTTP_CODE)"
  cat "$TMP_DIR/snitch.zip" 2>/dev/null
  exit 1
fi

# Unzip to temp staging area
unzip -qo "$TMP_DIR/snitch.zip" -d "$TMP_DIR/snitch"

# ---------------------------------------------------------------------------
# Install based on mode
# ---------------------------------------------------------------------------

case "$INSTALL_MODE" in

  # -- Standard: copy SKILL.md + categories/ into TARGET_DIR ----------------
  standard)
    echo "Installing to $TARGET_DIR..."
    install_skill_files "$TARGET_DIR"
    success_msg "$TARGET_DIR"
    ;;

  # -- GitHub Copilot (VS Code): special file layout ------------------------
  copilot-vscode)
    echo "Installing GitHub Copilot (VS Code) integration to $PROJECT_ROOT..."

    # Copy copilot-entry.md as copilot-instructions.md
    mkdir -p "$TARGET_DIR"
    if [ -f "$TMP_DIR/snitch/copilot-entry.md" ]; then
      cp "$TMP_DIR/snitch/copilot-entry.md" "$TARGET_DIR/copilot-instructions.md"
    else
      echo "Warning: copilot-entry.md not found in download; skipping copilot-instructions.md"
    fi

    # Copy categories as .instructions.md files
    INSTR_DIR="$TARGET_DIR/instructions/snitch"
    mkdir -p "$INSTR_DIR"
    if [ -d "$TMP_DIR/snitch/categories" ]; then
      for f in "$TMP_DIR/snitch/categories"/*.md; do
        [ -f "$f" ] || continue
        base=$(basename "$f" .md)
        cp "$f" "$INSTR_DIR/${base}.instructions.md"
      done
    fi

    echo ""
    echo "Snitch installed for GitHub Copilot (VS Code):"
    echo "  $TARGET_DIR/copilot-instructions.md"
    echo "  $INSTR_DIR/*.instructions.md"
    echo ""
    echo "Copilot will automatically pick up these instruction files."
    echo ""
    ;;

  # -- Aider: skill files + .aider.conf.yml --------------------------------
  aider)
    echo "Installing to $TARGET_DIR..."
    install_skill_files "$TARGET_DIR"

    AIDER_CONF="$PROJECT_ROOT/.aider.conf.yml"
    AIDER_READ_LINE="  - .snitch/SKILL.md"

    if [ -f "$AIDER_CONF" ]; then
      # Check if read key and the line already exist
      if grep -qF "$AIDER_READ_LINE" "$AIDER_CONF" 2>/dev/null; then
        echo "Aider config already references .snitch/SKILL.md — skipping config update."
      else
        # Append read entry
        if grep -q "^read:" "$AIDER_CONF" 2>/dev/null; then
          # read: section exists — append under it
          echo "$AIDER_READ_LINE" >> "$AIDER_CONF"
          echo "Appended .snitch/SKILL.md to existing read: section in $AIDER_CONF"
        else
          # No read: section — add one
          printf '\nread:\n%s\n' "$AIDER_READ_LINE" >> "$AIDER_CONF"
          echo "Added read: section to $AIDER_CONF"
        fi
      fi
    else
      cat > "$AIDER_CONF" <<'AIDEREOF'
read:
  - .snitch/SKILL.md
AIDEREOF
      echo "Created $AIDER_CONF"
    fi

    success_msg "$TARGET_DIR"
    ;;

  # -- Continue.dev: skill files + .continuerc.json -------------------------
  continue)
    echo "Installing to $TARGET_DIR..."
    install_skill_files "$TARGET_DIR"

    CONTINUE_CONF="$PROJECT_ROOT/.continuerc.json"

    if [ -f "$CONTINUE_CONF" ]; then
      echo "Warning: $CONTINUE_CONF already exists — skipping config generation."
      echo "Add the following manually if needed:"
      echo '  "customInstructions": "Follow the security audit instructions in .snitch/SKILL.md. Load category files from .snitch/categories/ as needed."'
    else
      cat > "$CONTINUE_CONF" <<'CONTEOF'
{
  "customInstructions": "Follow the security audit instructions in .snitch/SKILL.md. Load category files from .snitch/categories/ as needed."
}
CONTEOF
      echo "Created $CONTINUE_CONF"
    fi

    success_msg "$TARGET_DIR"
    ;;
esac
