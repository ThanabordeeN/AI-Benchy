#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/dist/ai-benchy" && ./ai-benchy-linux_x64 "$@"
