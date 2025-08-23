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
 * - Comprehensive JOIN support including APPLY operations
 */

// Helper functions for better grammar organization

function make_keyword(word) {
  let str = "";
  for (let i = 0; i < word.length; i++) {
    str = str + "[" + word.charAt(i).toLowerCase() + word.charAt(i).toUpperCase() + "]";
  }
  return new RegExp(str);
}

function optional_parenthesis(node) {
  return prec.right(
    choice(
      node,
      wrapped_in_parenthesis(node),
    ),
  )
}

function wrapped_in_parenthesis(node) {
  if (node) {
    return seq("(", node, ")");
  }
  return seq("(", ")");
}

function comma_list(field, requireFirst = true) {
  const sequence = seq(field, repeat(seq(',', field)));

  if (requireFirst) {
    return sequence;
  }

  return optional(sequence);
}

function paren_list(field, requireFirst = true) {
  return wrapped_in_parenthesis(
    comma_list(field, requireFirst),
  )
}

function keyword_list(...words) {
  return choice(...words.map(w => make_keyword(w)));
}

function join_type($) {
  return choice(
    make_keyword('JOIN'),
    seq(make_keyword('INNER'), make_keyword('JOIN')),
    seq(make_keyword('LEFT'), optional(make_keyword('OUTER')), make_keyword('JOIN')),
    seq(make_keyword('RIGHT'), optional(make_keyword('OUTER')), make_keyword('JOIN')),
    seq(make_keyword('FULL'), optional(make_keyword('OUTER')), make_keyword('JOIN')),
  );
}

function apply_type() {
  return choice(
    seq(make_keyword('CROSS'), make_keyword('APPLY')),
    seq(make_keyword('OUTER'), make_keyword('APPLY')),
  );
}

module.exports = grammar({
  name: 'plsql_ifs',

  word: $ => $.identifier,

  extras: $ => [
    /\s+/,        // Whitespace
    $.comment,    // Comments can appear anywhere
  ],

  conflicts: $ => [
    [$.forall_statement, $._expression],
    [$.package_declaration, $._declaration],  // Resolve nested procedure conflict in packages
    [$.package_body, $._declaration],          // Resolve nested procedure conflict in package bodies
    [$.call_statement, $.argument_list],      // Resolve named parameter conflict
    [$.pragma_directive, $.argument_list],    // Resolve pragma vs argument list conflict
    [$._declaration, $._statement]            // Resolve conditional compilation conflict
  ],

  rules: {
    // Entry point - a PL/SQL file contains multiple items
    source_file: $ => repeat(choice(
      $._top_level_statement,
      $.layer_declaration,
      $.statement_terminator
    )),

    // Oracle PL/SQL statement terminator
    statement_terminator: $ => '/',

    // Layer declaration for IFS files
    layer_declaration: $ => seq(make_keyword('layer'), $.identifier, ';'),

    // Top-level statements
    _top_level_statement: $ => choice(
      $.package_declaration,
      $.package_body,
      $.sql_statement,
      $.anonymous_block,
      $.ifs_overtake_directive,
      $._declaration,  // This includes all types of declarations including procedures and functions
    ),

    // IFS Annotations
    // IFS Overtake directives
    ifs_overtake_directive: $ => choice(
      seq('$SEARCH', $.string_literal),
      seq('$REPLACE', $.string_literal),
      '$APPEND',
      '$PREPEND',
      '$END'
    ),

    // PRAGMA directives
    pragma_directive: $ => seq(
      make_keyword('PRAGMA'),
      $.identifier,
      optional(paren_list($._expression)),  // Just use expressions to avoid conflicts
      ';'
    ),

    // Procedure declaration
    procedure_declaration: $ => seq(
      repeat($.annotation),  // Optional annotations before procedure
      make_keyword('PROCEDURE'),
      $.identifier,
      optional($.parameter_list),
      make_keyword('IS'),
      repeat($._declaration),
      make_keyword('BEGIN'),
      repeat($.annotated_statement),
      optional($.exception_section),
      make_keyword('END'),
      optional($.identifier),
      ';'
    ),

    // Function declaration  
    function_declaration: $ => seq(
      repeat($.annotation),  // Optional annotations before function
      make_keyword('FUNCTION'),
      $.identifier,
      optional($.parameter_list),
      make_keyword('RETURN'),
      $.data_type,
      make_keyword('IS'),
      repeat($._declaration),
      make_keyword('BEGIN'),
      repeat($.annotated_statement),
      optional($.exception_section),
      make_keyword('END'),
      optional($.identifier),
      ';'
    ),

    // Package declaration
    package_declaration: $ => seq(
      make_keyword('PACKAGE'),
      $.identifier,
      make_keyword('IS'),
      repeat(choice($._declaration, $.procedure_declaration, $.function_declaration)),
      make_keyword('END'),
      optional($.identifier),
      ';'
    ),

    // Package body
    package_body: $ => seq(
      make_keyword('PACKAGE'),
      make_keyword('BODY'),
      $.identifier,
      make_keyword('IS'),
      repeat($._declaration),
      repeat(choice($.procedure_declaration, $.function_declaration)),
      optional(seq(
        make_keyword('BEGIN'),
        repeat($._statement),
        optional($.exception_section)
      )),
      make_keyword('END'),
      optional($.identifier),
      ';'
    ),

    // Parameter list
    parameter_list: $ => paren_list($.parameter_declaration),

    parameter_declaration: $ => seq(
      $.identifier,
      optional(choice(
        make_keyword('IN'),
        make_keyword('OUT'),
        seq(make_keyword('IN'), make_keyword('OUT')),
        seq(make_keyword('IN'), make_keyword('OUT'), make_keyword('NOCOPY')),
        seq(make_keyword('IN'), make_keyword('NOCOPY')),
        seq(make_keyword('OUT'), make_keyword('NOCOPY'))
      )),
      $.data_type,
      optional(choice(
        seq(make_keyword('DEFAULT'), $._expression),
        seq(':=', $._expression)
      ))
    ),

    // Declarations
    _declaration: $ => choice(
      $.variable_declaration,
      $.constant_declaration,
      $.cursor_declaration,
      $.type_declaration,
      $.exception_declaration,
      $.pragma_directive,
      $.procedure_declaration,  // Nested procedures
      $.function_declaration,   // Nested functions
      $.conditional_compilation_directive
    ),

    variable_declaration: $ => seq(
      $.identifier,
      $.data_type,
      optional(seq(':=', $._expression)),
      ';'
    ),

    constant_declaration: $ => seq(
      $.identifier,
      make_keyword('CONSTANT'),
      $.data_type,
      ':=',
      $._expression,
      ';'
    ),

    cursor_declaration: $ => seq(
      make_keyword('CURSOR'),
      $.identifier,
      optional($.parameter_list),
      optional(seq(make_keyword('RETURN'), $.data_type)),
      make_keyword('IS'),
      $.select_statement,
      ';'
    ),

    type_declaration: $ => choice(
      $.record_type_declaration,
      $.table_type_declaration,
      $.varray_type_declaration,
      $.ref_cursor_type_declaration
    ),

    record_type_declaration: $ => seq(
      make_keyword('TYPE'),
      $.identifier,
      make_keyword('IS'),
      make_keyword('RECORD'),
      paren_list($.record_field),
      ';'
    ),

    record_field: $ => seq(
      $.identifier,
      $.data_type,
      optional(seq(':=', $._expression))
    ),

    table_type_declaration: $ => seq(
      make_keyword('TYPE'),
      $.identifier,
      make_keyword('IS'),
      make_keyword('TABLE'),
      make_keyword('OF'),
      $.data_type,
      optional(seq(make_keyword('INDEX'), make_keyword('BY'), $.data_type)),
      ';'
    ),

    varray_type_declaration: $ => seq(
      make_keyword('TYPE'),
      $.identifier,
      make_keyword('IS'),
      make_keyword('VARRAY'),
      wrapped_in_parenthesis($.number),
      make_keyword('OF'),
      $.data_type,
      ';'
    ),

    ref_cursor_type_declaration: $ => seq(
      make_keyword('TYPE'),
      $.identifier,
      make_keyword('IS'),
      make_keyword('REF'),
      make_keyword('CURSOR'),
      optional(seq(make_keyword('RETURN'), $.data_type)), // For strongly typed cursors
      ';'
    ),

    exception_declaration: $ => seq(
      $.identifier,
      make_keyword('EXCEPTION'),
      ';'
    ),

    // Data types
    data_type: $ => choice(
      seq(make_keyword('VARCHAR2'), optional(wrapped_in_parenthesis($.number))),
      seq(make_keyword('NUMBER'), optional(wrapped_in_parenthesis(comma_list($.number, false)))),
      seq(make_keyword('INTEGER'), optional(wrapped_in_parenthesis($.number))),
      make_keyword('DATE'),
      make_keyword('BOOLEAN'),
      make_keyword('CLOB'),
      make_keyword('BLOB'),
      seq($.qualified_identifier, '%', make_keyword('TYPE')),
      seq($.qualified_identifier, '%', make_keyword('ROWTYPE')),
      $.qualified_identifier
    ),

    // Statements
    _statement: $ => choice(
      $.assignment_statement,
      $.if_statement,
      $.loop_statement,
      $.while_loop_statement,
      $.for_loop_statement,
      $.forall_statement,
      $.return_statement,
      $.raise_statement,
      $.sql_statement,
      $.select_into_statement,
      $.call_statement,
      $.null_statement,
      $.anonymous_block,
      $.case_statement,
      $.execute_immediate_statement,
      $.open_cursor_statement,
      $.fetch_cursor_statement,
      $.close_cursor_statement,
      $.exit_statement,
      $.continue_statement,
      $.label_statement,
      $.goto_statement,
      $.conditional_compilation_directive
    ),

    // Annotated statement allows annotations before any statement
    annotated_statement: $ => seq(
      repeat($.annotation),
      $._statement
    ),

    assignment_statement: $ => seq(
      choice(
        $.member_access,
        $.qualified_identifier,
        $.function_call  // This handles array element access like arr(index)
      ),
      ':=',
      $._expression,
      ';'
    ),

    if_statement: $ => prec.right(seq(
      make_keyword('IF'),
      $._expression,
      make_keyword('THEN'),
      repeat($._statement),
      repeat($.elsif_clause),
      optional($.else_clause),
      make_keyword('END'),
      make_keyword('IF'),
      ';'
    )),

    elsif_clause: $ => seq(
      make_keyword('ELSIF'),
      $._expression,
      make_keyword('THEN'),
      repeat($._statement)
    ),

    else_clause: $ => seq(
      make_keyword('ELSE'),
      repeat($._statement)
    ),

    loop_statement: $ => seq(
      optional(seq($.identifier, ':')),
      make_keyword('LOOP'),
      repeat($._statement),
      make_keyword('END'),
      make_keyword('LOOP'),
      optional($.identifier),
      ';'
    ),

    while_loop_statement: $ => seq(
      optional(seq($.identifier, ':')),
      make_keyword('WHILE'),
      $._expression,
      make_keyword('LOOP'),
      repeat($._statement),
      make_keyword('END'),
      make_keyword('LOOP'),
      optional($.identifier),
      ';'
    ),

    for_loop_statement: $ => seq(
      optional(seq($.identifier, ':')),
      make_keyword('FOR'),
      $.identifier,
      make_keyword('IN'),
      optional(make_keyword('REVERSE')),
      choice(
        $.cursor_for_loop_range,
        $.numeric_for_loop_range
      ),
      make_keyword('LOOP'),
      repeat($._statement),
      make_keyword('END'),
      make_keyword('LOOP'),
      optional($.identifier),
      ';'
    ),

    cursor_for_loop_range: $ => choice(
      $.identifier,
      $.function_call,  // This handles cursor_name(params)
      wrapped_in_parenthesis($.select_statement)
    ),

    numeric_for_loop_range: $ => seq(
      $._expression,
      '..',
      $._expression
    ),

    forall_statement: $ => seq(
      make_keyword('FORALL'),
      $.identifier,
      make_keyword('IN'),
      choice(
        // Range like i IN 1..10
        $.numeric_for_loop_range,
        // Collection range like i IN arr.FIRST..arr.LAST
        seq(
          $.qualified_identifier,
          '..',
          $.qualified_identifier
        ),
        // Collection indices like i IN INDICES OF arr
        seq(
          make_keyword('INDICES'),
          make_keyword('OF'),
          $.qualified_identifier
        )
      ),
      $.sql_statement
    ),

    return_statement: $ => seq(
      make_keyword('RETURN'),
      optional($._expression),
      ';'
    ),

    raise_statement: $ => seq(
      make_keyword('RAISE'),
      optional($.qualified_identifier),
      ';'
    ),

    call_statement: $ => seq(
      $.qualified_identifier,
      optional($.argument_list),
      ';'
    ),

    null_statement: $ => seq(
      make_keyword('NULL'),
      ';'
    ),

    // Conditional Compilation Directives ($IF, $THEN, $ELSE, $END)
    conditional_compilation_directive: $ => seq(
      '$IF',
      $._expression,
      '$THEN',
      repeat(choice($._statement, $._declaration)),
      optional(seq(
        '$ELSE',
        repeat(choice($._statement, $._declaration))
      )),
      '$END'
    ),

    // Anonymous block (statement within procedures/functions)
    anonymous_block: $ => seq(
      optional(seq(make_keyword('DECLARE'), repeat($._declaration))),
      make_keyword('BEGIN'),
      repeat($.annotated_statement),
      optional($.exception_section),
      make_keyword('END'),
      ';'
    ),

    exception_section: $ => seq(
      make_keyword('EXCEPTION'),
      repeat1($.exception_handler)
    ),

    exception_handler: $ => seq(
      make_keyword('WHEN'),
      choice(
        $.identifier,
        make_keyword('OTHERS')
      ),
      make_keyword('THEN'),
      repeat($._statement)
    ),

    // SQL Statements
    sql_statement: $ => choice(
      $.select_statement_standalone,
      $.insert_statement,
      $.update_statement,
      $.delete_statement,
      $.merge_statement,
      $.commit_statement,
      $.rollback_statement
    ),

    select_statement_standalone: $ => seq(
      $.select_statement,
      ';'
    ),

    select_statement: $ => prec.right(seq(
      choice(
        $.union_statement,
        $.basic_select_statement
      ),
      optional(seq(make_keyword('ORDER'), optional(make_keyword('SIBLINGS')), make_keyword('BY'), comma_list($.order_by_item)))
    )),

    union_statement: $ => prec.left(seq(
      $.basic_select_statement,
      repeat1(seq(
        choice(
          make_keyword('UNION'),
          seq(make_keyword('UNION'), make_keyword('ALL'))
        ),
        $.basic_select_statement
      ))
    )),

    basic_select_statement: $ => seq(
      optional($.with_clause),
      make_keyword('SELECT'),
      optional(make_keyword('DISTINCT')),
      $.select_list,
      seq(make_keyword('FROM'), $.table_expression),
      optional($.where_clause),
      optional($.hierarchical_clause),
      optional(seq(make_keyword('GROUP'), make_keyword('BY'), comma_list($._expression))),
      optional(seq(make_keyword('HAVING'), $._expression)),
      optional($.for_update_clause)
    ),

    // PL/SQL SELECT INTO statement
    select_into_statement: $ => seq(
      optional($.with_clause),
      make_keyword('SELECT'),
      optional(make_keyword('DISTINCT')),
      $.select_list,
      choice(
        // Regular INTO
        seq(make_keyword('INTO'), comma_list($.qualified_identifier)),
        // BULK COLLECT INTO
        seq(
          make_keyword('BULK'),
          make_keyword('COLLECT'),
          make_keyword('INTO'),
          comma_list($.qualified_identifier),
          optional(seq(make_keyword('LIMIT'), $._expression))
        )
      ),
      seq(make_keyword('FROM'), $.table_expression),
      optional($.where_clause),
      optional($.hierarchical_clause),
      optional(seq(make_keyword('GROUP'), make_keyword('BY'), comma_list($._expression))),
      optional(seq(make_keyword('HAVING'), $._expression)),
      optional(seq(make_keyword('ORDER'), optional(make_keyword('SIBLINGS')), make_keyword('BY'), comma_list($.order_by_item))),
      ';'
    ),

    // FOR UPDATE clause for cursors and SELECT statements
    for_update_clause: $ => seq(
      make_keyword('FOR'),
      make_keyword('UPDATE'),
      optional(seq(make_keyword('OF'), comma_list($.qualified_identifier))),
      optional(choice(
        make_keyword('NOWAIT'),
        seq(make_keyword('WAIT'), $._expression)
      ))
    ),

    // Hierarchical query clauses
    start_with_clause: $ => seq(make_keyword('START'), make_keyword('WITH'), $._expression),

    connect_by_clause: $ => seq(
      make_keyword('CONNECT'), make_keyword('BY'),
      optional(make_keyword('NOCYCLE')),
      $._expression
    ),

    // Hierarchical clause supports both orders: START WITH...CONNECT BY or CONNECT BY...START WITH
    hierarchical_clause: $ => choice(
      seq($.start_with_clause, $.connect_by_clause),
      seq($.connect_by_clause, $.start_with_clause),
      $.start_with_clause,
      $.connect_by_clause
    ),

    with_clause: $ => seq(
      make_keyword('WITH'),
      comma_list($.common_table_expression)
    ),

    common_table_expression: $ => seq(
      $.identifier,
      make_keyword('AS'),
      '(',
      $.select_statement,
      ')'
    ),

    select_list: $ => choice(
      '*',
      comma_list($.select_item)
    ),

    select_item: $ => seq(
      choice(
        $._expression,
        $.qualified_wildcard  // Support for table_alias.*
      ),
      optional($.column_alias)
    ),

    qualified_wildcard: $ => seq($.identifier, '.', '*'),

    column_alias: $ => choice(
      $.identifier,
      seq(make_keyword('AS'), $.identifier)
    ),

    // Table expressions with proper JOIN precedence
    table_expression: $ => prec.right(seq(
      $.table_reference,
      repeat(choice(
        // Implicit join (comma-separated) - lower precedence
        seq(',', $.table_reference),
        // Explicit joins - higher precedence
        prec(2, $.join_clause)
      ))
    )),

    table_reference: $ => seq(
      $.table_source,
      optional($.table_alias)
    ),

    table_source: $ => choice(
      $.table_name,
      $.subquery,
      $.table_function_call
    ),

    table_name: $ => $.qualified_identifier,

    subquery: $ => wrapped_in_parenthesis($.select_statement),

    table_function_call: $ => seq(
      make_keyword('TABLE'),
      wrapped_in_parenthesis($._expression)
    ),

    table_alias: $ => choice(
      $.identifier,
      seq(make_keyword('AS'), $.identifier)
    ),

    // JOIN clauses with proper precedence
    join_clause: $ => prec(3, choice(
      // Standard JOINs with ON clause
      seq(
        join_type($),
        $.table_reference,
        make_keyword('ON'),
        $._expression
      ),
      // CROSS JOIN (no ON clause)
      seq(
        make_keyword('CROSS'),
        make_keyword('JOIN'),
        $.table_reference
      ),
      // APPLY operations
      seq(
        apply_type(),
        $.apply_target
      )
    )),

    apply_target: $ => prec(1, choice(
      $.table_reference,
      seq($.subquery, optional($.table_alias))
    )),

    order_by_item: $ => seq(
      $._expression,
      optional(choice(make_keyword('ASC'), make_keyword('DESC')))
    ),

    insert_statement: $ => seq(
      make_keyword('INSERT'),
      make_keyword('INTO'),
      $.qualified_identifier,
      optional(paren_list($.identifier)),
      choice(
        seq(make_keyword('VALUES'), paren_list($._expression)),
        $.select_statement
      ),
      ';'
    ),

    update_statement: $ => seq(
      make_keyword('UPDATE'),
      $.qualified_identifier,
      make_keyword('SET'),
      comma_list($.assignment_clause),
      optional($.where_clause),
      ';'
    ),

    assignment_clause: $ => seq(
      $.qualified_identifier,
      '=',
      $._expression
    ),

    delete_statement: $ => seq(
      make_keyword('DELETE'),
      make_keyword('FROM'),
      $.qualified_identifier,
      optional($.where_clause),
      ';'
    ),

    // WHERE clause that supports both regular expressions and CURRENT OF
    where_clause: $ => seq(
      make_keyword('WHERE'),
      choice(
        $._expression,
        $.current_of_clause
      )
    ),

    // CURRENT OF clause for positioned updates/deletes
    current_of_clause: $ => seq(
      make_keyword('CURRENT'),
      make_keyword('OF'),
      $.identifier
    ),

    merge_statement: $ => seq(
      make_keyword('MERGE'),
      make_keyword('INTO'),
      $.qualified_identifier,
      optional($.identifier), // table alias for target table
      make_keyword('USING'),
      choice(
        seq($.qualified_identifier, optional($.identifier)), // table with optional alias
        seq($.subquery, optional($.identifier)) // subquery with optional alias
      ),
      make_keyword('ON'),
      $._expression,
      repeat1(choice($.when_matched_clause, $.when_not_matched_clause)),
      ';'
    ),

    when_matched_clause: $ => seq(
      make_keyword('WHEN'),
      make_keyword('MATCHED'),
      make_keyword('THEN'),
      choice(
        seq(make_keyword('UPDATE'), make_keyword('SET'), comma_list($.assignment_clause)),
        make_keyword('DELETE')
      )
    ),

    when_not_matched_clause: $ => seq(
      make_keyword('WHEN'),
      make_keyword('NOT'),
      make_keyword('MATCHED'),
      make_keyword('THEN'),
      make_keyword('INSERT'),
      optional(paren_list($.identifier)),
      make_keyword('VALUES'),
      paren_list($._expression)
    ),

    commit_statement: $ => seq(make_keyword('COMMIT'), ';'),
    rollback_statement: $ => seq(make_keyword('ROLLBACK'), ';'),

    // Expressions
    _expression: $ => choice(
      $.member_access,
      $.binary_expression,
      $.unary_expression,
      $.exists_expression,
      $.prior_expression,
      $.function_call,
      $.extract_function,
      $.qualified_identifier,
      $.literal,
      $.cursor_attribute,
      $.case_expression,
      $.subquery,
      wrapped_in_parenthesis($._expression)
    ),

    member_access: $ => prec.left(10, seq(
      choice(
        $.function_call,
        $.qualified_identifier,
        wrapped_in_parenthesis($._expression)
      ),
      repeat1(seq('.', $.identifier))
    )),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, choice('OR', make_keyword('OR')), $._expression)),
      prec.left(2, seq($._expression, make_keyword('AND'), $._expression)),
      prec.right(3, seq($._expression, choice(make_keyword('BETWEEN'), seq(make_keyword('NOT'), make_keyword('BETWEEN'))), $._expression, make_keyword('AND'), $._expression)),
      prec.left(3, seq($._expression, choice('=', '!=', '<>', '<', '<=', '>', '>='), $._expression)),
      prec.left(3, seq($._expression, choice(make_keyword('LIKE'), seq(make_keyword('NOT'), make_keyword('LIKE'))), $._expression, optional(seq(make_keyword('ESCAPE'), $._expression)))),
      prec.left(3, seq($._expression, choice(make_keyword('IN'), seq(make_keyword('NOT'), make_keyword('IN'))),
        choice(paren_list($._expression), $.subquery))),
      prec.left(3, seq($._expression, choice(make_keyword('IS'), seq(make_keyword('IS'), make_keyword('NOT'))), make_keyword('NULL'))),
      prec.left(4, seq($._expression, choice('+', '-'), $._expression)),
      prec.left(5, seq($._expression, choice('*', '/', '%', make_keyword('MOD')), $._expression)),
      prec.left(6, seq($._expression, '||', $._expression)),
    ),

    unary_expression: $ => choice(
      prec(7, seq(choice('+', '-', make_keyword('NOT')), $._expression)),
    ),

    function_call: $ => seq(
      $.qualified_identifier,
      choice(
        $.argument_list,
        seq('(', '*', ')') // For aggregate functions like COUNT(*)
      ),
      optional($.over_clause) // Window function support
    ),

    // EXISTS predicate for subqueries
    exists_expression: $ => seq(
      make_keyword('EXISTS'),
      $.subquery
    ),

    // PRIOR expression for hierarchical queries
    prior_expression: $ => seq(
      make_keyword('PRIOR'),
      $._expression
    ),

    // Support for both positional and named parameters, including empty parameter list
    argument_list: $ => wrapped_in_parenthesis(
      comma_list(choice(
        $.named_argument,
        $._expression  // Positional argument
      ), false)
    ),

    // Named parameter: param_name => value
    named_argument: $ => seq(
      choice($.identifier, $.quoted_identifier),
      '=>',
      $._expression
    ),

    extract_function: $ => seq(
      make_keyword('EXTRACT'),
      '(',
      choice(
        make_keyword('YEAR'),
        make_keyword('MONTH'),
        make_keyword('DAY'),
        make_keyword('HOUR'),
        make_keyword('MINUTE'),
        make_keyword('SECOND')
      ),
      make_keyword('FROM'),
      $._expression,
      ')'
    ),

    over_clause: $ => seq(
      make_keyword('OVER'),
      '(',
      optional(seq(make_keyword('PARTITION'), make_keyword('BY'), comma_list($._expression))),
      optional(seq(make_keyword('ORDER'), make_keyword('BY'), comma_list($.order_by_item))),
      ')'
    ),

    cursor_attribute: $ => seq(
      $.identifier,
      '%',
      choice(
        make_keyword('FOUND'),
        make_keyword('NOTFOUND'),
        make_keyword('ISOPEN'),
        make_keyword('ROWCOUNT')
      )
    ),

    case_expression: $ => choice(
      // Simple CASE expression (SQL) - ends with END CASE
      seq(
        make_keyword('CASE'),
        $._expression,
        repeat1($.when_condition_clause),
        optional($.else_expression_clause),
        make_keyword('END'),
        make_keyword('CASE')
      ),
      // Searched CASE expression (SQL) - ends with END CASE
      seq(
        make_keyword('CASE'),
        repeat1($.when_condition_clause),
        optional($.else_expression_clause),
        make_keyword('END'),
        make_keyword('CASE')
      )
    ),

    // PL/SQL CASE statement - ends with just END
    case_statement: $ => choice(
      // Simple CASE statement (PL/SQL)
      seq(
        make_keyword('CASE'),
        $._expression,
        repeat1($.when_statement_clause),
        optional($.else_statement_clause),
        make_keyword('END'),
        make_keyword('CASE'),
        ';'
      ),
      // Searched CASE statement (PL/SQL)
      seq(
        make_keyword('CASE'),
        repeat1($.when_statement_clause),
        optional($.else_statement_clause),
        make_keyword('END'),
        make_keyword('CASE'),
        ';'
      )
    ),

    when_condition_clause: $ => seq(
      make_keyword('WHEN'),
      $._expression,
      make_keyword('THEN'),
      $._expression
    ),

    else_expression_clause: $ => seq(
      make_keyword('ELSE'),
      $._expression
    ),

    // PL/SQL CASE statement clauses
    when_statement_clause: $ => seq(
      make_keyword('WHEN'),
      $._expression,
      make_keyword('THEN'),
      repeat($._statement)
    ),

    else_statement_clause: $ => seq(
      make_keyword('ELSE'),
      repeat($._statement)
    ),

    // EXECUTE IMMEDIATE statement for dynamic SQL
    execute_immediate_statement: $ => seq(
      make_keyword('EXECUTE'),
      make_keyword('IMMEDIATE'),
      $._expression, // SQL string
      optional(seq(
        optional(make_keyword('BULK')),
        make_keyword('COLLECT'),
        make_keyword('INTO'),
        comma_list($.qualified_identifier),
        optional(seq(make_keyword('LIMIT'), $._expression))
      )),
      optional(seq(
        make_keyword('INTO'),
        comma_list($.qualified_identifier)
      )),
      optional(seq(
        make_keyword('USING'),
        comma_list(seq(
          optional(choice(make_keyword('IN'), make_keyword('OUT'), seq(make_keyword('IN'), make_keyword('OUT')))),
          $._expression
        ))
      )),
      optional(seq(
        make_keyword('RETURNING'),
        make_keyword('INTO'),
        comma_list($.qualified_identifier)
      )),
      ';'
    ),

    // Cursor operations
    open_cursor_statement: $ => seq(
      make_keyword('OPEN'),
      $.qualified_identifier,
      choice(
        // OPEN cursor_name(params)
        optional(paren_list($._expression, false)),
        // OPEN cursor_name FOR select_statement
        seq(make_keyword('FOR'), $.select_statement),
        // OPEN cursor_name FOR dynamic_sql_string USING params
        seq(make_keyword('FOR'), $._expression, optional(seq(make_keyword('USING'), comma_list($._expression))))
      ),
      ';'
    ),

    fetch_cursor_statement: $ => seq(
      make_keyword('FETCH'),
      $.qualified_identifier,
      choice(
        seq(make_keyword('INTO'), comma_list($.qualified_identifier)),
        seq(
          optional(make_keyword('BULK')),
          make_keyword('COLLECT'),
          make_keyword('INTO'),
          comma_list($.qualified_identifier),
          optional(seq(make_keyword('LIMIT'), $._expression))
        )
      ),
      ';'
    ),

    close_cursor_statement: $ => seq(
      make_keyword('CLOSE'),
      $.qualified_identifier,
      ';'
    ),

    exit_statement: $ => seq(
      make_keyword('EXIT'),
      optional($.identifier), // loop label
      optional(seq(make_keyword('WHEN'), $._expression)),
      ';'
    ),

    continue_statement: $ => seq(
      make_keyword('CONTINUE'),
      optional($.identifier), // loop label
      optional(seq(make_keyword('WHEN'), $._expression)),
      ';'
    ),

    label_statement: $ => seq(
      '<<',
      $.identifier,
      '>>'
    ),

    goto_statement: $ => seq(
      make_keyword('GOTO'),
      $.identifier,
      ';'
    ),

    // Literals and identifiers
    literal: $ => choice(
      $.string_literal,
      $.number,
      $.boolean_literal,
      make_keyword('NULL')
    ),

    string_literal: $ =>
      /'(?:''|[^'])*'/,

    number: $ => /\d+(\.\d+)?([eE][+-]?\d+)?/,

    boolean_literal: $ => choice(
      make_keyword('TRUE'),
      make_keyword('FALSE')
    ),

    qualified_identifier: $ => prec.right(seq(
      $.identifier,
      repeat(seq('.', $.identifier))
    )),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_$#]*/,

    quoted_identifier: $ => /"[^"]+"/,

    // Annotations (IFS-specific)
    annotation: $ => prec.right(seq(
      '@',
      $.identifier,
      optional(seq('(', /[^)]*/, ')'))  // Optional parameters as raw text
    )),

    // Comments
    comment: $ => choice(
      seq('--', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    ),
  }
});
