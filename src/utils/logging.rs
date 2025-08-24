// Logging utilities and configuration

use log::LevelFilter;
use std::io::Write;

/// Initialize logging with default configuration
pub fn init_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Info)
        .format(|buf, record| {
            writeln!(
                buf,
                "{} [{}] {}: {}",
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S%.3f"),
                record.level(),
                record.target(),
                record.args()
            )
        })
        .init();
}

/// Initialize logging with custom level
pub fn init_logging_with_level(level: LevelFilter) {
    env_logger::Builder::from_default_env()
        .filter_level(level)
        .format(|buf, record| {
            writeln!(
                buf,
                "{} [{}] {}: {}",
                chrono::Utc::now().format("%Y-%m-%d %H:%M:%S%.3f"),
                record.level(),
                record.target(),
                record.args()
            )
        })
        .init();
}

/// Initialize logging for development with debug level
pub fn init_dev_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Debug)
        .format(|buf, record| {
            writeln!(
                buf,
                "{} [{}] {}:{} - {}: {}",
                chrono::Utc::now().format("%H:%M:%S%.3f"),
                record.level(),
                record.file().unwrap_or("unknown"),
                record.line().unwrap_or(0),
                record.target(),
                record.args()
            )
        })
        .init();
}

/// Initialize logging for production with structured output
pub fn init_structured_logging() {
    env_logger::Builder::from_default_env()
        .filter_level(LevelFilter::Warn)
        .format(|buf, record| {
            let timestamp = chrono::Utc::now().to_rfc3339();
            let level = record.level().to_string().to_lowercase();
            let target = record.target();
            let message = record.args();
            
            writeln!(
                buf,
                r#"{{"timestamp":"{}","level":"{}","target":"{}","message":"{}"}}"#,
                timestamp, level, target, message
            )
        })
        .init();
}

/// Configure logging based on environment
pub fn configure_logging() {
    match std::env::var("RUST_LOG") {
        Ok(level) if !level.is_empty() => {
            // Use environment variable if set
            env_logger::init();
        }
        _ => {
            // Default configuration based on debug/release mode
            #[cfg(debug_assertions)]
            init_dev_logging();
            
            #[cfg(not(debug_assertions))]
            init_structured_logging();
        }
    }
}

/// Logging macros with context
#[macro_export]
macro_rules! log_parse_error {
    ($file:expr, $line:expr, $column:expr, $msg:expr) => {
        log::error!(
            "Parse error in {}:{}:{} - {}",
            $file, $line, $column, $msg
        );
    };
    ($file:expr, $line:expr, $column:expr, $fmt:expr, $($arg:tt)*) => {
        log::error!(
            "Parse error in {}:{}:{} - {}",
            $file, $line, $column,
            format!($fmt, $($arg)*)
        );
    };
}

#[macro_export]
macro_rules! log_index_operation {
    ($operation:expr, $file:expr, $symbols:expr) => {
        log::info!(
            "Index {}: {} - {} symbols processed",
            $operation, $file, $symbols
        );
    };
}

#[macro_export]
macro_rules! log_performance {
    ($operation:expr, $duration:expr) => {
        log::debug!(
            "Performance: {} completed in {}",
            $operation,
            $crate::utils::format_duration($duration)
        );
    };
    ($operation:expr, $duration:expr, $items:expr) => {
        log::debug!(
            "Performance: {} completed in {} ({} items, {:.2} items/s)",
            $operation,
            $crate::utils::format_duration($duration),
            $items,
            $items as f64 / $duration.as_secs_f64()
        );
    };
}

/// Structured log entry for analysis operations
pub struct AnalysisLog {
    pub operation: String,
    pub file: String,
    pub duration: std::time::Duration,
    pub symbols_found: usize,
    pub errors: usize,
    pub warnings: usize,
}

impl AnalysisLog {
    /// Create a new analysis log entry
    pub fn new(operation: &str, file: &str) -> Self {
        Self {
            operation: operation.to_string(),
            file: file.to_string(),
            duration: std::time::Duration::ZERO,
            symbols_found: 0,
            errors: 0,
            warnings: 0,
        }
    }
    
    /// Set duration
    pub fn with_duration(mut self, duration: std::time::Duration) -> Self {
        self.duration = duration;
        self
    }
    
    /// Set symbol count
    pub fn with_symbols(mut self, count: usize) -> Self {
        self.symbols_found = count;
        self
    }
    
    /// Set error count
    pub fn with_errors(mut self, count: usize) -> Self {
        self.errors = count;
        self
    }
    
    /// Set warning count
    pub fn with_warnings(mut self, count: usize) -> Self {
        self.warnings = count;
        self
    }
    
    /// Log this entry
    pub fn log(&self) {
        if self.errors > 0 {
            log::error!(
                "{} completed for {} in {} - {} symbols, {} errors, {} warnings",
                self.operation,
                self.file,
                crate::utils::format_duration(self.duration),
                self.symbols_found,
                self.errors,
                self.warnings
            );
        } else if self.warnings > 0 {
            log::warn!(
                "{} completed for {} in {} - {} symbols, {} warnings",
                self.operation,
                self.file,
                crate::utils::format_duration(self.duration),
                self.symbols_found,
                self.warnings
            );
        } else {
            log::info!(
                "{} completed for {} in {} - {} symbols processed",
                self.operation,
                self.file,
                crate::utils::format_duration(self.duration),
                self.symbols_found
            );
        }
    }
}

/// Progress logger for long-running operations
pub struct ProgressLogger {
    operation: String,
    total: usize,
    current: usize,
    last_log: std::time::Instant,
    log_interval: std::time::Duration,
}

impl ProgressLogger {
    /// Create a new progress logger
    pub fn new(operation: &str, total: usize) -> Self {
        log::info!("Starting {}: {} items to process", operation, total);
        
        Self {
            operation: operation.to_string(),
            total,
            current: 0,
            last_log: std::time::Instant::now(),
            log_interval: std::time::Duration::from_secs(5), // Log every 5 seconds
        }
    }
    
    /// Update progress
    pub fn update(&mut self, processed: usize) {
        self.current = processed;
        
        let now = std::time::Instant::now();
        if now.duration_since(self.last_log) >= self.log_interval || self.current >= self.total {
            let percentage = if self.total > 0 {
                (self.current as f64 / self.total as f64) * 100.0
            } else {
                0.0
            };
            
            log::info!(
                "{}: {}/{} items processed ({:.1}%)",
                self.operation,
                self.current,
                self.total,
                percentage
            );
            
            self.last_log = now;
        }
    }
    
    /// Increment progress by 1
    pub fn increment(&mut self) {
        self.update(self.current + 1);
    }
    
    /// Mark as complete
    pub fn complete(&self) {
        log::info!(
            "{} completed: {}/{} items processed",
            self.operation,
            self.current,
            self.total
        );
    }
}

/// Create a logger for specific module
pub fn create_module_logger(module_name: &str) -> ModuleLogger {
    ModuleLogger {
        module: module_name.to_string(),
    }
}

/// Module-specific logger
pub struct ModuleLogger {
    module: String,
}

impl ModuleLogger {
    /// Log an info message
    pub fn info(&self, message: &str) {
        log::info!(target: &self.module, "{}", message);
    }
    
    /// Log a warning message
    pub fn warn(&self, message: &str) {
        log::warn!(target: &self.module, "{}", message);
    }
    
    /// Log an error message
    pub fn error(&self, message: &str) {
        log::error!(target: &self.module, "{}", message);
    }
    
    /// Log a debug message
    pub fn debug(&self, message: &str) {
        log::debug!(target: &self.module, "{}", message);
    }
    
    /// Log a trace message
    pub fn trace(&self, message: &str) {
        log::trace!(target: &self.module, "{}", message);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_analysis_log() {
        let log_entry = AnalysisLog::new("parsing", "test.pls")
            .with_duration(Duration::from_millis(100))
            .with_symbols(5)
            .with_warnings(1);
        
        // Just test that we can create and configure the log entry
        assert_eq!(log_entry.operation, "parsing");
        assert_eq!(log_entry.file, "test.pls");
        assert_eq!(log_entry.symbols_found, 5);
        assert_eq!(log_entry.warnings, 1);
        assert_eq!(log_entry.errors, 0);
    }
    
    #[test]
    fn test_progress_logger() {
        let mut logger = ProgressLogger::new("test_operation", 100);
        
        assert_eq!(logger.operation, "test_operation");
        assert_eq!(logger.total, 100);
        assert_eq!(logger.current, 0);
        
        logger.update(50);
        assert_eq!(logger.current, 50);
        
        logger.increment();
        assert_eq!(logger.current, 51);
    }
    
    #[test]
    fn test_module_logger() {
        let logger = create_module_logger("test_module");
        assert_eq!(logger.module, "test_module");
        
        // Test that we can call the logging methods without errors
        logger.debug("test debug message");
        logger.info("test info message");
    }
}
