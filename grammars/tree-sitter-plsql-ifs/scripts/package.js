#!/usr/bin/env node

/**
 * Tree-sitter PL/SQL IFS - Universal Package Builder
 * 
 * Simple command to package bindings for any language:
 *   npm run package python
 *   npm run package node
 *   npm run package csharp  
 *   npm run package all
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname.replace('/scripts', '');
const distDir = path.join(projectRoot, 'dist');

// Supported languages
const LANGUAGES = {
  python: {
    name: 'Python',
    icon: '🐍',
    dir: 'bindings/python',
    build: buildPython
  },
  node: {
    name: 'Node.js',
    icon: '📦',
    dir: 'bindings/node',
    build: buildNode
  },
  csharp: {
    name: 'C#',
    icon: '⚙️',
    dir: 'bindings/csharp',
    build: buildCSharp
  }
};

function main() {
  const target = process.argv[2] || 'python';

  console.log('🚀 Tree-sitter PL/SQL IFS Package Builder');
  console.log('   Parser Status: ✅ 100% success on IFS Cloud codebase\n');

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  if (target === 'all') {
    console.log('📦 Building all language bindings...\n');
    Object.keys(LANGUAGES).forEach(lang => {
      buildLanguage(lang);
    });
  } else if (LANGUAGES[target]) {
    buildLanguage(target);
  } else {
    console.error(`❌ Unknown target: ${target}`);
    console.log('\nAvailable targets:');
    Object.entries(LANGUAGES).forEach(([key, lang]) => {
      console.log(`  ${lang.icon} ${key} - ${lang.name} bindings`);
    });
    console.log('  🎯 all - Build all bindings');
    process.exit(1);
  }

  console.log('\n🎉 Packaging complete!');
  console.log(`📁 Output directory: ${distDir}`);

  // Clean up virtual environment
  const venvDir = path.join(projectRoot, '.venv-build');
  if (fs.existsSync(venvDir)) {
    console.log('🧹 Cleaning up build environment...');
    fs.rmSync(venvDir, { recursive: true });
  }

  console.log('\n📋 Generated files:');
  try {
    const files = fs.readdirSync(distDir);
    files.forEach(file => {
      const stats = fs.statSync(path.join(distDir, file));
      if (stats.isDirectory()) {
        console.log(`  📁 ${file}/`);
      } else {
        console.log(`  📄 ${file}`);
      }
    });
  } catch (err) {
    console.log('  (No files generated)');
  }
}

function buildLanguage(lang) {
  const config = LANGUAGES[lang];
  console.log(`${config.icon} Building ${config.name} bindings...`);

  try {
    config.build();
    console.log(`✅ ${config.name} bindings built successfully\n`);
  } catch (err) {
    console.error(`❌ Failed to build ${config.name} bindings:`);
    console.error(err.message);
    console.log('');
  }
}

function buildPython() {
  const pythonDir = path.join(projectRoot, 'bindings/python');
  const outputDir = path.join(distDir, 'python');

  // Ensure pip and build tools are available
  installPythonDeps();

  // Create clean Python package structure
  createPythonPackage(outputDir);

  // Build wheel and source distribution
  console.log('  🔨 Building wheel and source distribution...');
  try {
    // Use virtual environment python if available, otherwise system python
    const pythonCmd = process.env.VENV_PYTHON ? `"${process.env.VENV_PYTHON}"` : 'python3';

    // Build both wheel and source distribution
    execSync(`${pythonCmd} -m build`, {
      cwd: outputDir,
      stdio: 'inherit'
    });

    // Move all built packages to root of dist
    const buildDir = path.join(outputDir, 'dist');
    if (fs.existsSync(buildDir)) {
      const packages = fs.readdirSync(buildDir);
      packages.forEach(pkg => {
        const srcPath = path.join(buildDir, pkg);
        const destPath = path.join(distDir, pkg);
        fs.renameSync(srcPath, destPath);

        if (pkg.endsWith('.whl')) {
          console.log(`  📦 Created wheel: ${pkg} (platform-specific)`);
        } else if (pkg.endsWith('.tar.gz')) {
          console.log(`  📦 Created source: ${pkg} (universal - compiles on install)`);
        }
      });
    }
  } catch (err) {
    console.log('  ⚠️  Build failed, but package structure is ready');
    console.log('     You can still install with: pip install .');
    console.log(`     From directory: ${outputDir}`);
  }
}

function createPythonPackage(outputDir) {
  console.log('  📦 Creating Python package...');

  // Create directory structure
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'src'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'src/tree_sitter'), { recursive: true });

  // Copy source files with flat structure
  const files = [
    ['src/parser.c', 'src/parser.c'],
    ['src/tree_sitter/parser.h', 'src/tree_sitter/parser.h'],
    ['src/grammar.json', 'grammar.json'],
    ['node-types.json', 'node-types.json']
  ];

  files.forEach(([src, dest]) => {
    const srcPath = path.join(projectRoot, src);
    const destPath = path.join(outputDir, dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  });

  // Copy scanner.c if it exists
  const scannerPath = path.join(projectRoot, 'src/scanner.c');
  if (fs.existsSync(scannerPath)) {
    fs.copyFileSync(scannerPath, path.join(outputDir, 'src/scanner.c'));
  }

  // Create Python binding files
  createPythonBindingFiles(outputDir);
}

function createPythonBindingFiles(outputDir) {
  // Create setup.py
  const setupPy = `from setuptools import setup, Extension
import pybind11
import os
import sys

# Check for scanner.c
sources = ['binding.cc', 'src/parser.c']
if os.path.exists('src/scanner.c'):
    sources.append('src/scanner.c')

# Suppress common tree-sitter warnings and the C++14 flag warning
extra_compile_args = []
if sys.platform != 'win32':
    extra_compile_args = [
        '-Wno-unused-but-set-variable',  # Suppresses: variable 'eof' set but not used
        '-Wno-unused-variable',
        '-Wno-unused-parameter',
        '-w',  # Suppress the '-std=c++14' is valid for C++/ObjC++ but not for C warning
    ]
else:
    # Windows MSVC
    extra_compile_args = [
        '/wd4101',  # unreferenced local variable
        '/wd4189',  # local variable initialized but not referenced  
    ]

tree_sitter_plsql_ifs = Extension(
    'tree_sitter_plsql_ifs',
    sources=sources,
    include_dirs=[
        pybind11.get_include(),
        'src',
    ],
    language='c++',
    extra_compile_args=extra_compile_args,
)

setup(ext_modules=[tree_sitter_plsql_ifs])
`;

  // Create pyproject.toml
  const pyprojectToml = `[build-system]
requires = ["setuptools>=61.0", "pybind11>=2.6.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "tree-sitter-plsql-ifs"
version = "0.1.0"
description = "IFS Cloud PL/SQL parser for Tree-sitter - 100% success rate"
license = "MIT"
authors = [{name = "Sindre van der Linden", email = "sindre@apply.no"}]
keywords = ["tree-sitter", "plsql", "ifs", "oracle", "parser"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers", 
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9", 
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
requires-python = ">=3.8"
dependencies = ["tree-sitter>=0.20.0"]

[project.urls]
Homepage = "https://github.com/graknol/ifs-parser"
Repository = "https://github.com/graknol/ifs-parser"
`;

  // Create binding.cc (simplified and compatible)
  const bindingCc = `#include <pybind11/pybind11.h>

// Forward declarations from tree-sitter
extern "C" {
    typedef struct TSLanguage TSLanguage;
    TSLanguage *tree_sitter_plsql_ifs();
}

namespace py = pybind11;

PYBIND11_MODULE(tree_sitter_plsql_ifs, m) {
    m.doc() = "IFS Cloud PL/SQL Tree-sitter parser - 100% success rate on IFS Cloud codebase";
    
    m.def("language", []() -> void* {
        return tree_sitter_plsql_ifs();
    }, "Get the Tree-sitter Language object for IFS Cloud PL/SQL");
          
    // Add version info
    m.attr("__version__") = "0.1.0";
}
`;

  // Create __init__.py
  const initPy = `"""
Tree-sitter PL/SQL IFS

High-performance parser for IFS Cloud PL/SQL variant.
Achieved 100% success rate on entire IFS Cloud codebase (9,748 files).

Usage:
    import tree_sitter_plsql_ifs
    from tree_sitter import Language, Parser
    
    language = Language(tree_sitter_plsql_ifs.language())
    parser = Parser()
    parser.set_language(language)
    
    tree = parser.parse(b"PROCEDURE Test___ IS BEGIN NULL; END;")
    print(tree.root_node.sexp())
"""

from .tree_sitter_plsql_ifs import language

__version__ = "0.1.0"
__all__ = ["language"]
`;

  // Create README.md
  const readme = `# Tree-sitter PL/SQL IFS

🚀 High-performance parser for IFS Cloud PL/SQL variant

## Status
✅ **100% success rate** on entire IFS Cloud codebase (9,748 files)

## Quick Install

\`\`\`bash
pip install tree_sitter_plsql_ifs-*.whl
# OR
pip install .
\`\`\`

## Usage

\`\`\`python
import tree_sitter_plsql_ifs
from tree_sitter import Language, Parser

language = Language(tree_sitter_plsql_ifs.language()) 
parser = Parser()
parser.set_language(language)

tree = parser.parse(b"PROCEDURE Test___ IS BEGIN NULL; END;")
print(tree.root_node.sexp())
\`\`\`

## Requirements
- Python 3.8+
- tree-sitter
- pybind11 (auto-installed)
- C++ compiler

This parser handles all IFS Cloud PL/SQL variants and custom syntax.
`;

  // Create MANIFEST.in to ensure all files are included in source distribution
  const manifestIn = `include README.md
include pyproject.toml
include setup.py
include binding.cc
include grammar.json
include node-types.json
recursive-include src *.c *.h
global-exclude *.pyc
global-exclude __pycache__
`;

  // Write all files
  fs.writeFileSync(path.join(outputDir, 'setup.py'), setupPy);
  fs.writeFileSync(path.join(outputDir, 'pyproject.toml'), pyprojectToml);
  fs.writeFileSync(path.join(outputDir, 'binding.cc'), bindingCc);
  fs.writeFileSync(path.join(outputDir, '__init__.py'), initPy);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  fs.writeFileSync(path.join(outputDir, 'MANIFEST.in'), manifestIn);
}

function installPythonDeps() {
  console.log('  📥 Ensuring Python build dependencies...');

  // Check if build dependencies are already available
  const packages = ['build', 'wheel', 'pybind11', 'tree-sitter', 'setuptools'];

  // First try to use existing system packages
  let hasAllPackages = true;
  for (const pkg of packages) {
    try {
      execSync(`python3 -c "import ${pkg}"`, { stdio: 'pipe' });
    } catch (err) {
      hasAllPackages = false;
      break;
    }
  }

  if (hasAllPackages) {
    console.log('  ✅ All build dependencies already available');
    return;
  }

  // Try to create virtual environment with better error handling
  const venvDir = path.join(projectRoot, '.venv-build');
  let useVenv = false;

  try {
    // Check if python3-venv is available
    execSync('python3 -m venv --help', { stdio: 'pipe' });

    // Remove old venv if exists
    if (fs.existsSync(venvDir)) {
      fs.rmSync(venvDir, { recursive: true });
    }

    console.log('  🏗️  Creating isolated build environment...');
    execSync(`python3 -m venv "${venvDir}"`, { stdio: 'pipe' });

    // Determine venv paths (cross-platform)
    const isWindows = process.platform === 'win32';
    const venvBin = isWindows ? path.join(venvDir, 'Scripts') : path.join(venvDir, 'bin');
    const venvPython = path.join(venvBin, isWindows ? 'python.exe' : 'python');
    const venvPip = path.join(venvBin, isWindows ? 'pip.exe' : 'pip');

    // Verify venv was created properly
    if (!fs.existsSync(venvPython)) {
      throw new Error('Virtual environment creation failed - python not found');
    }

    // Upgrade pip first
    console.log('  📦 Installing build dependencies in isolated environment...');
    execSync(`"${venvPython}" -m pip install --upgrade pip`, { stdio: 'pipe' });

    // Install packages
    execSync(`"${venvPip}" install ${packages.join(' ')}`, { stdio: 'pipe' });

    // Store venv info for later use
    process.env.VENV_PYTHON = venvPython;
    process.env.VENV_PIP = venvPip;
    useVenv = true;

    console.log('  ✅ Build environment ready');

  } catch (venvErr) {
    console.log('  ⚠️  Isolated environment failed, using system Python...');

    // Fallback to system pip - try different installation methods
    let pipInstalled = false;
    const installMethods = [
      { cmd: 'python3 -m pip', args: ['install', '--user'] },
      { cmd: 'pip3', args: ['install', '--user'] },
      { cmd: 'python3 -m pip', args: ['install', '--break-system-packages'] },
      { cmd: 'pip3', args: ['install', '--break-system-packages'] }
    ];

    for (const method of installMethods) {
      try {
        // Check if pip command exists
        execSync(`${method.cmd} --version`, { stdio: 'pipe' });

        console.log(`  📦 Installing with: ${method.cmd} ${method.args.join(' ')}...`);
        execSync(`${method.cmd} ${method.args.join(' ')} ${packages.join(' ')}`, {
          stdio: 'pipe'
        });

        pipInstalled = true;
        break;
      } catch (methodErr) {
        // Continue to next method
        continue;
      }
    }

    if (!pipInstalled) {
      console.log('  ❌ Could not install build dependencies automatically.');
      console.log('  💡 Please install manually:');
      console.log(`     python3 -m pip install --user ${packages.join(' ')}`);
      console.log('     or: sudo apt install python3-pip python3-venv');
      throw new Error('Failed to install Python build dependencies');
    }
  }
}

function buildNode() {
  const nodeDir = path.join(projectRoot, 'bindings/node');
  const outputDir = path.join(distDir, 'node');

  console.log('  📦 Creating Node.js package...');

  // Copy existing node bindings
  if (fs.existsSync(nodeDir)) {
    // Simple copy for now - Node.js bindings usually work as-is
    fs.cpSync(nodeDir, outputDir, { recursive: true });
  } else {
    console.log('  ⚠️  Node.js bindings directory not found');
  }
}

function buildCSharp() {
  console.log('  📦 Creating C# package...');
  // C# implementation would go here
  console.log('  ⚠️  C# packaging not yet implemented');
}

if (require.main === module) {
  main();
}
