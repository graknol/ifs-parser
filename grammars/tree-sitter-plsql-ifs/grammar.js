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
 * - Scalar subqueries in expressions
 */

// Helper function for case-insensitive keywords
function kw(word) {
  return new RegExp(word.replace(/./g, letter => {
    const upper = letter.toUpperCase();
    const lower = letter.toLowerCase();
    return upper !== lower ? `[${upper}${lower}]` : letter;
  }))
}

module.exports = grammar({
  name: 'plsql_ifs',

  extras: $ => [
    /\s+/,        // Whitespace
    $.comment,    // Comments can appear anywhere
  ],

  conflicts: $ => [
    // Handle ambiguities between identifiers and keywords
    [$.identifier, $.keyword],
    // Handle ambiguity between top-level and declaration-section variables
    [$._top_level_statement, $._declaration],
    // Handle ambiguity between table alias and next clause
    [$.table_reference],
    // Handle ambiguity between table alias and join clause
    [$.table_alias, $.join_clause],
  ],

  rules: {
    // Entry point - a PL/SQL file contains multiple items
    source_file: $ => repeat(choice(
      $._top_level_statement,
      $.layer_declaration
    )),

    // Layer declaration for IFS files
    layer_declaration: $ => seq('layer', $.identifier, ';'),

    _top_level_statement: $ => choice(
      $.procedure_declaration,
      $.function_declaration,
      $.variable_declaration,
      $.type_declaration,
      $.cursor_declaration,
      $.exception_declaration,
      $.anonymous_block,
      $.sql_statement,
    ),

    // === PROCEDURE DECLARATIONS ===
    procedure_declaration: $ => seq(
      repeat($.annotation),
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
      repeat($.annotation),
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

    // === ANONYMOUS BLOCKS ===
    anonymous_block: $ => seq(
      optional('DECLARE'),
      optional($.declaration_section),
      'BEGIN',
      repeat($._statement),
      optional(seq('EXCEPTION', repeat($.exception_handler))),
      'END',
      optional(';')
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
      $.pragma_directive,
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

    exception_handler: $ => seq(
      'WHEN',
      choice(
        $.identifier,           // specific exception name
        'OTHERS'               // catch-all handler
      ),
      'THEN',
      repeat($._statement)
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

    // === PRAGMA DIRECTIVES ===
    pragma_directive: $ => seq(
      'PRAGMA',
      choice(
        'AUTONOMOUS_TRANSACTION',
        seq('EXCEPTION_INIT', '(', $.identifier, ',', choice($.number, seq('-', $.number)), ')'),
        'SERIALLY_REUSABLE',
        seq('RESTRICT_REFERENCES', '(', $.identifier, ',', $.pragma_restriction_list, ')'),
        // Generic pragma for other cases
        seq($.identifier, optional(seq('(', optional($.pragma_argument_list), ')')))
      ),
      ';'
    ),

    pragma_restriction_list: $ => seq(
      $.pragma_restriction,
      repeat(seq(',', $.pragma_restriction))
    ),

    pragma_restriction: $ => choice(
      'WNDS',    // Writes No Database State
      'WNPS',    // Writes No Package State
      'RNDS',    // Reads No Database State
      'RNPS',    // Reads No Package State
      'TRUST'    // Trust function
    ),

    pragma_argument_list: $ => seq(
      $.pragma_argument,
      repeat(seq(',', $.pragma_argument))
    ),

    pragma_argument: $ => choice(
      $.identifier,
      $.number,
      $.string_literal,
      seq('-', $.number)
    ),

    // === STATEMENTS ===
    _statement: $ => choice(
      $.assignment_statement,
      $.procedure_call,
      $.if_statement,
      $.loop_statement,
      $.return_statement,
      $.sql_statement,
      $.select_into_statement,
      $.overtake_directive,
      $.null_statement,
      $.pragma_directive,
    ),

    assignment_statement: $ => seq(
      $.qualified_identifier,
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

    select_into_statement: $ => seq(
      'SELECT',
      $.select_list,
      'INTO',
      $.variable_list,
      'FROM',
      $.table_expression,
      optional(seq('WHERE', $._expression)),
      optional(seq('GROUP BY', $.expression_list)),
      optional(seq('HAVING', $._expression)),
      optional(seq('ORDER BY', $.order_by_list)),
      ';'
    ),

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
      $.cte_statement,
      $.top_level_select_statement,
      $.insert_statement,
      $.update_statement,
      $.delete_statement,
      $.merge_statement,
    ),

    top_level_select_statement: $ => seq(
      $.select_statement,
      ';'
    ),

    select_statement: $ => seq(
      kw('SELECT'),
      $.select_list,
      kw('FROM'),
      $.table_expression,
      optional(seq(kw('WHERE'), $._expression)),
      optional($.start_with_clause),
      optional($.connect_by_clause),
      optional(seq(kw('GROUP BY'), $.expression_list)),
      optional(seq(kw('HAVING'), $._expression)),
      optional(seq(kw('ORDER BY'), $.order_by_list)),
    ),

    // Hierarchical query clauses
    start_with_clause: $ => seq(kw('START'), kw('WITH'), $._expression),

    connect_by_clause: $ => seq(kw('CONNECT'), kw('BY'), optional(kw('NOCYCLE')), $._expression),

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

    // Common Table Expression (CTE) - WITH clause
    cte_statement: $ => seq(
      kw('WITH'),
      optional(kw('RECURSIVE')),
      $.cte_definition,
      repeat(seq(',', $.cte_definition)),
      $.select_statement,
      ';'
    ),

    cte_definition: $ => seq(
      $.identifier,
      optional(seq('(', $.column_list, ')')),
      kw('AS'),
      '(',
      $.select_statement,
      ')'
    ),

    // MERGE statement  
    merge_statement: $ => seq(
      kw('MERGE'),
      kw('INTO'),
      $.table_name,
      optional($.table_alias),
      kw('USING'),
      choice(
        $.table_name,
        seq('(', $.select_statement, ')')
      ),
      optional($.table_alias),
      kw('ON'),
      '(',
      $._expression,
      ')',
      repeat1(choice(
        $.merge_when_matched,
        $.merge_when_not_matched
      )),
      ';'
    ),

    merge_when_matched: $ => seq(
      kw('WHEN'),
      kw('MATCHED'),
      optional(seq(kw('AND'), $._expression)),
      kw('THEN'),
      choice(
        seq(kw('UPDATE'), kw('SET'), $.assignment_list),
        seq(kw('DELETE'))
      )
    ),

    merge_when_not_matched: $ => seq(
      kw('WHEN'),
      kw('NOT'),
      kw('MATCHED'),
      optional(seq(kw('AND'), $._expression)),
      kw('THEN'),
      kw('INSERT'),
      optional(seq('(', $.column_list, ')')),
      kw('VALUES'),
      '(',
      $.value_list,
      ')'
    ),

    // === EXPRESSIONS ===
    _expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.null_check_expression,
      $.in_expression,
      $.between_expression,
      $.like_expression,
      $.prior_expression,
      $.function_call,
      $.qualified_identifier,
      $.cursor_attribute,
      $.pseudo_column,
      $.xml_function,
      $.string_literal,
      $.date_literal,
      $.number,
      $.boolean_literal,
      $.parenthesized_expression,
      $.scalar_subquery,
    ),

    binary_expression: $ => prec.left(1, seq(
      $._expression,
      choice(
        '=', '!=', '<>', '<', '<=', '>', '>=', '+', '-', '*', '/', kw('MOD'), '**',
        kw('AND'), kw('OR'), '||'
      ),
      $._expression
    )),

    null_check_expression: $ => seq(
      $._expression,
      choice(
        seq(kw('IS'), kw('NULL')),
        seq(kw('IS'), kw('NOT'), kw('NULL'))
      )
    ),

    unary_expression: $ => prec(2, seq(
      choice('NOT', '-', '+'),
      $._expression
    )),

    // IN expression: column IN (value1, value2, ...)
    in_expression: $ => prec.left(4, seq(
      $._expression,
      choice(kw('IN'), seq(kw('NOT'), kw('IN'))),
      '(',
      $.value_list,
      ')'
    )),

    // BETWEEN expression: column BETWEEN value1 AND value2
    between_expression: $ => prec.left(4, seq(
      $._expression,
      choice(kw('BETWEEN'), seq(kw('NOT'), kw('BETWEEN'))),
      $._expression,
      kw('AND'),
      $._expression
    )),

    // LIKE expression: column LIKE pattern [ESCAPE escape_char]
    like_expression: $ => prec.left(4, seq(
      $._expression,
      choice(kw('LIKE'), seq(kw('NOT'), kw('LIKE'))),
      $._expression,
      optional(seq(kw('ESCAPE'), $._expression))
    )),

    // PRIOR expression for hierarchical queries: PRIOR column
    prior_expression: $ => prec(3, seq(kw('PRIOR'), $._expression)),

    // Value list for IN expressions
    value_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
    ),

    function_call: $ => seq(
      $.qualified_identifier,
      '(',
      optional($.argument_list),
      ')'
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    scalar_subquery: $ => seq('(', $.select_statement, ')'),

    // === LITERALS ===
    string_literal: $ => choice(
      seq("'", repeat(choice(/[^'\\]/, /\\./)), "'"),
      // Handle Oracle's doubled single quotes for escaping
      seq("'", repeat(choice(/[^']/, "''")), "'")
    ),

    number: $ => /\d+(\.\d+)?/,

    boolean_literal: $ => choice('TRUE', 'FALSE'),

    // DATE literal support: DATE '2020-01-01'
    date_literal: $ => seq('DATE', $.string_literal),

    // === IDENTIFIERS ===
    identifier: $ => choice(
      // Regular identifiers
      /[a-zA-Z_][a-zA-Z0-9_]*/,
      // Quoted identifiers (case-sensitive, can contain spaces and special chars)
      seq('"', /[^"]+/, '"')
    ),

    qualified_identifier: $ => seq(
      $.identifier,
      repeat(seq('.', $.identifier))
    ),

    // Cursor attributes like SQL%FOUND, cursor_name%NOTFOUND, etc.
    cursor_attribute: $ => seq(
      choice(
        $.identifier,        // cursor_name%FOUND
        'SQL'               // SQL%FOUND
      ),
      choice(
        '%FOUND',
        '%NOTFOUND',
        '%ISOPEN',
        '%ROWCOUNT'
      )
    ),

    // Oracle pseudo-columns
    pseudo_column: $ => choice(
      'ROWNUM',
      'ROWID',
      'LEVEL',
      'CONNECT_BY_ISLEAF',
      'CONNECT_BY_ISCYCLE',
      // XML pseudo-columns (simple ones)
      'XMLDATA',
      'XMLSCHEMA',
      'XMLNAMESPACE'
    ),

    // XML functions with special syntax
    xml_function: $ => choice(
      // XMLELEMENT("name", content...)
      seq('XMLELEMENT', '(', $.string_literal, repeat(seq(',', $._expression)), ')'),

      // XMLATTRIBUTES(expr AS "attr", ...)  
      seq('XMLATTRIBUTES', '(', $.xml_attribute_list, ')'),

      // XMLFOREST(expr AS "name", ...)
      seq('XMLFOREST', '(', $.xml_forest_list, ')'),

      // XMLAGG(expression)
      seq('XMLAGG', '(', $._expression, ')'),

      // XMLCONCAT(expr1, expr2, ...)
      seq('XMLCONCAT', '(', $.expression_list, ')'),

      // Other XML functions with standard syntax
      seq(choice(
        'XMLROOT', 'XMLPI', 'XMLCOMMENT', 'XMLCDATA',
        'XMLPARSE', 'XMLSERIALIZE', 'XMLQUERY', 'XMLEXISTS',
        'XMLTABLE', 'XMLCAST', 'XMLCOLATTVAL', 'XMLTRANSFORM'
      ), '(', optional($.xml_argument_list), ')')
    ),

    xml_attribute_list: $ => seq(
      $.xml_attribute,
      repeat(seq(',', $.xml_attribute))
    ),

    xml_attribute: $ => seq(
      $._expression,
      'AS',
      $.string_literal
    ),

    xml_forest_list: $ => seq(
      $.xml_forest_item,
      repeat(seq(',', $.xml_forest_item))
    ),

    xml_forest_item: $ => seq(
      $._expression,
      optional(seq('AS', $.string_literal))
    ),

    xml_argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression))
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
          'CHAR',
          'VARCHAR2',
          'LONG',
          'BLOB',
          'CLOB',
          'NCLOB',
          'NUMBER',
          'BINARY_INTEGER|PLS_INTEGER',
          'DATE',
          'TIMESTAMP',
          'TIMESTAMP WITH TIME ZONE',
          'TIMESTAMP WITH LOCAL TIME ZONE',
          'BOOLEAN',
          $.identifier
        ),
        optional(seq('(', choice($.number, seq($.number, ',', $.number)), ')'))
      )
    ),

    // === HELPER RULES ===
    select_list: $ => choice(
      '*',
      seq(optional('DISTINCT'), $.select_item, repeat(seq(',', $.select_item)))
    ),

    select_item: $ => seq(
      $._expression,
      optional(choice(
        seq(kw('AS'), $.identifier),      // AS alias_name or AS "quoted alias"
        $.identifier                      // alias_name or "quoted alias" (without AS)
      ))
    ),

    table_expression: $ => seq(
      $.table_reference,
      repeat(choice(
        // Implicit join (comma-separated)
        seq(',', $.table_reference),
        // Explicit join
        $.join_clause
      ))
    ),

    join_clause: $ => seq(
      choice(
        // Standard JOIN types with ON clause
        seq(
          choice(
            kw('JOIN'),
            seq(kw('INNER'), kw('JOIN')),
            seq(kw('LEFT'), optional(kw('OUTER')), kw('JOIN')),
            seq(kw('RIGHT'), optional(kw('OUTER')), kw('JOIN')),
            seq(kw('FULL'), optional(kw('OUTER')), kw('JOIN'))
          ),
          $.table_reference,
          seq(kw('ON'), $._expression)
        ),
        // CROSS JOIN without ON clause
        seq(
          seq(kw('CROSS'), kw('JOIN')),
          $.table_reference
        ),
        // APPLY operations with subqueries or table references
        seq(
          choice(
            seq(kw('CROSS'), kw('APPLY')),
            seq(kw('OUTER'), kw('APPLY'))
          ),
          choice(
            $.table_reference,
            seq('(', $.select_statement, ')', optional($.table_alias))
          )
        )
      )
    ),

    table_reference: $ => seq(
      $.table_name,
      optional($.table_alias)
    ),

    table_alias: $ => choice(
      $.identifier,
      seq(kw('AS'), $.identifier)
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
      choice(
        '*',
        seq(optional('DISTINCT'), $._expression)
      ),
      repeat(seq(',', choice(
        '*',
        seq(optional('DISTINCT'), $._expression)
      )))
    ),

    variable_list: $ => seq(
      $.qualified_identifier,
      repeat(seq(',', $.qualified_identifier))
    ),

    assignment_list: $ => seq(
      seq($.qualified_identifier, '=', $._expression),
      repeat(seq(',', $.qualified_identifier, '=', $._expression))
    ),

    order_by_list: $ => seq(
      seq($._expression, optional(choice('ASC', 'DESC'))),
      repeat(seq(',', $._expression, optional(choice('ASC', 'DESC'))))
    ),

    // === COMMENTS ===
    comment: $ => choice(
      // Single line comment
      seq('--', /.*/),
      // Multi-line comment  
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    ),

    // === KEYWORDS (for conflict resolution) ===
    keyword: $ => choice(
      'PROCEDURE', 'FUNCTION', 'IS', 'BEGIN', 'END', 'IF', 'THEN', 'ELSE', 'ELSIF',
      'LOOP', 'WHILE', 'FOR', 'IN', 'RETURN', 'NULL', 'SELECT', 'FROM', 'WHERE',
      'INSERT', 'UPDATE', 'DELETE', 'INTO', 'VALUES', 'SET', 'AND', 'OR', 'NOT',
      'TRUE', 'FALSE', 'CURSOR', 'EXCEPTION', 'TYPE', 'RECORD', 'TABLE', 'OF',
      'VARRAY', 'DEFAULT', 'GROUP BY', 'HAVING', 'ORDER BY', 'ASC', 'DESC',
      'INNER', 'LEFT', 'RIGHT', 'FULL', 'JOIN', 'ON', 'PRAGMA', 'OUTER', 'CROSS', 'APPLY',
      'ROWNUM', 'ROWID', 'LEVEL', 'XMLDATA', 'XMLSCHEMA', 'XMLNAMESPACE',
      'XMLELEMENT', 'XMLATTRIBUTES', 'XMLFOREST', 'XMLAGG', 'XMLTABLE'
    ),
  }
});
