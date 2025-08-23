#!/bin/bash

# Bisection script to find where parsing breaks in IFS PL/SQL files
# Usage: ./find_parse_break.sh <input_file>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <input_file>"
    echo "Example: $0 ../../analysis/packages/Project.plsql"
    exit 1
fi

INPUT_FILE="$1"
TEMP_FILE="temp_parse_test.plsql"
PARSER_DIR="/home/sindre/repos/Apply AS/Language Support/ifs-parser/grammars/tree-sitter-plsql-ifs"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found"
    exit 1
fi

echo "🔍 Bisecting parsing errors in: $INPUT_FILE"
echo "Parser directory: $PARSER_DIR"
echo ""

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
echo "📊 Total lines in file: $TOTAL_LINES"

# Start with binary search to find approximate break point
LOW=1
HIGH=$TOTAL_LINES
LAST_GOOD=0

echo "🎯 Phase 1: Binary search for approximate break point..."

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
echo "📍 Binary search complete. Last good line: $LAST_GOOD"

# Now do incremental search from last good point
echo ""
echo "🔍 Phase 2: Incremental search from line $LAST_GOOD..."

# Function to find next logical boundary (END statement, semicolon, or procedure/function)
find_next_boundary() {
    local start_line=$1
    local search_line=$start_line
    
    while [ $search_line -le $TOTAL_LINES ]; do
        # Check if this line contains END <something>;, PROCEDURE, FUNCTION, or ends with ;
        if sed -n "${search_line}p" "$INPUT_FILE" | grep -E "(^END [^;]*;|^PROCEDURE |^FUNCTION |;$)" >/dev/null 2>&1; then
            echo $search_line
            return
        fi
        search_line=$(( search_line + 1 ))
        
        # Safety check to avoid infinite loops
        if [ $search_line -gt $(( start_line + 100 )) ]; then
            echo $(( start_line + 10 ))  # Fallback
            return
        fi
    done
    
    echo $TOTAL_LINES
}

CURRENT=$LAST_GOOD
while [ $CURRENT -le $TOTAL_LINES ]; do
    # Find next logical boundary
    NEXT_BOUNDARY=$(find_next_boundary $(( CURRENT + 1 )))
    
    echo -n "Testing through line $NEXT_BOUNDARY... "
    
    if test_parse $NEXT_BOUNDARY; then
        echo "✅ PASS"
        LAST_GOOD=$NEXT_BOUNDARY
        CURRENT=$NEXT_BOUNDARY
    else
        echo "❌ FAIL - Found break point!"
        CURRENT=$(( TOTAL_LINES + 1 ))  # Break out of loop
        
        # Now do line-by-line search between LAST_GOOD and NEXT_BOUNDARY
        echo "🔍 Phase 3: Fine-grained search between lines $LAST_GOOD and $NEXT_BOUNDARY..."
        
        LINE_SEARCH=$(( LAST_GOOD + 1 ))
        while [ $LINE_SEARCH -le $NEXT_BOUNDARY ]; do
            echo -n "Testing line $LINE_SEARCH... "
            
            if test_parse $LINE_SEARCH; then
                echo "✅ PASS"
                LAST_GOOD=$LINE_SEARCH
            else
                echo "❌ FAIL - Found exact break point!"
                CURRENT=$LINE_SEARCH
                break
            fi
            
            LINE_SEARCH=$(( LINE_SEARCH + 1 ))
        done
    fi
done

echo ""
echo "🎯 RESULTS:"
echo "✅ Last successful parse: line $LAST_GOOD"
if [ $CURRENT -le $TOTAL_LINES ]; then
    echo "❌ First failure: line $CURRENT"
    echo ""
    echo "📝 Problematic content around line $CURRENT:"
    echo "----------------------------------------"
    START_LINE=$(( CURRENT - 3 ))
    if [ $START_LINE -lt 1 ]; then
        START_LINE=1
    fi
    END_LINE=$(( CURRENT + 3 ))
    
    sed -n "${START_LINE},${END_LINE}p" "$INPUT_FILE" | nl -v $START_LINE
    echo "----------------------------------------"
    
    # Show exact error by parsing with error output
    echo ""
    echo "🐛 Parser error details:"
    head -n "$CURRENT" "$INPUT_FILE" > "$TEMP_FILE"
    cd "$PARSER_DIR" || exit 1
    tree-sitter parse "$TEMP_FILE" --quiet 2>&1 || true
    
else
    echo "🎉 Entire file parsed successfully!"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo ""
echo "✨ Bisection complete!"
