# Tree-sitter Integration Plan

This document outlines how to integrate tree-sitter parsers for IFS Cloud source code.

## Phase 1: Grammar Development

### 1.1 PL/SQL Grammar (`tree-sitter-plsql-ifs`)
```javascript
// grammar.js excerpt for IFS PL/SQL
module.exports = grammar({
  name: 'plsql_ifs',
  
  rules: {
    source_file: $ => repeat($._statement),
    
    _statement: $ => choice(
      $.procedure_declaration,
      $.function_declaration,
      $.variable_declaration,
      $.sql_statement,
    ),
    
    // IFS-specific visibility based on trailing underscores
    procedure_declaration: $ => seq(
      optional($.annotation), // @Override, @Overtake
      'PROCEDURE',
      $.identifier,
      optional($.parameter_list),
      'IS',
      optional($.declaration_section),
      'BEGIN',
      repeat($._statement),
      'END',
      optional($.identifier),
      ';'
    ),
    
    // IFS annotations
    annotation: $ => choice(
      '@Override',
      '@Overtake', 
      '@UncheckedAccess'
    ),
    
    // IFS overtake directives
    overtake_directive: $ => choice(
      seq('$SEARCH', repeat($._statement), '$REPLACE', repeat($._statement), '$END'),
      seq('$SEARCH', repeat($._statement), '$APPEND', repeat($._statement), '$END'),
      seq('$PREPEND', repeat($._statement), '$SEARCH', repeat($._statement), '$END'),
    ),
    
    // SQL injection for embedded SQL
    sql_statement: $ => choice(
      $.select_statement,
      $.cursor_declaration,
      $.dml_statement
    ),
  }
});
```

### 1.2 Entity Grammar (`tree-sitter-entity`)
For XML-based entity definitions.

### 1.3 Views Grammar (`tree-sitter-views`) 
For SQL view definitions with IFS extensions.

## Phase 2: Integration Architecture

```rust
// src/parser/tree_sitter.rs
use tree_sitter::{Parser, Tree, Language, Node};

pub struct TreeSitterParser {
    parser: Parser,
    trees: HashMap<PathBuf, Tree>,
    source_texts: HashMap<PathBuf, String>,
}

impl TreeSitterParser {
    pub fn new() -> Result<Self> {
        let mut parser = Parser::new();
        // We'll need to build and link the grammar libraries
        parser.set_language(tree_sitter_plsql_ifs::language())?;
        
        Ok(Self {
            parser,
            trees: HashMap::new(),
            source_texts: HashMap::new(),
        })
    }
    
    pub fn parse_incremental(&mut self, path: &Path, new_text: String, changes: &[InputEdit]) -> Result<AstNode> {
        let old_tree = self.trees.get(path);
        
        // Apply edits to the old tree for incremental parsing
        if let Some(tree) = old_tree {
            for edit in changes {
                tree.edit(edit);
            }
        }
        
        // Parse with the old tree as context
        let new_tree = self.parser.parse(&new_text, old_tree)?;
        
        // Convert tree-sitter CST to our AST
        let ast = self.convert_to_ast(new_tree.root_node(), &new_text)?;
        
        // Cache the new tree
        self.trees.insert(path.to_path_buf(), new_tree);
        self.source_texts.insert(path.to_path_buf(), new_text);
        
        Ok(ast)
    }
}
```

## Phase 3: Grammar Compilation

We'll need to create separate crates for each grammar:
```
grammars/
├── tree-sitter-plsql-ifs/
│   ├── Cargo.toml
│   ├── grammar.js
│   ├── src/
│   │   ├── lib.rs
│   │   └── parser.c (generated)
│   └── bindings/
│       └── rust/
├── tree-sitter-entity/
├── tree-sitter-enumeration/
├── tree-sitter-views/
└── tree-sitter-marble/
```

## Phase 4: Performance Benefits

With tree-sitter, we get:

1. **Incremental parsing**: Only changed regions are reparsed
2. **Error resilience**: Syntax errors don't break the entire parse
3. **Query system**: Fast searches using S-expressions
4. **Language injection**: SQL embedded in PL/SQL parsed correctly
5. **Memory efficiency**: Shared nodes between parse trees

## Phase 5: LSP Integration

```rust
// For LSP server
impl LanguageServer for IfsLanguageServer {
    async fn did_change(&self, params: DidChangeTextDocumentParams) {
        let changes: Vec<InputEdit> = params.content_changes
            .iter()
            .map(|change| InputEdit {
                start_byte: change.range.start.into(),
                old_end_byte: change.range.end.into(), 
                new_end_byte: (change.range.start + change.text.len()).into(),
                start_position: change.range.start.into(),
                old_end_position: change.range.end.into(),
                new_end_position: Point::new(/* calculate from change.text */),
            })
            .collect();
            
        // Incremental reparse - only changed regions
        let ast = self.parser.parse_incremental(&uri.to_file_path()?, new_text, &changes)?;
        
        // Update index incrementally
        self.index.update_incremental(&uri, &ast, &changes).await?;
    }
}
```

## Next Steps

1. Start with PL/SQL grammar as it's the most complex
2. Build grammar compilation into CI/CD
3. Benchmark against current nom-based parser
4. Migrate incrementally, keeping current parser as fallback
