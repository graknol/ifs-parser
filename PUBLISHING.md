# Publishing Guide

## Python Package Distribution (PyPI)

### One-Time Setup

1. **Create PyPI account**: https://pypi.org/account/register/
2. **Generate API token**: https://pypi.org/manage/account/token/
3. **Configure credentials** (choose one):

#### Option A: Environment Variables (Recommended)

```bash
export TWINE_USERNAME=__token__
export TWINE_PASSWORD=pypi-your-api-token-here
```

#### Option B: Config File

Create `~/.pypirc`:

```ini
[pypi]
username = __token__
password = pypi-your-api-token-here
```

#### Option C: Environment Token

```bash
export PYPI_TOKEN=pypi-your-api-token-here
```

### Publishing Commands

```bash
# Build and publish Python package to PyPI
npm run publish python

# Just build (no publish)
npm run package python

# Build all packages
npm run package all

# Publish all packages
npm run publish all
```

### Package Names

- **PyPI**: `ifs-cloud-parser`
- **npm**: `ifs-cloud-parser`
- **NuGet**: `IfsCloudParser`

### Installation After Publishing

```bash
# Python
pip install ifs-cloud-parser

# Node.js
npm install ifs-cloud-parser

# C#/.NET
dotnet add package IfsCloudParser
```

## Status

- ✅ **Python/PyPI**: Full build and publish support
- ⚠️ **Node.js/npm**: Build ready, publish TODO
- ⚠️ **C#/NuGet**: Build TODO, publish TODO

## Troubleshooting

### PyPI Upload Issues

```bash
# Manual upload if automated fails
twine upload dist/*.whl dist/*.tar.gz

# Check what would be uploaded
twine check dist/*

# Upload to test PyPI first
twine upload --repository testpypi dist/*
```

### Credential Issues

```bash
# Test credentials
twine upload --repository testpypi dist/*.tar.gz
```

### Build Issues

```bash
# Clean rebuild
npm run clean
npm run generate
npm test
npm run package python
```
