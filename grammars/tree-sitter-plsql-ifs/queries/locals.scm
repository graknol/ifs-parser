; Local variable scoping for IFS PL/SQL

; Procedure/Function scope
(procedure_declaration
  name: (identifier) @local.definition.function
  body: (_) @local.scope)

(function_declaration
  name: (identifier) @local.definition.function  
  body: (_) @local.scope)

; Parameter definitions
(parameter
  name: (identifier) @local.definition.parameter)

; Variable declarations
(variable_declaration
  name: (identifier) @local.definition.variable)

; References to identifiers
(identifier) @local.reference
