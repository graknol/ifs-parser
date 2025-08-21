; Syntax highlighting rules for IFS PL/SQL

; Keywords
[
  "PROCEDURE"
  "FUNCTION" 
  "IS"
  "BEGIN"
  "END"
  "IF"
  "THEN"
  "ELSE"
  "ELSIF"
  "LOOP"
  "WHILE"
  "FOR"
  "IN"
  "RETURN"
  "NULL"
  "CURSOR"
  "EXCEPTION"
  "TYPE"
  "RECORD"
  "TABLE"
  "OF"
] @keyword

; SQL Keywords
[
  "SELECT"
  "FROM" 
  "WHERE"
  "INSERT"
  "UPDATE"
  "DELETE"
  "INTO"
  "VALUES"
  "SET"
  "GROUP BY"
  "HAVING"
  "ORDER BY"
] @keyword.sql

; Types
[
  "VARCHAR2"
  "NUMBER"
  "DATE"
  "BOOLEAN"
  "CLOB"
  "BLOB"
] @type.builtin

; Operators
[
  ":="
  "="
  "!="
  "<>"
  "<"
  "<="
  ">"
  ">="
  "+"
  "-"
  "*"
  "/"
  "||"
  "AND"
  "OR"
  "NOT"
] @operator

; IFS Annotations
[
  "@Override"
  "@Overtake" 
  "@UncheckedAccess"
] @attribute

; IFS Overtake Directives
[
  "$SEARCH"
  "$REPLACE"
  "$APPEND"
  "$PREPEND"
  "$END"
] @keyword.directive

; Literals
(string_literal) @string
(number) @number
(boolean_literal) @boolean

; Identifiers
(identifier) @variable

; Function calls
(function_call
  function: (qualified_identifier) @function)

; Procedure calls  
(procedure_call
  procedure: (qualified_identifier) @function)

; Parameters
(parameter
  name: (identifier) @parameter)

; Comments
(comment) @comment

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
  ","
  ";"
  "."
] @punctuation.delimiter
