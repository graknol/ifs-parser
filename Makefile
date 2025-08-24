.PHONY: build-grammars test-grammars clean-grammars help

# Default target
help:
	@echo "Available targets:"
	@echo "  build-grammars  - Build all tree-sitter grammars"
	@echo "  test-grammars   - Test all tree-sitter grammars" 
	@echo "  clean-grammars  - Clean generated grammar files"
	@echo "  build           - Build the main Rust project"
	@echo "  test            - Test the main Rust project"
	@echo "  clean           - Clean all build artifacts"

# Build tree-sitter grammars
build-grammars:
	@echo "Building tree-sitter grammars..."
	@./scripts/build-grammars.sh

# Test tree-sitter grammars
test-grammars: build-grammars
	@echo "Testing tree-sitter grammars..."
	@cd grammars/tree-sitter-plsql-ifs && tree-sitter test

# Clean generated grammar files
clean-grammars:
	@echo "Cleaning grammar artifacts..."
	@find grammars -name "src/parser.c" -delete || true
	@find grammars -name "src/tree_sitter" -type d -exec rm -rf {} + || true
	@find grammars -name "node_modules" -type d -exec rm -rf {} + || true

# Build main Rust project (depends on grammars)
build: build-grammars
	@echo "Building main project..."
	@cargo build

# Test main Rust project
test: build-grammars
	@echo "Testing main project..."
	@cargo test

# Clean everything
clean: clean-grammars
	@echo "Cleaning Rust artifacts..."
	@cargo clean

# Development workflow - build and test everything
dev: clean build test test-grammars
	@echo "Development build complete!"
