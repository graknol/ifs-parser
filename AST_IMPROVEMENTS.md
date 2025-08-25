# AST Usability Improvements

This document describes the improvements made to the IFS Cloud Parser grammar to make the Abstract Syntax Tree (AST) more usable for developers.

## Key Improvements

### 1. Named Fields for Better Navigation

Previously, developers had to navigate the AST by position (child 0, child 1, etc.), which was error-prone and hard to understand. Now, key parts of the AST use named fields:

#### Procedure/Function Declarations
- `name:` - The procedure/function name
- `parameters:` - The parameter list 
- `declarations:` - Local variable/constant declarations
- `body:` - The executable statements
- `exception_handler:` - Exception handling section
- `return_type:` - Return type (functions only)

#### Parameter Declarations
- `name:` - Parameter name
- `direction:` - IN/OUT/IN OUT direction
- `type:` - Data type
- `default_value:` - Default value (if any)

#### Control Flow Statements
- **IF statements**: `condition:`, `then_body:`, `elsif_clauses:`, `else_clause:`
- **Loops**: `condition:`/`range:`, `body:`, `label:`, `loop_variable:`
- **Assignment**: `target:`, `value:`

#### Variable Declarations
- `name:` - Variable name
- `type:` - Data type
- `default_value:` - Initial value (if any)
- `value:` - Value (for constants)

#### Exception Handling
- `exception_name:` - Which exception is being handled
- `handler_body:` - Statements to execute

### 2. Reduced AST Nesting

The old `annotated_statement` wrapper created unnecessary nesting. Now annotations are attached directly to statements as `annotations:` fields, making the AST flatter and easier to navigate.

### 3. Semantic Field Names

Instead of generic child nodes, important semantic parts now have meaningful names that match the domain language (PL/SQL concepts).

## Example Usage

With these improvements, developers can now write more intuitive code:

```python
# Old way - brittle and unclear
procedure_name = procedure_node.children[2].text

# New way - clear and robust  
procedure_name = procedure_node.children_by_field_name('name')[0].text

# Navigate to procedure body
body_statements = procedure_node.children_by_field_name('body')

# Get parameter information
for param in procedure_node.children_by_field_name('parameters')[0].children:
    param_name = param.children_by_field_name('name')[0].text
    param_type = param.children_by_field_name('type')[0].text
    print(f"Parameter: {param_name} ({param_type})")
```

## Migration Guide

Existing code using positional navigation will continue to work, but we recommend migrating to field-based access for better maintainability:

- Use `node.children_by_field_name('field_name')` instead of `node.children[index]`
- The field names are self-documenting and match PL/SQL concepts
- Field-based access is more resilient to grammar changes

These improvements make the parser much more user-friendly while maintaining full backward compatibility.
