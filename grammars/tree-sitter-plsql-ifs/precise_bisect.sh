#!/bin/bash

# Precise bisection script for finding parse failures
# Usage: ./precise_bisect.sh <input_file>

INPUT_FILE="$1"
TEMP_FILE="temp_parse_test.plsql"
PARSER_DIR="/home/sindre/repos/Apply AS/Language Support/ifs-parser/grammars/tree-sitter-plsql-ifs"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Usage: $0 <input_file>"
    exit 1
fi

echo "🔍 Precise bisection of: $INPUT_FILE"

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
echo "📊 Total lines: $TOTAL_LINES"

# Binary search to find the failure zone
echo "🎯 Phase 1: Binary search for failure zone..."
LOW=1
HIGH=$TOTAL_LINES
LAST_GOOD=0

while [ $LOW -le $HIGH ]; do
    MID=$(( (LOW + HIGH) / 2 ))
    echo -n "Testing line $MID... "
    
    if test_parse $MID; then
        echo "✅ PASS"
        LAST_GOOD=$MID
        LOW=$(( MID + 1 ))
    else
        echo "❌ FAIL"
        HIGH=$(( MID - 1 ))
    fi
done

echo ""
echo "📍 Binary search result: Last good line = $LAST_GOOD"

# Now search forward from LAST_GOOD to find exact break point
echo ""
echo "🔍 Phase 2: Finding exact break point..."

# Check increments around the last good point
SEARCH_START=$LAST_GOOD
SEARCH_END=$(( LAST_GOOD + 100 ))
if [ $SEARCH_END -gt $TOTAL_LINES ]; then
    SEARCH_END=$TOTAL_LINES
fi

echo "Searching from line $SEARCH_START to $SEARCH_END..."

for LINE in $(seq $SEARCH_START $SEARCH_END); do
    echo -n "Testing line $LINE... "
    
    if test_parse $LINE; then
        echo "✅ PASS"
        LAST_GOOD=$LINE
    else
        echo "❌ FAIL - Found exact break point!"
        echo ""
        echo "🎯 RESULTS:"
        echo "✅ Last successful parse: line $LAST_GOOD" 
        echo "❌ First failure: line $LINE"
        echo ""
        echo "📝 Content around the break point:"
        echo "============================================"
        
        # Show context around the failure
        START_CONTEXT=$(( LINE - 5 ))
        END_CONTEXT=$(( LINE + 5 ))
        if [ $START_CONTEXT -lt 1 ]; then START_CONTEXT=1; fi
        if [ $END_CONTEXT -gt $TOTAL_LINES ]; then END_CONTEXT=$TOTAL_LINES; fi
        
        sed -n "${START_CONTEXT},${END_CONTEXT}p" "$INPUT_FILE" | nl -v $START_CONTEXT -s ": "
        echo "============================================"
        
        # Show the parsing error
        echo ""
        echo "🐛 Parser error details for line $LINE:"
        head -n "$LINE" "$INPUT_FILE" > "$TEMP_FILE"
        cd "$PARSER_DIR" || exit 1
        tree-sitter parse "$TEMP_FILE" 2>&1 | tail -10
        
        # Cleanup and exit
        rm -f "$TEMP_FILE"
        exit 0
    fi
done

echo ""
echo "🎉 Entire search range parsed successfully!"
echo "✅ Parsing works through line $LAST_GOOD"

# Cleanup
rm -f "$TEMP_FILE"
