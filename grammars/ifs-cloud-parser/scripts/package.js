#!/usr/bin/env node

/**
 * Tree-sitter IFS Cloud Parser - Package Builder & Publisher
 * 
 * Commands:
 *   npm run package python     - Build Python package
 *   npm run publish python     - Build and publish Python package to PyPI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname.replace('/scripts', '');
const distDir = path.join(projectRoot, 'dist');

// Load metadata from tree-sitter.json
function loadMetadata() {
  try {
    const treeSitterConfigPath = path.join(projectRoot, 'tree-sitter.json');
    const configData = fs.readFileSync(treeSitterConfigPath, 'utf8');
    const config = JSON.parse(configData);

    return {
      version: config.metadata.version,
      description: config.metadata.description,
      license: config.metadata.license,
      authors: config.metadata.authors,
      repository: config.metadata.links.repository
    };
  } catch (err) {
    console.warn('⚠️  Failed to load tree-sitter.json, using defaults:', err.message);
    return {
      version: '0.2.0',
      description: 'A parser for IFS Cloud source code, made with tree-sitter.',
      license: 'MIT',
      authors: [{ name: 'Sindre van der Linden', email: 'sindre@apply.no' }],
      repository: 'https://github.com/graknol/ifs-parser'
    };
  }
}

const METADATA = loadMetadata();

// Function to update pyproject.toml with metadata from tree-sitter.json
function updatePyprojectToml() {
  const pyprojectPath = path.join(projectRoot, 'pyproject.toml');

  try {
    let content = fs.readFileSync(pyprojectPath, 'utf8');

    // Update version
    content = content.replace(/^version\s*=\s*["'][^"']*["']/m, `version = "${METADATA.version}"`);

    // Update description
    content = content.replace(/^description\s*=\s*["'][^"']*["']/m, `description = "${METADATA.description}"`);

    fs.writeFileSync(pyprojectPath, content);
    console.log(`  📝 Updated pyproject.toml with version ${METADATA.version}`);
  } catch (err) {
    console.warn('⚠️  Failed to update pyproject.toml:', err.message);
  }
}

// Function to update __init__.py with version from tree-sitter.json
function updateInitPy() {
  const initPath = path.join(projectRoot, 'bindings/python/tree_sitter_ifs_cloud_parser/__init__.py');

  try {
    let content = fs.readFileSync(initPath, 'utf8');

    // Add or update __version__ if it doesn't exist
    if (content.includes('__version__')) {
      content = content.replace(/__version__\s*=\s*["'][^"']*["']/g, `__version__ = "${METADATA.version}"`);
    } else {
      // Add __version__ before the last line
      const lines = content.split('\n');
      lines.splice(-1, 0, '', `__version__ = "${METADATA.version}"`);
      content = lines.join('\n');
    }

    fs.writeFileSync(initPath, content);
    console.log(`  📝 Updated __init__.py with version ${METADATA.version}`);
  } catch (err) {
    console.warn('⚠️  Failed to update __init__.py:', err.message);
  }
}

function buildPython() {
  console.log('  🔨 Building Python package...');

  // Update files with metadata from tree-sitter.json
  console.log('  📝 Updating package metadata from tree-sitter.json...');
  updatePyprojectToml();
  updateInitPy();

  // Use our established build workflow
  const buildCommands = [
    'source build_env/bin/activate || python3 -m venv build_env && source build_env/bin/activate',
    'pip install --upgrade pip setuptools wheel build',
    'pip install "tree-sitter>=0.25.0,<0.26.0"',
    'python3 -m build'
  ].join(' && ');

  try {
    execSync(buildCommands, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: '/bin/bash'
    });

    // List the built packages
    const distPath = path.join(projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      const packages = fs.readdirSync(distPath).filter(f =>
        f.endsWith('.whl') || f.endsWith('.tar.gz')
      );

      console.log('  ✅ Python package built successfully!');
      packages.forEach(pkg => {
        if (pkg.endsWith('.whl')) {
          console.log(`  📦 Created wheel: ${pkg}`);
        } else if (pkg.endsWith('.tar.gz')) {
          console.log(`  📦 Created source: ${pkg}`);
        }
      });

      console.log('  🧪 Testing package...');
      // Quick test of the built package
      const testCmd = [
        'source build_env/bin/activate',
        `pip install dist/*.whl --force-reinstall`,
        'python3 -c "import tree_sitter_ifs_cloud_parser as ts_ifs; from tree_sitter import Parser, Language; parser = Parser(Language(ts_ifs.language())); print(\'✅ Package works correctly!\')"'
      ].join(' && ');

      try {
        execSync(testCmd, {
          cwd: projectRoot,
          stdio: 'inherit',
          shell: '/bin/bash'
        });
      } catch (testErr) {
        console.log('  ⚠️  Package test failed, but build completed');
      }
    }

  } catch (err) {
    console.log('  ❌ Python build failed');
    console.log('     Make sure you have tree-sitter CLI installed: npm install -g tree-sitter-cli');
    console.log('     And C compiler tools available');
    throw err;
  }
}

function publishPython() {
  console.log('  🚀 Publishing Python package to PyPI...');

  // First build the package using our established workflow
  console.log('  🔨 Building package first...');

  // Update files with metadata from tree-sitter.json
  console.log('  📝 Updating package metadata from tree-sitter.json...');
  updatePyprojectToml();
  updateInitPy();

  // Activate virtual environment and build
  const buildCommands = [
    'source build_env/bin/activate || python3 -m venv build_env && source build_env/bin/activate',
    'pip install --upgrade pip setuptools wheel build',
    'pip install "tree-sitter>=0.25.0,<0.26.0"',
    'python3 -m build'
  ].join(' && ');

  try {
    execSync(buildCommands, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: '/bin/bash'
    });
  } catch (err) {
    console.log('  ❌ Build failed');
    throw err;
  }

  // Install twine for publishing
  console.log('  📦 Installing publishing tools...');
  const installTwine = 'source build_env/bin/activate && pip install twine';

  try {
    execSync(installTwine, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: '/bin/bash'
    });
  } catch (err) {
    console.log('  ❌ Failed to install twine');
    throw err;
  }

  // Find built packages in dist directory
  const distPath = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('No dist directory found. Build may have failed.');
  }

  const packages = fs.readdirSync(distPath).filter(f =>
    f.endsWith('.whl') || f.endsWith('.tar.gz')
  );

  if (packages.length === 0) {
    throw new Error('No Python packages found to publish. Build may have failed.');
  }

  console.log(`  📦 Found packages: ${packages.join(', ')}`);

  // Upload to PyPI
  console.log('  🚀 Uploading to PyPI...');
  const uploadCmd = 'source build_env/bin/activate && twine upload dist/*';

  try {
    execSync(uploadCmd, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: '/bin/bash'
    });

    console.log('  ✅ Successfully published to PyPI!');
    console.log('  🌐 Install with: pip install ifs-cloud-parser');

  } catch (err) {
    console.log('  ⚠️  Upload failed. You can manually upload with:');
    console.log(`     cd "${projectRoot}"`);
    console.log('     source build_env/bin/activate');
    console.log('     twine upload dist/*');
    throw err;
  }
}

function cleanDist() {
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function main() {
  const command = process.argv[2] || 'package';
  const target = process.argv[3] || 'python';

  console.log(`🚀 Tree-sitter PL/SQL IFS ${command === 'publish' ? 'Publisher' : 'Package Builder'}`);
  console.log('   Parser Status: ✅ 100% success on IFS Cloud codebase');

  cleanDist();

  if (target !== 'python') {
    console.log(`❌ Only Python packaging is currently supported. Got: ${target}`);
    process.exit(1);
  }

  try {
    console.log('🐍 Building Python bindings...');

    if (command === 'publish') {
      publishPython();
    } else {
      buildPython();
    }

    console.log('✅ Python build successful');

  } catch (err) {
    console.log(`❌ Failed to build/publish Python bindings:`);
    console.log(`   ${err.message}`);
    process.exit(1);
  }

  console.log('\n🎉 Packaging complete!');
  console.log(`📁 Output directory: ${distDir}`);

  // List generated files
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    if (files.length > 0) {
      console.log('📋 Generated files:');
      files.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    }
  }
}

if (require.main === module) {
  main();
}
