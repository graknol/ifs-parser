#!/bin/bash
# Build script for all tree-sitter grammars

set -e

echo "Building tree-sitter grammars..."

# Build PL/SQL grammar
cd grammars/ifs-cloud-parser
echo "Generating PL/SQL parser..."

# Install tree-sitter CLI if not present
if ! command -v tree-sitter &> /dev/null; then
    echo "Installing tree-sitter CLI..."
    npm install -g tree-sitter-cli@0.20.0
fi

# Generate the parser
tree-sitter generate

# Run tests if they exist
if [ -f "test/corpus/basic.txt" ]; then
    echo "Running PL/SQL grammar tests..."
    tree-sitter test
fi

cd ../..

echo "All grammars built successfully!"
