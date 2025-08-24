// Performance monitoring and optimization utilities

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Performance counter for tracking execution times
#[derive(Debug, Clone)]
pub struct PerformanceCounter {
    #[allow(dead_code)]
    name: String,
    total_time: Duration,
    count: u64,
    min_time: Duration,
    max_time: Duration,
}

impl PerformanceCounter {
    /// Create a new performance counter
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
            total_time: Duration::ZERO,
            count: 0,
            min_time: Duration::MAX,
            max_time: Duration::ZERO,
        }
    }
    
    /// Record a measurement
    pub fn record(&mut self, duration: Duration) {
        self.total_time += duration;
        self.count += 1;
        self.min_time = self.min_time.min(duration);
        self.max_time = self.max_time.max(duration);
    }
    
    /// Get average time
    pub fn average(&self) -> Duration {
        if self.count > 0 {
            self.total_time / (self.count as u32)
        } else {
            Duration::ZERO
        }
    }
    
    /// Get total time
    pub fn total(&self) -> Duration {
        self.total_time
    }
    
    /// Get call count
    pub fn count(&self) -> u64 {
        self.count
    }
    
    /// Get minimum time
    pub fn min(&self) -> Duration {
        if self.count > 0 {
            self.min_time
        } else {
            Duration::ZERO
        }
    }
    
    /// Get maximum time
    pub fn max(&self) -> Duration {
        self.max_time
    }
    
    /// Reset the counter
    pub fn reset(&mut self) {
        self.total_time = Duration::ZERO;
        self.count = 0;
        self.min_time = Duration::MAX;
        self.max_time = Duration::ZERO;
    }
}

/// Global performance monitor
pub struct PerformanceMonitor {
    counters: Arc<Mutex<HashMap<String, PerformanceCounter>>>,
}

impl PerformanceMonitor {
    /// Create a new performance monitor
    pub fn new() -> Self {
        Self {
            counters: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Record a measurement for a named counter
    pub fn record(&self, name: &str, duration: Duration) {
        let mut counters = self.counters.lock().unwrap();
        let counter = counters.entry(name.to_string())
            .or_insert_with(|| PerformanceCounter::new(name));
        counter.record(duration);
    }
    
    /// Time a function and record the measurement
    pub fn time_it<F, R>(&self, name: &str, func: F) -> R
    where
        F: FnOnce() -> R,
    {
        let start = Instant::now();
        let result = func();
        let duration = start.elapsed();
        self.record(name, duration);
        result
    }
    
    /// Get a snapshot of all counters
    pub fn get_counters(&self) -> HashMap<String, PerformanceCounter> {
        self.counters.lock().unwrap().clone()
    }
    
    /// Get a specific counter
    pub fn get_counter(&self, name: &str) -> Option<PerformanceCounter> {
        self.counters.lock().unwrap().get(name).cloned()
    }
    
    /// Reset all counters
    pub fn reset_all(&self) {
        let mut counters = self.counters.lock().unwrap();
        for counter in counters.values_mut() {
            counter.reset();
        }
    }
    
    /// Reset a specific counter
    pub fn reset(&self, name: &str) {
        let mut counters = self.counters.lock().unwrap();
        if let Some(counter) = counters.get_mut(name) {
            counter.reset();
        }
    }
    
    /// Generate a performance report
    pub fn report(&self) -> String {
        let counters = self.get_counters();
        let mut report = String::new();
        
        report.push_str("Performance Report\n");
        report.push_str("==================\n\n");
        
        if counters.is_empty() {
            report.push_str("No performance data available.\n");
            return report;
        }
        
        let mut counter_vec: Vec<_> = counters.into_iter().collect();
        counter_vec.sort_by(|a, b| b.1.total().cmp(&a.1.total()));
        
        for (name, counter) in counter_vec {
            report.push_str(&format!(
                "{:<30} | Count: {:>8} | Total: {:>10} | Avg: {:>10} | Min: {:>10} | Max: {:>10}\n",
                name,
                counter.count(),
                crate::utils::format_duration(counter.total()),
                crate::utils::format_duration(counter.average()),
                crate::utils::format_duration(counter.min()),
                crate::utils::format_duration(counter.max()),
            ));
        }
        
        report
    }
}

impl Default for PerformanceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

/// Memory usage information
#[derive(Debug, Clone)]
pub struct MemoryUsage {
    pub rss: u64,      // Resident Set Size
    pub vms: u64,      // Virtual Memory Size
    pub shared: u64,   // Shared memory
}

/// Get current memory usage (Unix only)
#[cfg(unix)]
pub fn get_memory_usage() -> Option<MemoryUsage> {
    use std::fs;
    
    let status = fs::read_to_string("/proc/self/status").ok()?;
    let mut rss = 0;
    let mut vms = 0;
    let mut shared = 0;
    
    for line in status.lines() {
        if line.starts_with("VmRSS:") {
            if let Some(value) = line.split_whitespace().nth(1) {
                rss = value.parse().unwrap_or(0);
            }
        } else if line.starts_with("VmSize:") {
            if let Some(value) = line.split_whitespace().nth(1) {
                vms = value.parse().unwrap_or(0);
            }
        } else if line.starts_with("RssFile:") {
            if let Some(value) = line.split_whitespace().nth(1) {
                shared = value.parse().unwrap_or(0);
            }
        }
    }
    
    // Convert from KB to bytes
    Some(MemoryUsage {
        rss: rss * 1024,
        vms: vms * 1024,
        shared: shared * 1024,
    })
}

/// Get current memory usage (Windows/other platforms)
#[cfg(not(unix))]
pub fn get_memory_usage() -> Option<MemoryUsage> {
    // Memory usage is not implemented for non-Unix platforms
    None
}

/// CPU usage monitor
pub struct CpuMonitor {
    last_measurement: Option<Instant>,
    cpu_time: Duration,
}

impl CpuMonitor {
    /// Create a new CPU monitor
    pub fn new() -> Self {
        Self {
            last_measurement: None,
            cpu_time: Duration::ZERO,
        }
    }
    
    /// Update CPU usage measurement
    pub fn update(&mut self) {
        let now = Instant::now();
        
        if let Some(last) = self.last_measurement {
            let elapsed = now.duration_since(last);
            // This is a simplified CPU time calculation
            // In a real implementation, you'd use system calls to get actual CPU time
            self.cpu_time += elapsed;
        }
        
        self.last_measurement = Some(now);
    }
    
    /// Get CPU usage percentage (simplified)
    pub fn usage_percent(&self) -> f64 {
        // This is a placeholder implementation
        // Real CPU usage calculation would require platform-specific code
        0.0
    }
}

impl Default for CpuMonitor {
    fn default() -> Self {
        Self::new()
    }
}

/// Resource usage summary
#[derive(Debug, Clone)]
pub struct ResourceUsage {
    pub memory: Option<MemoryUsage>,
    pub cpu_percent: f64,
    pub uptime: Duration,
}

/// System resource monitor
pub struct ResourceMonitor {
    start_time: Instant,
    cpu_monitor: CpuMonitor,
}

impl ResourceMonitor {
    /// Create a new resource monitor
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            cpu_monitor: CpuMonitor::new(),
        }
    }
    
    /// Get current resource usage
    pub fn get_usage(&mut self) -> ResourceUsage {
        self.cpu_monitor.update();
        
        ResourceUsage {
            memory: get_memory_usage(),
            cpu_percent: self.cpu_monitor.usage_percent(),
            uptime: self.start_time.elapsed(),
        }
    }
}

impl Default for ResourceMonitor {
    fn default() -> Self {
        Self::new()
    }
}

lazy_static::lazy_static! {
    pub static ref GLOBAL_PERF_MONITOR: PerformanceMonitor = PerformanceMonitor::new();
}

/// Macro for timing function calls
#[macro_export]
macro_rules! time_it {
    ($name:expr, $code:block) => {{
        use std::time::Instant;
        let start = Instant::now();
        let result = $code;
        let duration = start.elapsed();
        $crate::utils::performance::GLOBAL_PERF_MONITOR.record($name, duration);
        result
    }};
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;

    #[test]
    fn test_performance_counter() {
        let mut counter = PerformanceCounter::new("test");
        
        counter.record(Duration::from_millis(100));
        counter.record(Duration::from_millis(200));
        counter.record(Duration::from_millis(50));
        
        assert_eq!(counter.count(), 3);
        assert_eq!(counter.min(), Duration::from_millis(50));
        assert_eq!(counter.max(), Duration::from_millis(200));
        assert!(counter.average() > Duration::from_millis(100));
    }
    
    #[test]
    fn test_performance_monitor() {
        let monitor = PerformanceMonitor::new();
        
        monitor.record("test1", Duration::from_millis(100));
        monitor.record("test2", Duration::from_millis(200));
        monitor.record("test1", Duration::from_millis(150));
        
        let counter1 = monitor.get_counter("test1").unwrap();
        assert_eq!(counter1.count(), 2);
        
        let counter2 = monitor.get_counter("test2").unwrap();
        assert_eq!(counter2.count(), 1);
    }
    
    #[test]
    fn test_time_it_method() {
        let monitor = PerformanceMonitor::new();
        
        let result = monitor.time_it("test_func", || {
            thread::sleep(Duration::from_millis(1));
            42
        });
        
        assert_eq!(result, 42);
        let counter = monitor.get_counter("test_func").unwrap();
        assert_eq!(counter.count(), 1);
        assert!(counter.total() >= Duration::from_millis(1));
    }
    
    #[test]
    fn test_resource_monitor() {
        let mut monitor = ResourceMonitor::new();
        thread::sleep(Duration::from_millis(10));
        
        let usage = monitor.get_usage();
        assert!(usage.uptime >= Duration::from_millis(10));
    }
}
