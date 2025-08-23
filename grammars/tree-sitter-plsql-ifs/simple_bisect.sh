#!/bin/bash

# Simple bisection script to find where parsing breaks
# Usage: ./simple_bisect.sh <input_file>

INPUT_FILE="$1"
TEMP_FILE="temp_parse_test.plsql"
PARSER_DIR="/home/sindre/repos/Apply AS/Language Support/ifs-parser/grammars/tree-sitter-plsql-ifs"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Usage: $0 <input_file>"
    exit 1
fi

echo "🔍 Finding parse break point in: $INPUT_FILE"

# Function to test parsing
test_parse() {
    local line_count=$1
    head -n "$line_count" "$INPUT_FILE" > "$TEMP_FILE"
    
    cd "$PARSER_DIR" || exit 1
    if tree-sitter parse "$TEMP_FILE" --quiet >/dev/null 2>&1; then
        return 0  # Success
    else
        return 1  # Failure
    fi
}

# Get total lines
TOTAL_LINES=$(wc -l < "$INPUT_FILE")

# Test some key points to understand the file
echo "📊 Testing key points..."
for lines in 50 100 200 500 1000 2000; do
    if [ $lines -le $TOTAL_LINES ]; then
        echo -n "Line $lines: "
        if test_parse $lines; then
            echo "✅ PASS"
            LAST_GOOD=$lines
        else
            echo "❌ FAIL"
            break
        fi
    fi
done

echo ""
echo "🎯 Last successful parse around line: $LAST_GOOD"

# Cleanup
rm -f "$TEMP_FILE"
