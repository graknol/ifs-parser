#!/bin/bash
# Build script for creating Windows x64 executable

echo "🚀 Building IFS Parser for Windows x64..."

# Ensure Windows target is installed
echo "📦 Adding Windows x64 target..."
rustup target add x86_64-pc-windows-gnu

# Build the release executable
echo "⚡ Building release executable..."
cargo build --release --target x86_64-pc-windows-gnu

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Executable location: target/x86_64-pc-windows-gnu/release/ifs-parser.exe"
    echo "📊 File size: $(ls -lh target/x86_64-pc-windows-gnu/release/ifs-parser.exe | awk '{print $5}')"
    
    # Copy to a convenient location
    cp target/x86_64-pc-windows-gnu/release/ifs-parser.exe ./ifs-parser-windows-x64.exe
    echo "📋 Copied to: ifs-parser-windows-x64.exe"
    
    echo ""
    echo "🎉 Windows executable ready!"
    echo "Usage examples:"
    echo "  ifs-parser.exe --help"
    echo "  ifs-parser.exe -f myfile.plsql"
    echo "  ifs-parser.exe -d /path/to/plsql/files"
else
    echo "❌ Build failed!"
    exit 1
fi
