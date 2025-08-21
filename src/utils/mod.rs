// Utility functions and helpers

pub mod file_utils;
pub mod performance;
pub mod logging;

pub use file_utils::*;
pub use performance::*;
pub use logging::*;

use std::time::Instant;

/// Timer utility for measuring performance
pub struct Timer {
    start: Instant,
    name: String,
}

impl Timer {
    /// Start a new timer with the given name
    pub fn new(name: &str) -> Self {
        log::debug!("Timer started: {}", name);
        Self {
            start: Instant::now(),
            name: name.to_string(),
        }
    }
    
    /// Get elapsed time without stopping the timer
    pub fn elapsed(&self) -> std::time::Duration {
        self.start.elapsed()
    }
    
    /// Stop the timer and return elapsed time
    pub fn stop(self) -> std::time::Duration {
        let elapsed = self.elapsed();
        log::debug!("Timer stopped: {} - {:?}", self.name, elapsed);
        elapsed
    }
}

/// Utility for measuring function execution time
pub fn time_it<F, R>(name: &str, func: F) -> R 
where
    F: FnOnce() -> R,
{
    let timer = Timer::new(name);
    let result = func();
    timer.stop();
    result
}

/// Convert bytes to human readable format
pub fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    const THRESHOLD: u64 = 1024;
    
    if bytes < THRESHOLD {
        return format!("{} B", bytes);
    }
    
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= THRESHOLD as f64 && unit_index < UNITS.len() - 1 {
        size /= THRESHOLD as f64;
        unit_index += 1;
    }
    
    format!("{:.2} {}", size, UNITS[unit_index])
}

/// Convert duration to human readable format
pub fn format_duration(duration: std::time::Duration) -> String {
    let total_ms = duration.as_millis();
    
    if total_ms < 1000 {
        format!("{}ms", total_ms)
    } else if total_ms < 60_000 {
        format!("{:.2}s", total_ms as f64 / 1000.0)
    } else {
        let minutes = total_ms / 60_000;
        let seconds = (total_ms % 60_000) as f64 / 1000.0;
        format!("{}m {:.2}s", minutes, seconds)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_timer() {
        let timer = Timer::new("test");
        thread::sleep(Duration::from_millis(10));
        let elapsed = timer.stop();
        assert!(elapsed >= Duration::from_millis(10));
    }
    
    #[test]
    fn test_time_it() {
        let result = time_it("test_function", || {
            thread::sleep(Duration::from_millis(1));
            42
        });
        assert_eq!(result, 42);
    }
    
    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1024), "1.00 KB");
        assert_eq!(format_bytes(1536), "1.50 KB");
        assert_eq!(format_bytes(1024 * 1024), "1.00 MB");
    }
    
    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(Duration::from_millis(500)), "500ms");
        assert_eq!(format_duration(Duration::from_millis(1500)), "1.50s");
        assert_eq!(format_duration(Duration::from_secs(90)), "1m 30.00s");
    }
}
