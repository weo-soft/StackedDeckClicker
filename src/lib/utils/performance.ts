/**
 * Performance monitoring utilities.
 */

interface PerformanceMetrics {
  loadTime: number;
  interactionResponseTimes: number[];
  canvasFPS: number[];
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    interactionResponseTimes: [],
    canvasFPS: [],
    memoryUsage: 0
  };

  private loadStartTime: number = 0;
  private frameCount: number = 0;
  private lastFPSCheck: number = 0;

  /**
   * Start tracking load time.
   */
  startLoadTracking(): void {
    this.loadStartTime = performance.now();
  }

  /**
   * End load tracking and record load time.
   */
  endLoadTracking(): void {
    if (this.loadStartTime > 0) {
      this.metrics.loadTime = performance.now() - this.loadStartTime;
      console.log(`Game load time: ${this.metrics.loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track interaction response time.
   */
  trackInteraction<T>(fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.metrics.interactionResponseTimes.push(duration);
    
    // Keep only last 100 interactions
    if (this.metrics.interactionResponseTimes.length > 100) {
      this.metrics.interactionResponseTimes.shift();
    }
    
    if (duration > 100) {
      console.warn(`Slow interaction: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Track async interaction response time.
   */
  async trackAsyncInteraction<T>(fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.metrics.interactionResponseTimes.push(duration);
    
    // Keep only last 100 interactions
    if (this.metrics.interactionResponseTimes.length > 100) {
      this.metrics.interactionResponseTimes.shift();
    }
    
    if (duration > 100) {
      console.warn(`Slow async interaction: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }

  /**
   * Update canvas FPS tracking.
   */
  updateCanvasFPS(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFPSCheck >= 1000) {
      const fps = this.frameCount;
      this.metrics.canvasFPS.push(fps);
      
      // Keep only last 60 FPS readings (1 minute at 1 reading per second)
      if (this.metrics.canvasFPS.length > 60) {
        this.metrics.canvasFPS.shift();
      }
      
      if (fps < 55) {
        console.warn(`Low FPS detected: ${fps}`);
      }
      
      this.frameCount = 0;
      this.lastFPSCheck = now;
    }
  }

  /**
   * Get current metrics.
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get average interaction response time.
   */
  getAverageResponseTime(): number {
    if (this.metrics.interactionResponseTimes.length === 0) return 0;
    const sum = this.metrics.interactionResponseTimes.reduce((a, b) => a + b, 0);
    return sum / this.metrics.interactionResponseTimes.length;
  }

  /**
   * Get average FPS.
   */
  getAverageFPS(): number {
    if (this.metrics.canvasFPS.length === 0) return 0;
    const sum = this.metrics.canvasFPS.reduce((a, b) => a + b, 0);
    return sum / this.metrics.canvasFPS.length;
  }

  /**
   * Reset all metrics.
   */
  reset(): void {
    this.metrics = {
      loadTime: 0,
      interactionResponseTimes: [],
      canvasFPS: [],
      memoryUsage: 0
    };
    this.loadStartTime = 0;
    this.frameCount = 0;
    this.lastFPSCheck = performance.now();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

