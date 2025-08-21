// Incremental parsing utilities for LSP performance

use crate::parser::ast::*;
use std::collections::HashMap;
use std::ops::Range;

/// Represents a cached parse tree node with its text range
#[derive(Debug, Clone)]
pub struct CachedNode {
    pub node: AstNode,
    pub text_range: Range<usize>,
    pub checksum: u64,                   // Hash of the source text for this node
    pub dependencies: Vec<Range<usize>>, // Other ranges this node depends on
}

/// Incremental parser that reuses unchanged nodes
pub struct IncrementalParser {
    /// Cache of previously parsed nodes indexed by their text range
    node_cache: HashMap<Range<usize>, CachedNode>,
    /// Current source text
    source_text: String,
    /// Dirty ranges that need reparsing
    dirty_ranges: Vec<Range<usize>>,
}

impl IncrementalParser {
    pub fn new() -> Self {
        Self {
            node_cache: HashMap::new(),
            source_text: String::new(),
            dirty_ranges: Vec::new(),
        }
    }

    /// Update source text and mark changed ranges as dirty
    pub fn update_text(&mut self, new_text: String, changes: Vec<TextChange>) {
        // Calculate which ranges are affected by the changes
        for change in changes {
            self.mark_dirty_range(change.range);

            // Mark dependent ranges as dirty too
            self.invalidate_dependent_ranges(&change.range);
        }

        self.source_text = new_text;
    }

    /// Parse incrementally, reusing cached nodes where possible
    pub fn parse(&mut self) -> Result<AstNode, ParseError> {
        // 1. Identify which top-level constructs (procedures, functions)
        //    are in dirty ranges
        let dirty_constructs = self.find_dirty_constructs()?;

        // 2. Reparse only the dirty constructs
        let mut updated_nodes = Vec::new();
        for construct_range in dirty_constructs {
            let node = self.parse_range(construct_range)?;
            updated_nodes.push(node);
        }

        // 3. Merge with cached nodes
        self.merge_with_cache(updated_nodes)
    }

    fn mark_dirty_range(&mut self, range: Range<usize>) {
        self.dirty_ranges.push(range.clone());

        // Remove any cached nodes that overlap with this range
        self.node_cache
            .retain(|cached_range, _| !ranges_overlap(cached_range, &range));
    }
}

#[derive(Debug, Clone)]
pub struct TextChange {
    pub range: Range<usize>,
    pub new_text: String,
}
