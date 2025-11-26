import type { 
  WearableDevice, 
  InsertWearableDevice, 
  WearableMetric, 
  InsertWearableMetric,
  WearableSession,
  InsertWearableSession,
  WearableAlert,
  InsertWearableAlert
} from "../shared/schema";

// Base interfaces for wearable device integration
export interface WearableDeviceProvider {
  name: string;
  type: 'apple_watch' | 'fitbit' | 'garmin' | 'samsung_health' | 'google_fit';
  authenticate(credentials: any): Promise<AuthResult>;
  syncData(deviceId: number, lastSync?: Date): Promise<SyncResult>;
  getMetrics(deviceId: number, startDate: Date, endDate: Date): Promise<WearableMetric[]>;
  getSessions(deviceId: number, startDate: Date, endDate: Date): Promise<WearableSession[]>;
  disconnect(deviceId: number): Promise<void>;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  userId?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  metricsCount: number;
  sessionsCount: number;
  alertsCount: number;
  lastSyncTime: Date;
  errors?: string[];
}

export interface WearableDataPoint {
  type: string;
  subtype?: string;
  value: number;
  unit: string;
  timestamp: Date;
  confidence?: number;
  metadata?: any;
}

// Apple Watch / HealthKit Integration
export class AppleWatchProvider implements WearableDeviceProvider {
  name = 'Apple Watch';
  type = 'apple_watch' as const;

  async authenticate(credentials: { userId: string }): Promise<AuthResult> {
    // Apple HealthKit uses device-local authentication
    // This would typically involve iOS app integration
    return {
      success: true,
      userId: credentials.userId,
      // HealthKit doesn't use traditional OAuth tokens
    };
  }

  async syncData(deviceId: number, lastSync?: Date): Promise<SyncResult> {
    // Implementation would sync with iOS HealthKit
    // This requires native iOS app integration
    console.log(`Syncing Apple Watch data for device ${deviceId} since ${lastSync}`);
    
    return {
      success: true,
      metricsCount: 0,
      sessionsCount: 0,
      alertsCount: 0,
      lastSyncTime: new Date(),
      errors: ['Apple HealthKit integration requires native iOS app']
    };
  }

  async getMetrics(deviceId: number, startDate: Date, endDate: Date): Promise<WearableMetric[]> {
    // Would fetch metrics from HealthKit
    return [];
  }

  async getSessions(deviceId: number, startDate: Date, endDate: Date): Promise<WearableSession[]> {
    // Would fetch workout/sleep sessions from HealthKit
    return [];
  }

  async disconnect(deviceId: number): Promise<void> {
    // Cleanup local HealthKit permissions
    console.log(`Disconnecting Apple Watch device ${deviceId}`);
  }
}

// Fitbit Integration
export class FitbitProvider implements WearableDeviceProvider {
  name = 'Fitbit';
  type = 'fitbit' as const;
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.fitbit.com';

  constructor() {
    this.clientId = process.env.FITBIT_CLIENT_ID || '';
    this.clientSecret = process.env.FITBIT_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️  Fitbit API credentials not configured');
    }
  }

  async authenticate(credentials: { code: string; redirectUri: string }): Promise<AuthResult> {
    if (!this.clientId || !this.clientSecret) {
      return { success: false, error: 'Fitbit API credentials not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          grant_type: 'authorization_code',
          redirect_uri: credentials.redirectUri,
          code: credentials.code
        })
      });

      if (!response.ok) {
        throw new Error(`Fitbit auth failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        userId: data.user_id
      };
    } catch (error) {
      console.error('Fitbit authentication error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async syncData(deviceId: number, lastSync?: Date): Promise<SyncResult> {
    // Implementation would sync with Fitbit API
    console.log(`Syncing Fitbit data for device ${deviceId} since ${lastSync}`);
    
    // This would make actual API calls to Fitbit
    const metricsCount = await this.syncMetrics(deviceId, lastSync);
    const sessionsCount = await this.syncSessions(deviceId, lastSync);
    
    return {
      success: true,
      metricsCount,
      sessionsCount,
      alertsCount: 0,
      lastSyncTime: new Date()
    };
  }

  private async syncMetrics(deviceId: number, lastSync?: Date): Promise<number> {
    // Sync heart rate, steps, sleep, etc. from Fitbit API
    return 0; // Placeholder
  }

  private async syncSessions(deviceId: number, lastSync?: Date): Promise<number> {
    // Sync workout sessions from Fitbit API
    return 0; // Placeholder
  }

  async getMetrics(deviceId: number, startDate: Date, endDate: Date): Promise<WearableMetric[]> {
    // Fetch specific metrics from Fitbit API
    return [];
  }

  async getSessions(deviceId: number, startDate: Date, endDate: Date): Promise<WearableSession[]> {
    // Fetch workout/sleep sessions from Fitbit API
    return [];
  }

  async disconnect(deviceId: number): Promise<void> {
    // Revoke Fitbit API tokens
    console.log(`Disconnecting Fitbit device ${deviceId}`);
  }
}

// Main Wearable Integration Service
export class WearableIntegrationService {
  private providers: Map<string, WearableDeviceProvider> = new Map();

  constructor() {
    // Register available providers
    this.providers.set('apple_watch', new AppleWatchProvider());
    this.providers.set('fitbit', new FitbitProvider());
    // Add more providers as needed
  }

  getProvider(deviceType: string): WearableDeviceProvider | undefined {
    return this.providers.get(deviceType);
  }

  async authenticateDevice(deviceType: string, credentials: any): Promise<AuthResult> {
    const provider = this.getProvider(deviceType);
    if (!provider) {
      return { success: false, error: `Unsupported device type: ${deviceType}` };
    }

    return provider.authenticate(credentials);
  }

  async syncDeviceData(device: WearableDevice): Promise<SyncResult> {
    const provider = this.getProvider(device.deviceType);
    if (!provider) {
      return { 
        success: false, 
        metricsCount: 0, 
        sessionsCount: 0, 
        alertsCount: 0,
        lastSyncTime: new Date(),
        errors: [`Unsupported device type: ${device.deviceType}`] 
      };
    }

    return provider.syncData(device.id, device.lastSync || undefined);
  }

  async getDeviceMetrics(device: WearableDevice, startDate: Date, endDate: Date): Promise<WearableMetric[]> {
    const provider = this.getProvider(device.deviceType);
    if (!provider) {
      return [];
    }

    return provider.getMetrics(device.id, startDate, endDate);
  }

  async getDeviceSessions(device: WearableDevice, startDate: Date, endDate: Date): Promise<WearableSession[]> {
    const provider = this.getProvider(device.deviceType);
    if (!provider) {
      return [];
    }

    return provider.getSessions(device.id, startDate, endDate);
  }

  async disconnectDevice(device: WearableDevice): Promise<void> {
    const provider = this.getProvider(device.deviceType);
    if (provider) {
      await provider.disconnect(device.id);
    }
  }

  // Utility methods for data processing
  normalizeMetricValue(value: number, fromUnit: string, toUnit: string): number {
    // Convert between different units (e.g., km to miles, kg to lbs)
    const conversions: Record<string, Record<string, number>> = {
      'km': { 'miles': 0.621371, 'meters': 1000 },
      'miles': { 'km': 1.60934, 'meters': 1609.34 },
      'kg': { 'lbs': 2.20462 },
      'lbs': { 'kg': 0.453592 }
    };

    if (fromUnit === toUnit) return value;
    
    const conversion = conversions[fromUnit]?.[toUnit];
    return conversion ? value * conversion : value;
  }

  calculateTrends(metrics: WearableMetric[]): any {
    // Calculate trends, averages, and patterns in wearable data
    if (metrics.length === 0) return null;

    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) acc[metric.metricType] = [];
      acc[metric.metricType].push(metric);
      return acc;
    }, {} as Record<string, WearableMetric[]>);

    const trends: any = {};
    
    for (const [type, typeMetrics] of Object.entries(grouped)) {
      const values = typeMetrics.map(m => m.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const latest = typeMetrics[typeMetrics.length - 1]?.value || 0;
      const previous = typeMetrics[typeMetrics.length - 2]?.value || latest;
      
      trends[type] = {
        average,
        latest,
        change: latest - previous,
        changePercent: previous !== 0 ? ((latest - previous) / previous) * 100 : 0,
        trend: latest > previous ? 'up' : latest < previous ? 'down' : 'stable'
      };
    }

    return trends;
  }
}

// Export singleton instance
export const wearableIntegrationService = new WearableIntegrationService();
