package tree_sitter_ifs_cloud_parser_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ifs_cloud_parser "github.com/graknol/ifs-parser/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ifs_cloud_parser.Language())
	if language == nil {
		t.Errorf("Error loading IFS Cloud Parser grammar")
	}
}
