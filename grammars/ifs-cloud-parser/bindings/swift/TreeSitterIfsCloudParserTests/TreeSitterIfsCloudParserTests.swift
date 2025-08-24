import XCTest
import SwiftTreeSitter
import TreeSitterIfsCloudParser

final class TreeSitterIfsCloudParserTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ifs_cloud_parser())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading IFS Cloud Parser grammar")
    }
}
