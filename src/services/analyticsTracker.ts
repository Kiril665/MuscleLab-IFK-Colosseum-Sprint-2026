// Minimal event tracking service for MVP metrics:
// - Activation (first verified workout)
// - D7 retention / active sessions
// - Battles / user
// - Invite rate
// - Camera success rate
// - Dispute rate

export type AnalyticsEventType =
  | 'activation_first_workout'
  | 'battle_start'
  | 'battle_complete'
  | 'invite_created'
  | 'camera_started'
  | 'camera_success'
  | 'camera_failure'
  | 'camera_dispute'
  | 'session_active';

class AnalyticsTracker {
  private queue: Array<{
    eventName: AnalyticsEventType;
    userId?: string;
    properties?: Record<string, any>;
    timestamp: string;
  }> = [];

  private isFlushing = false;

  public track(eventName: AnalyticsEventType, properties?: Record<string, any>, userId?: string) {
    const payload = {
      eventName,
      userId,
      properties,
      timestamp: new Date().toISOString()
    };

    this.queue.push(payload);
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.isFlushing) return;
    this.isFlushing = true;
    setTimeout(() => {
      this.flush();
    }, 500);
  }

  private async flush() {
    if (this.queue.length === 0) {
      this.isFlushing = false;
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    for (const item of batch) {
      try {
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch {
        // Silently tolerate analytics failures without breaking athlete experience
      }
    }

    this.isFlushing = false;
  }
}

export const analyticsTracker = new AnalyticsTracker();
