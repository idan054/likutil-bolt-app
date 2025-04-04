import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
mixpanel.init('209d2adc225a24e3c78a2d771cd10aa0', {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: false,
  persistence: 'localStorage',
});

// Define event types for better TypeScript support
export enum AnalyticsEvent {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_ERROR = 'login_error',
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  ORDER_VIEW = 'order_view',
  ORDER_FILTER = 'order_filter',
  ORDER_SEARCH = 'order_search'
}

// Create a wrapper class for analytics
class Analytics {
  private static instance: Analytics;

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    mixpanel.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }

  reset() {
    mixpanel.reset();
  }
}

export const analytics = Analytics.getInstance();