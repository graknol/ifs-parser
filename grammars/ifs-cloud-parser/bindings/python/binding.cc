#include <pybind11/pybind11.h>
#include <tree_sitter/api.h>

extern "C" TSLanguage *tree_sitter_ifs_cloud_parser();

namespace py = pybind11;

PYBIND11_MODULE(ifs_cloud_parser, m) {
    m.doc() = "IFS Cloud PL/SQL Tree-sitter parser";
    
    m.def("language", &tree_sitter_ifs_cloud_parser, 
          "Get the Tree-sitter Language object for IFS Cloud PL/SQL");
          
    // Add version info
    m.attr("__version__") = "0.2.0";
    m.attr("LANGUAGE_VERSION") = py::cast(tree_sitter_language_version(tree_sitter_ifs_cloud_parser()));
}
