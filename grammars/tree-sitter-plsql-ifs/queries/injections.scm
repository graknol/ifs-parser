; Language injection for SQL within PL/SQL

; Inject SQL highlighting into SQL statements
((select_statement) @injection.content
 (#set! injection.language "sql"))

((insert_statement) @injection.content
 (#set! injection.language "sql"))

((update_statement) @injection.content  
 (#set! injection.language "sql"))

((delete_statement) @injection.content
 (#set! injection.language "sql"))

; Inject SQL into cursor declarations
((cursor_declaration
  query: (select_statement) @injection.content)
 (#set! injection.language "sql"))
