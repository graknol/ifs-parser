// Placeholder external scanner for IFS PL/SQL
// This handles complex tokenization that can't be expressed in the grammar

#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  NONE,
};

void *tree_sitter_plsql_ifs_external_scanner_create() {
  return NULL;
}

void tree_sitter_plsql_ifs_external_scanner_destroy(void *payload) {
}

unsigned tree_sitter_plsql_ifs_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_plsql_ifs_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
}

bool tree_sitter_plsql_ifs_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  return false;
}
