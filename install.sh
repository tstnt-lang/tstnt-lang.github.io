#!/bin/sh
set -e

REPO="tstnt-lang/tstnt"
VERSION="v1.1.0"
BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
MUTED='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo "${CYAN}  _____  ___  _____  _  _ _____ ${RESET}"
echo "${CYAN} |_   _|/ __||_   _|| \\| |_   _|${RESET}"
echo "${CYAN}   | |  \\__ \\  | |  | .\` | | |  ${RESET}"
echo "${CYAN}   |_|  |___/  |_|  |_|\\_| |_|  ${RESET}"
echo ""
echo "${BOLD}TSTNT Installer${RESET} ${MUTED}${VERSION}${RESET}"
echo ""

detect_platform() {
    OS=$(uname -s)
    ARCH=$(uname -m)

    if [ -d "/data/data/com.termux" ]; then
        echo "android-aarch64"
        return
    fi

    case "${OS}" in
        Linux)
            case "${ARCH}" in
                x86_64)  echo "linux-x86_64" ;;
                aarch64) echo "linux-aarch64" ;;
                *)       echo "unsupported" ;;
            esac
            ;;
        Darwin)
            case "${ARCH}" in
                x86_64)  echo "macos-x86_64" ;;
                arm64)   echo "macos-aarch64" ;;
                *)       echo "unsupported" ;;
            esac
            ;;
        MINGW*|MSYS*|CYGWIN*)
            echo "windows-x86_64"
            ;;
        *)
            echo "unsupported"
            ;;
    esac
}

PLATFORM=$(detect_platform)

if [ "${PLATFORM}" = "unsupported" ]; then
    echo "${RED}error${RESET}: unsupported platform"
    echo "Build from source: https://github.com/${REPO}"
    exit 1
fi

echo "${MUTED}platform: ${PLATFORM}${RESET}"

if echo "${PLATFORM}" | grep -q "windows"; then
    BINARY_NAME="tstnt-${PLATFORM}.exe"
else
    BINARY_NAME="tstnt-${PLATFORM}"
fi

DOWNLOAD_URL="${BASE_URL}/${BINARY_NAME}"

detect_install_dir() {
    if [ -d "/data/data/com.termux" ]; then
        echo "$HOME/bin"
    elif echo "${PLATFORM}" | grep -q "windows"; then
        echo "$HOME/bin"
    elif [ -w "/usr/local/bin" ]; then
        echo "/usr/local/bin"
    else
        echo "$HOME/.local/bin"
    fi
}

INSTALL_DIR=$(detect_install_dir)
mkdir -p "${INSTALL_DIR}"

echo "${MUTED}downloading tstnt ${VERSION}...${RESET}"

if echo "${PLATFORM}" | grep -q "windows"; then
    OUTFILE="${INSTALL_DIR}/tstnt.exe"
else
    OUTFILE="${INSTALL_DIR}/tstnt"
fi

if command -v curl > /dev/null 2>&1; then
    curl -fsSL --progress-bar "${DOWNLOAD_URL}" -o "${OUTFILE}"
elif command -v wget > /dev/null 2>&1; then
    wget -q --show-progress "${DOWNLOAD_URL}" -O "${OUTFILE}"
else
    echo "${RED}error${RESET}: curl or wget required"
    exit 1
fi

chmod +x "${OUTFILE}"

echo "${GREEN}✓${RESET} installed to ${OUTFILE}"

if ! echo "$PATH" | grep -q "${INSTALL_DIR}"; then
    SHELL_RC=""
    if [ -f "$HOME/.bashrc" ]; then SHELL_RC="$HOME/.bashrc"
    elif [ -f "$HOME/.zshrc" ]; then SHELL_RC="$HOME/.zshrc"
    elif [ -f "$HOME/.profile" ]; then SHELL_RC="$HOME/.profile"
    fi

    if [ -n "${SHELL_RC}" ]; then
        echo "export PATH=\"\$PATH:${INSTALL_DIR}\"" >> "${SHELL_RC}"
        echo "${GREEN}✓${RESET} added to PATH in ${SHELL_RC}"
        echo "${MUTED}run: source ${SHELL_RC}${RESET}"
    else
        echo "${MUTED}add to PATH: export PATH=\"\$PATH:${INSTALL_DIR}\"${RESET}"
    fi
fi

echo ""
echo "${GREEN}${BOLD}TSTNT installed!${RESET}"
echo ""
echo "  ${CYAN}tstnt --version${RESET}          check version"
echo "  ${CYAN}tstnt repl${RESET}               interactive shell"
echo "  ${CYAN}tstnt new myproject${RESET}      scaffold project"
echo "  ${CYAN}tstnt pkg search${RESET}         browse 140+ packages"
echo ""
echo "${MUTED}docs: https://tstnt-lang.github.io/docs.html${RESET}"
echo ""
