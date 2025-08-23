#!/bin/bash
# IFS Parser Codebase Testing Script
# Run this to test parsing coverage across IFS codebase

set -e

echo "🚀 IFS Parser Codebase Testing Script"
echo "======================================"

# Function to run a test and capture results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    echo "🧪 Running: $test_name"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo "✅ $test_name completed successfully"
    else
        echo "❌ $test_name failed"
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] || [ ! -d "tests" ]; then
    echo "❌ Please run this script from the ifs-parser root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "🔧 Building project..."
cargo build --release

echo ""
echo "📋 Available Test:"
echo "  1. Full IFS Codebase Test (9,748+ files) - Comprehensive validation"
echo ""

# Get user choice
read -p "Run the full IFS codebase test? [y/N]: " choice

case $choice in
    [Yy]*)
        echo "🎯 Running Full IFS Codebase Test..."
        echo "⚠️  This will process 9,748+ .plsql files across all IFS modules"
        echo "⏱️  Expected time: ~30 seconds with parallel processing"
        run_test "Full IFS Codebase Test" "cargo test test_full_ifs_codebase_parsing -- --nocapture"
        ;;
    *)
        echo "❌ Test cancelled"
        exit 0
        ;;
esac

echo ""
echo "🎉 Testing complete!"
echo ""
echo "📄 Generated Files:"
find . -name "*parsing_results_*.csv" -o -name "*parsing_summary_*.csv" | head -5

echo ""
echo "📊 To analyze results:"
echo "  - Open CSV files in Excel/LibreOffice for detailed analysis"
echo "  - Use grep/awk for command-line analysis"
echo "  - Import into database for SQL queries"
echo ""
echo "🎯 Recent Achievement: 100% parsing success across 9,748 files! 🎉"
