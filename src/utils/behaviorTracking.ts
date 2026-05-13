/**
 * Behavior Tracking Utility
 * Collects user behavior data for enhanced message analytics
 */

export interface SessionData {
  sessionId: string;
  startTime: number;
  pagesVisited: string[];
  timeOnSite: number;
  referrer: string;
  firstVisit: boolean;
  deviceInfo: DeviceInfo;
  geolocation: GeolocationData;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface GeolocationData {
  country: string;
  city: string;
  timezone: string;
}

class BehaviorTracker {
  private sessionData: SessionData;
  private updateInterval: number | null = null;

  constructor() {
    this.sessionData = this.initializeSession();
    this.startTracking();
  }

  private initializeSession(): SessionData {
    const sessionId = this.generateSessionId();
    const firstVisit = !this.hasVisitedBefore();
    this.markAsVisited();

    return {
      sessionId,
      startTime: Date.now(),
      pagesVisited: [],
      timeOnSite: 0,
      referrer: document.referrer || 'direct',
      firstVisit,
      deviceInfo: this.collectDeviceInfo(),
      geolocation: this.collectGeolocation(),
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hasVisitedBefore(): boolean {
    return localStorage.getItem('hasVisited') === 'true';
  }

  private markAsVisited(): void {
    localStorage.setItem('hasVisited', 'true');
  }

  private collectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;

    // Detect device type
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone/i.test(userAgent)) {
      type = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      type = 'tablet';
    }

    // Detect browser
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect OS
    let os = 'unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      type,
      browser,
      os,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private async collectGeolocation(): Promise<GeolocationData> {
    // Default values
    const defaultGeo: GeolocationData = {
      country: 'unknown',
      city: 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    try {
      // Try to get timezone from browser
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Simple country detection from timezone
      let country = 'unknown';
      if (timezone.includes('/')) {
        const region = timezone.split('/')[0];
        country = region;
      }

      return {
        country,
        city: 'unknown',
        timezone,
      };
    } catch (error) {
      console.error('Error collecting geolocation:', error);
      return defaultGeo;
    }
  }

  private startTracking(): void {
    // Track page visits
    this.trackPageVisit();

    // Update time on site every second
    this.updateInterval = window.setInterval(() => {
      this.sessionData.timeOnSite = Math.floor((Date.now() - this.sessionData.startTime) / 1000);
    }, 1000);

    // Track page changes
    window.addEventListener('popstate', () => this.trackPageVisit());
  }

  private trackPageVisit(): void {
    const currentPath = window.location.pathname;
    if (!this.sessionData.pagesVisited.includes(currentPath)) {
      this.sessionData.pagesVisited.push(currentPath);
    }
  }

  public getSessionData(): SessionData {
    // Update time on site before returning
    this.sessionData.timeOnSite = Math.floor((Date.now() - this.sessionData.startTime) / 1000);
    return { ...this.sessionData };
  }

  public stopTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public resetSession(): void {
    this.stopTracking();
    this.sessionData = this.initializeSession();
    this.startTracking();
  }
}

// Singleton instance
let trackerInstance: BehaviorTracker | null = null;

export const getBehaviorTracker = (): BehaviorTracker => {
  if (!trackerInstance) {
    trackerInstance = new BehaviorTracker();
  }
  return trackerInstance;
};

export const getSessionDataForMessage = () => {
  const tracker = getBehaviorTracker();
  const sessionData = tracker.getSessionData();

  return {
    sessionId: sessionData.sessionId,
    timeOnSite: sessionData.timeOnSite,
    pagesVisited: sessionData.pagesVisited.length,
    referrer: sessionData.referrer,
    firstVisit: sessionData.firstVisit,
    deviceType: sessionData.deviceInfo.type,
    browser: sessionData.deviceInfo.browser,
    os: sessionData.deviceInfo.os,
    screenResolution: sessionData.deviceInfo.screenResolution,
    language: sessionData.deviceInfo.language,
    country: sessionData.geolocation.country,
    city: sessionData.geolocation.city,
    timezone: sessionData.geolocation.timezone,
  };
};