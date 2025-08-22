#!/bin/bash

# Debug parser script - shows context around parsing errors
# Usage: ./debug_parser.sh <file_to_parse> [context_lines]

if [ $# -lt 1 ]; then
    echo "Usage: $0 <file_to_parse> [context_lines]"
    echo "Example: $0 test_first_1000.plsql 15"
    exit 1
fi

FILE="$1"
CONTEXT_LINES="${2:-15}"  # Default to 15 lines of context

if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found"
    exit 1
fi

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

echo -e "${BOLD}🔍 Parsing file: ${CYAN}$FILE${RESET}"
echo -e "${BOLD}📝 Showing ${YELLOW}$CONTEXT_LINES${RESET}${BOLD} lines of context around errors${RESET}"
echo "==========================================="

# Parse the file and capture output
PARSE_OUTPUT=$(timeout 30s tree-sitter parse "$FILE" 2>&1)
PARSE_EXIT_CODE=$?

if [ $PARSE_EXIT_CODE -eq 124 ]; then
    echo -e "${RED}⏰ Parsing timed out after 30 seconds${RESET}"
    exit 1
elif [ $PARSE_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Parser failed with exit code: $PARSE_EXIT_CODE${RESET}"
fi

# Function to highlight specific columns in a line
highlight_columns() {
    local line="$1"
    local start_col="$2"
    local end_col="$3"
    local line_length=${#line}
    
    # Handle edge cases
    if [ $start_col -lt 0 ]; then start_col=0; fi
    if [ $end_col -gt $line_length ]; then end_col=$line_length; fi
    if [ $start_col -gt $line_length ]; then start_col=$line_length; fi
    
    # Extract parts of the line
    local before="${line:0:$start_col}"
    local error_part="${line:$start_col:$((end_col - start_col))}"
    local after="${line:$end_col}"
    
    # Print with highlighting
    printf "%s${RED}${BOLD}%s${RESET}%s" "$before" "$error_part" "$after"
}

# Extract error information and show context
echo "$PARSE_OUTPUT" | grep -E "ERROR \[[0-9]+, [0-9]+\] - \[[0-9]+, [0-9]+\]" | head -10 | while read -r error_line; do
    # Extract line numbers from error format: ERROR [start_line, start_col] - [end_line, end_col]
    if [[ $error_line =~ ERROR\ \[([0-9]+),\ ([0-9]+)\]\ -\ \[([0-9]+),\ ([0-9]+)\] ]]; then
        START_LINE=${BASH_REMATCH[1]}
        START_COL=${BASH_REMATCH[2]}
        END_LINE=${BASH_REMATCH[3]}
        END_COL=${BASH_REMATCH[4]}
        
        # Convert to 1-based line numbers for display (tree-sitter uses 0-based)
        DISPLAY_START=$((START_LINE + 1))
        DISPLAY_END=$((END_LINE + 1))
        
        echo ""
        echo -e "${RED}${BOLD}🚨 ERROR at lines $DISPLAY_START-$DISPLAY_END (columns $START_COL-$END_COL):${RESET}"
        echo -e "${DIM}   $error_line${RESET}"
        echo ""
        
        # Calculate context range
        CONTEXT_START=$((DISPLAY_START - CONTEXT_LINES))
        CONTEXT_END=$((DISPLAY_END + CONTEXT_LINES))
        
        # Ensure we don't go below line 1
        if [ $CONTEXT_START -lt 1 ]; then
            CONTEXT_START=1
        fi
        
        # Show context with line numbers and highlighting
        echo -e "${BLUE}📋 Context (lines $CONTEXT_START-$CONTEXT_END):${RESET}"
        sed -n "${CONTEXT_START},${CONTEXT_END}p" "$FILE" | nl -ba -v$CONTEXT_START | while IFS=$'\t' read -r line_num content; do
            if [ $line_num -ge $DISPLAY_START ] && [ $line_num -le $DISPLAY_END ]; then
                # This is an error line - highlight it and the specific columns
                if [ $line_num -eq $DISPLAY_START ] && [ $line_num -eq $DISPLAY_END ]; then
                    # Single line error - highlight specific columns
                    printf "${RED}→ ${BOLD}%4d:${RESET} " "$line_num"
                    highlight_columns "$content" "$START_COL" "$END_COL"
                    echo ""
                elif [ $line_num -eq $DISPLAY_START ]; then
                    # Start of multi-line error - highlight from start column to end
                    printf "${RED}→ ${BOLD}%4d:${RESET} " "$line_num"
                    highlight_columns "$content" "$START_COL" "${#content}"
                    echo ""
                elif [ $line_num -eq $DISPLAY_END ]; then
                    # End of multi-line error - highlight from start to end column
                    printf "${RED}→ ${BOLD}%4d:${RESET} " "$line_num"
                    highlight_columns "$content" "0" "$END_COL"
                    echo ""
                else
                    # Middle of multi-line error - highlight entire line
                    printf "${RED}→ ${BOLD}%4d:${RESET} ${RED}${BOLD}%s${RESET}\n" "$line_num" "$content"
                fi
            else
                # Context line - show normally
                printf "${DIM}  %4d:${RESET} %s\n" "$line_num" "$content"
            fi
        done
        echo -e "${DIM}----------------------------------------${RESET}"
    fi
done

# Show summary statistics
ERROR_COUNT=$(echo "$PARSE_OUTPUT" | grep -c "ERROR \[" || echo "0")
TOTAL_LINES=$(wc -l < "$FILE")

echo ""
echo -e "${BOLD}📊 Summary:${RESET}"
echo -e "   Total lines in file: ${CYAN}$TOTAL_LINES${RESET}"
echo -e "   Total errors found: ${YELLOW}$ERROR_COUNT${RESET}"

if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ No parsing errors found!${RESET}"
else
    echo -e "${RED}❌ Found $ERROR_COUNT parsing errors (showing first 10 above)${RESET}"
    
    # Show percentage of successful parsing
    if [ $ERROR_COUNT -lt $TOTAL_LINES ]; then
        SUCCESS_RATE=$(( (TOTAL_LINES - ERROR_COUNT) * 100 / TOTAL_LINES ))
        echo -e "   Approximate success rate: ${GREEN}${SUCCESS_RATE}%${RESET}"
    fi
fi
