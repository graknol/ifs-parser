#!/bin/bash
# Alternative build script that downloads tree-sitter CLI directly

set -e

echo "Setting up tree-sitter build environment..."

# Create a local tools directory
mkdir -p tools
cd tools

# Download tree-sitter CLI if not present
if [ ! -f "tree-sitter" ]; then
    echo "Downloading tree-sitter CLI..."
    
    # Detect OS and architecture
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case $ARCH in
        x86_64) ARCH="x64" ;;
        aarch64|arm64) ARCH="arm64" ;;
    esac
    
    # Download the appropriate binary
    DOWNLOAD_URL="https://github.com/tree-sitter/tree-sitter/releases/latest/download/tree-sitter-${OS}-${ARCH}.gz"
    
    echo "Downloading from: $DOWNLOAD_URL"
    curl -L "$DOWNLOAD_URL" | gunzip > tree-sitter
    chmod +x tree-sitter
fi

cd ..

# Add tools to PATH for this session
export PATH="$PWD/tools:$PATH"

echo "Building tree-sitter grammars..."

# Build PL/SQL grammar
cd grammars/ifs-cloud-parser
echo "Generating PL/SQL parser..."

# Generate the parser
../../tools/tree-sitter generate

echo "PL/SQL grammar built successfully!"
cd ../..
