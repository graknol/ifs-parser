/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Tree-sitter grammar for IFS Cloud PL/SQL variant
 * 
 * This grammar parses the PL/SQL dialect used in IFS Cloud, which includes:
 * - Standard Oracle PL/SQL syntax
 * - IFS annotations: @Override, @Overtake, @UncheckedAccess  
 * - IFS overtake directives: $SEARCH, $REPLACE, $APPEND, $PREPEND, $END
 * - IFS visibility conventions based on trailing underscores
 * - Embedded SQL statements within PL/SQL
 */

module.exports = grammar({
  name: 'plsql_ifs',

  extras: $ => [
    /\s+/,        // Whitespace
    $.comment,    // Comments
  ],

  conflicts: $ => [
    // Handle ambiguities between identifiers and keywords
    [$.identifier, $.keyword],
  ],

  rules: {
    // Entry point - a PL/SQL file contains multiple top-level statements
    source_file: $ => repeat($._top_level_statement),

    _top_level_statement: $ => choice(
      $.procedure_declaration,
      $.function_declaration,
      $.variable_declaration,
      $.type_declaration,
      $.cursor_declaration,
      $.exception_declaration,
    ),

    // === PROCEDURE DECLARATIONS ===
    procedure_declaration: $ => seq(
      optional($.annotation),
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

    // === FUNCTION DECLARATIONS ===
    function_declaration: $ => seq(
      optional($.annotation),
      'FUNCTION',
      $.identifier,
      optional($.parameter_list),
      'RETURN',
      $.type_name,
      'IS',
      optional($.declaration_section),
      'BEGIN',
      repeat($._statement),
      'END',
      optional($.identifier),
      ';'
    ),

    // === IFS ANNOTATIONS ===
    annotation: $ => choice(
      '@Override',
      '@Overtake',
      '@UncheckedAccess',
    ),

    // === PARAMETER LISTS ===
    parameter_list: $ => seq(
      '(',
      optional(seq(
        $.parameter,
        repeat(seq(',', $.parameter))
      )),
      ')'
    ),

    parameter: $ => seq(
      $.identifier,
      optional($.parameter_mode),
      $.type_name,
      optional(seq('DEFAULT', $._expression))
    ),

    parameter_mode: $ => choice('IN', 'OUT', 'IN OUT'),

    // === DECLARATIONS ===
    declaration_section: $ => repeat1($._declaration),

    _declaration: $ => choice(
      $.variable_declaration,
      $.cursor_declaration,
      $.exception_declaration,
      $.type_declaration,
    ),

    variable_declaration: $ => seq(
      $.identifier,
      optional('CONSTANT'),
      $.type_name,
      optional(seq(':=', $._expression)),
      ';'
    ),

    cursor_declaration: $ => seq(
      'CURSOR',
      $.identifier,
      optional($.parameter_list),
      'IS',
      $.select_statement,
      ';'
    ),

    exception_declaration: $ => seq(
      $.identifier,
      'EXCEPTION',
      ';'
    ),

    type_declaration: $ => seq(
      'TYPE',
      $.identifier,
      'IS',
      choice(
        seq('RECORD', '(', repeat(seq($.identifier, $.type_name, optional(','))), ')'),
        seq('TABLE OF', $.type_name),
        seq('VARRAY', '(', $.number, ')', 'OF', $.type_name)
      ),
      ';'
    ),

    // === STATEMENTS ===
    _statement: $ => choice(
      $.assignment_statement,
      $.procedure_call,
      $.if_statement,
      $.loop_statement,
      $.return_statement,
      $.sql_statement,
      $.overtake_directive,
      $.null_statement,
    ),

    assignment_statement: $ => seq(
      $.identifier,
      ':=',
      $._expression,
      ';'
    ),

    procedure_call: $ => seq(
      $.qualified_identifier,
      optional(seq('(', optional($.argument_list), ')')),
      ';'
    ),

    if_statement: $ => seq(
      'IF',
      $._expression,
      'THEN',
      repeat($._statement),
      repeat(seq('ELSIF', $._expression, 'THEN', repeat($._statement))),
      optional(seq('ELSE', repeat($._statement))),
      'END IF',
      ';'
    ),

    loop_statement: $ => seq(
      optional(seq($.identifier, ':')),
      choice(
        seq('LOOP', repeat($._statement), 'END LOOP'),
        seq('WHILE', $._expression, 'LOOP', repeat($._statement), 'END LOOP'),
        seq('FOR', $.identifier, 'IN', $._expression, '..', $._expression, 'LOOP', repeat($._statement), 'END LOOP')
      ),
      ';'
    ),

    return_statement: $ => seq(
      'RETURN',
      optional($._expression),
      ';'
    ),

    null_statement: $ => seq('NULL', ';'),

    // === IFS OVERTAKE DIRECTIVES ===
    overtake_directive: $ => choice(
      $.search_replace_directive,
      $.search_append_directive,
      $.prepend_search_directive,
    ),

    search_replace_directive: $ => seq(
      '$SEARCH',
      repeat($._statement),
      '$REPLACE',  
      repeat($._statement),
      '$END'
    ),

    search_append_directive: $ => seq(
      '$SEARCH',
      repeat($._statement),
      '$APPEND',
      repeat($._statement), 
      '$END'
    ),

    prepend_search_directive: $ => seq(
      '$PREPEND',
      repeat($._statement),
      '$SEARCH',
      repeat($._statement),
      '$END'
    ),

    // === SQL STATEMENTS (Language Injection Point) ===
    sql_statement: $ => choice(
      $.select_statement,
      $.insert_statement,
      $.update_statement,
      $.delete_statement,
    ),

    select_statement: $ => seq(
      'SELECT',
      $.select_list,
      'FROM',
      $.table_expression,
      optional(seq('WHERE', $._expression)),
      optional(seq('GROUP BY', $.expression_list)),
      optional(seq('HAVING', $._expression)),
      optional(seq('ORDER BY', $.order_by_list)),
    ),

    insert_statement: $ => seq(
      'INSERT INTO',
      $.table_name,
      optional(seq('(', $.column_list, ')')),
      'VALUES',
      '(',
      $.expression_list,
      ')',
      ';'
    ),

    update_statement: $ => seq(
      'UPDATE',
      $.table_name,
      'SET',
      $.assignment_list,
      optional(seq('WHERE', $._expression)),
      ';'
    ),

    delete_statement: $ => seq(
      'DELETE FROM',
      $.table_name,
      optional(seq('WHERE', $._expression)),
      ';'
    ),

    // === EXPRESSIONS ===
    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.null_check_expression,
      $.function_call,
      $.qualified_identifier,
      $.string_literal,
      $.number,
      $.boolean_literal,
      $.parenthesized_expression,
    ),

    binary_expression: $ => prec.left(1, seq(
      $._expression,
      choice(
        '=', '!=', '<>', '<', '<=', '>', '>=', '+', '-', '*', '/', 
        'AND', 'OR', '||'
      ),
      $._expression
    )),

    null_check_expression: $ => seq(
      $._expression,
      choice(
        seq('IS', 'NULL'),
        seq('IS', 'NOT', 'NULL')
      )
    ),

    unary_expression: $ => prec(2, seq(
      choice('NOT', '-', '+'),
      $._expression
    )),

    function_call: $ => seq(
      $.qualified_identifier,
      '(',
      optional($.argument_list),
      ')'
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    // === LITERALS ===
    string_literal: $ => choice(
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
      // Handle Oracle's doubled single quotes for escaping
      seq("'", repeat(choice(/[^']/, "''")), "'")
    ),

    number: $ => /\d+(\.\d+)?/,

    boolean_literal: $ => choice('TRUE', 'FALSE'),

    // === IDENTIFIERS ===
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    qualified_identifier: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier))
    ),

    // === TYPE NAMES ===
    type_name: $ => choice(
      // Oracle %TYPE and %ROWTYPE references
      seq(
        $.qualified_identifier,
        choice('%TYPE', '%ROWTYPE')
      ),
      // Standard type definitions
      seq(
        choice(
          'VARCHAR2',
          'NUMBER',
          'DATE', 
          'BOOLEAN',
          'CLOB',
          'BLOB',
          $.identifier
        ),
        optional(seq('(', choice($.number, seq($.number, ',', $.number)), ')'))
      )
    ),

    // === HELPER RULES ===
    select_list: $ => choice(
      '*',
      seq($._expression, repeat(seq(',', $._expression)))
    ),

    table_expression: $ => seq(
      $.table_name,
      repeat(seq(
        choice('INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'),
        $.table_name,
        'ON',
        $._expression
      ))
    ),

    table_name: $ => $.qualified_identifier,

    column_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier))
    ),

    expression_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    assignment_list: $ => seq(
      seq($.identifier, '=', $._expression),
      repeat(seq(',', $.identifier, '=', $._expression))
    ),

    order_by_list: $ => seq(
      seq($._expression, optional(choice('ASC', 'DESC'))),
      repeat(seq(',', $._expression, optional(choice('ASC', 'DESC'))))
    ),

    // === COMMENTS ===
    comment: $ => choice(
      seq('--', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    ),

    // === KEYWORDS (for conflict resolution) ===
    keyword: $ => choice(
      'PROCEDURE', 'FUNCTION', 'IS', 'BEGIN', 'END', 'IF', 'THEN', 'ELSE', 'ELSIF',
      'LOOP', 'WHILE', 'FOR', 'IN', 'RETURN', 'NULL', 'SELECT', 'FROM', 'WHERE',
      'INSERT', 'UPDATE', 'DELETE', 'INTO', 'VALUES', 'SET', 'AND', 'OR', 'NOT',
      'TRUE', 'FALSE', 'CURSOR', 'EXCEPTION', 'TYPE', 'RECORD', 'TABLE', 'OF',
      'VARRAY', 'DEFAULT', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC',
      'INNER', 'LEFT', 'RIGHT', 'FULL', 'JOIN', 'ON'
    ),
  }
});
