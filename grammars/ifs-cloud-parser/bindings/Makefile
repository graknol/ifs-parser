build_bindings:
	@echo "Building Tree-sitter PL/SQL IFS bindings..."
	@echo "Building Node.js bindings..."
	cd bindings/node && npm install
	@echo "Building Python bindings..."
	cd bindings/python && pip install .
	@echo "Building C# bindings..."  
	cd bindings/csharp && dotnet build
	@echo "All bindings built successfully!"

test_bindings:
	@echo "Testing Tree-sitter PL/SQL IFS bindings..."
	@echo "Testing Node.js bindings..."
	cd bindings/node && npm test
	@echo "Testing Python bindings..."
	cd bindings/python && python -m pytest tests/ -v
	@echo "Testing C# bindings..."
	cd bindings/csharp && dotnet test
	@echo "All binding tests completed!"

clean_bindings:
	@echo "Cleaning binding build artifacts..."
	cd bindings/node && rm -rf build/ node_modules/
	cd bindings/python && rm -rf build/ dist/ *.egg-info/
	cd bindings/csharp && rm -rf bin/ obj/
	@echo "Binding artifacts cleaned!"

package_bindings:
	@echo "Packaging bindings for distribution..."
	cd bindings/node && npm pack
	cd bindings/python && python setup.py sdist bdist_wheel
	cd bindings/csharp && dotnet pack
	@echo "All bindings packaged!"

.PHONY: build_bindings test_bindings clean_bindings package_bindings
