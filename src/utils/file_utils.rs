// File utility functions

use crate::Result;
use std::fs;
use std::path::{Path, PathBuf};

/// Recursively find files matching a pattern
pub fn find_files<P: AsRef<Path>>(
    root: P,
    extensions: &[&str],
) -> Result<Vec<PathBuf>> {
    let mut files = Vec::new();
    find_files_recursive(root.as_ref(), extensions, &mut files)?;
    Ok(files)
}

fn find_files_recursive(
    dir: &Path,
    extensions: &[&str],
    files: &mut Vec<PathBuf>,
) -> Result<()> {
    if dir.is_dir() {
        let entries = fs::read_dir(dir)?;
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                find_files_recursive(&path, extensions, files)?;
            } else if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_with_dot = format!(".{}", ext);
                    if extensions.contains(&ext_with_dot.as_str()) {
                        files.push(path);
                    }
                }
            }
        }
    }
    Ok(())
}

/// Read file contents as string
pub fn read_file_string<P: AsRef<Path>>(path: P) -> Result<String> {
    let content = fs::read_to_string(path)?;
    Ok(content)
}

/// Get file size in bytes
pub fn get_file_size<P: AsRef<Path>>(path: P) -> Result<u64> {
    let metadata = fs::metadata(path)?;
    Ok(metadata.len())
}

/// Check if a file exists
pub fn file_exists<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref().exists() && path.as_ref().is_file()
}

/// Create parent directories if they don't exist
pub fn ensure_parent_dir<P: AsRef<Path>>(path: P) -> Result<()> {
    if let Some(parent) = path.as_ref().parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }
    Ok(())
}

/// Get file extension without the dot
pub fn get_extension<P: AsRef<Path>>(path: P) -> Option<String> {
    path.as_ref()
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|s| s.to_string())
}

/// Get file name without extension
pub fn get_stem<P: AsRef<Path>>(path: P) -> Option<String> {
    path.as_ref()
        .file_stem()
        .and_then(|stem| stem.to_str())
        .map(|s| s.to_string())
}

/// Convert path to canonical form
pub fn canonicalize_path<P: AsRef<Path>>(path: P) -> Result<PathBuf> {
    let canonical = fs::canonicalize(path)?;
    Ok(canonical)
}

/// Check if path is inside another path
pub fn is_child_path<P1: AsRef<Path>, P2: AsRef<Path>>(child: P1, parent: P2) -> bool {
    if let (Ok(child_canonical), Ok(parent_canonical)) = (
        fs::canonicalize(child),
        fs::canonicalize(parent),
    ) {
        child_canonical.starts_with(parent_canonical)
    } else {
        false
    }
}

/// Get relative path from one path to another
pub fn get_relative_path<P1: AsRef<Path>, P2: AsRef<Path>>(
    from: P1,
    to: P2,
) -> Option<PathBuf> {
    pathdiff::diff_paths(to, from)
}

/// File statistics
#[derive(Debug, Clone)]
pub struct FileStats {
    pub size: u64,
    pub modified: Option<std::time::SystemTime>,
    pub created: Option<std::time::SystemTime>,
    pub is_readonly: bool,
}

/// Get file statistics
pub fn get_file_stats<P: AsRef<Path>>(path: P) -> Result<FileStats> {
    let metadata = fs::metadata(&path)?;
    
    Ok(FileStats {
        size: metadata.len(),
        modified: metadata.modified().ok(),
        created: metadata.created().ok(),
        is_readonly: metadata.permissions().readonly(),
    })
}

/// File walker that yields files one by one
pub struct FileWalker {
    stack: Vec<PathBuf>,
    extensions: Vec<String>,
}

impl FileWalker {
    /// Create a new file walker
    pub fn new<P: AsRef<Path>>(root: P, extensions: &[&str]) -> Self {
        Self {
            stack: vec![root.as_ref().to_path_buf()],
            extensions: extensions.iter().map(|s| s.to_string()).collect(),
        }
    }
}

impl Iterator for FileWalker {
    type Item = Result<PathBuf>;
    
    fn next(&mut self) -> Option<Self::Item> {
        while let Some(path) = self.stack.pop() {
            if path.is_dir() {
                match fs::read_dir(&path) {
                    Ok(entries) => {
                        for entry in entries {
                            match entry {
                                Ok(entry) => {
                                    self.stack.push(entry.path());
                                }
                                Err(e) => return Some(Err(e.into())),
                            }
                        }
                    }
                    Err(e) => return Some(Err(e.into())),
                }
            } else if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    let ext_with_dot = format!(".{}", ext);
                    if self.extensions.contains(&ext_with_dot) {
                        return Some(Ok(path));
                    }
                }
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::TempDir;

    #[test]
    fn test_file_operations() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        // Create a test file
        let mut file = File::create(&file_path).unwrap();
        writeln!(file, "Hello, world!").unwrap();
        
        // Test file existence
        assert!(file_exists(&file_path));
        
        // Test reading file
        let content = read_file_string(&file_path).unwrap();
        assert!(content.contains("Hello, world!"));
        
        // Test file size
        let size = get_file_size(&file_path).unwrap();
        assert!(size > 0);
        
        // Test extension
        assert_eq!(get_extension(&file_path), Some("txt".to_string()));
        
        // Test stem
        assert_eq!(get_stem(&file_path), Some("test".to_string()));
    }
    
    #[test]
    fn test_find_files() {
        let temp_dir = TempDir::new().unwrap();
        let root_path = temp_dir.path();
        
        // Create test files
        File::create(root_path.join("test1.txt")).unwrap();
        File::create(root_path.join("test2.rs")).unwrap();
        File::create(root_path.join("test3.md")).unwrap();
        
        // Find .txt files
        let txt_files = find_files(root_path, &[".txt"]).unwrap();
        assert_eq!(txt_files.len(), 1);
        
        // Find multiple extensions
        let multiple_files = find_files(root_path, &[".txt", ".rs"]).unwrap();
        assert_eq!(multiple_files.len(), 2);
    }
    
    #[test]
    fn test_file_walker() {
        let temp_dir = TempDir::new().unwrap();
        let root_path = temp_dir.path();
        
        // Create test files
        File::create(root_path.join("test1.txt")).unwrap();
        File::create(root_path.join("test2.rs")).unwrap();
        
        let walker = FileWalker::new(root_path, &[".txt"]);
        let files: Result<Vec<_>> = walker.collect();
        let files = files.unwrap();
        
        assert_eq!(files.len(), 1);
        assert!(files[0].file_name().unwrap().to_str().unwrap().contains("test1.txt"));
    }
}
