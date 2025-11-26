import { Router } from 'express';
import { z } from 'zod';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { getStorageInstance } from '../storage';
import AppleWatchService from '../apple-watch-service';
import { WearableIntegrationService } from '../wearable-integration-service';
import type { 
  WearableDevice, 
  InsertWearableDevice, 
  WearableMetric, 
  InsertWearableMetric,
  WearableSession,
  InsertWearableSession 
} from '../../shared/schema';

const router = Router();
const wearableService = new WearableIntegrationService();

// Validation schemas
const connectDeviceSchema = z.object({
  deviceType: z.enum(['apple_watch', 'fitbit', 'garmin', 'samsung_health', 'google_fit']),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  credentials: z.object({}).optional()
});

const syncDataSchema = z.object({
  deviceId: z.number(),
  forceSync: z.boolean().default(false)
});

// GET /api/wearable/devices - Get user's connected devices
router.get('/devices', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const storage = getStorageInstance();
    const devices = await storage.getWearableDevices(req.user.id);
    
    res.json({
      success: true,
      devices: devices.map(device => ({
        ...device,
        // Don't expose sensitive credentials
        apiCredentials: device.apiCredentials ? { connected: true } : { connected: false }
      }))
    });
  } catch (error) {
    console.error('Error fetching wearable devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wearable devices'
    });
  }
});

// POST /api/wearable/connect - Connect a new wearable device
router.post('/connect', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const { deviceType, deviceName, deviceModel, credentials } = connectDeviceSchema.parse(req.body);
    const storage = getStorageInstance();

    // For Apple Watch, we'll create a mock device for demo purposes
    if (deviceType === 'apple_watch') {
      const deviceData: InsertWearableDevice = {
        userId: req.user.id,
        deviceType: 'apple_watch',
        deviceName: deviceName || 'Apple Watch',
        deviceId: `apple_watch_${req.user.id}_${Date.now()}`,
        deviceModel: deviceModel || 'Apple Watch Series 8',
        firmwareVersion: '10.1',
        lastSync: new Date(),
        syncFrequency: 60,
        isActive: true,
        connectionStatus: 'connected',
        apiCredentials: {
          connected: true,
          userId: req.user.id.toString()
        }
      };

      const device = await storage.createWearableDevice(deviceData);
      
      // Generate initial mock data
      const appleWatchService = new AppleWatchService(req.user.id);
      const mockData = appleWatchService.generateMockHealthKitData(7);
      const mockSleepData = appleWatchService.generateMockSleepData(7);
      
      // Convert and store metrics
      const metrics = appleWatchService.convertToWearableMetrics(mockData, device.id);
      await storage.createWearableMetrics(metrics);
      
      // Store sleep sessions
      const sessionsWithDeviceId = mockSleepData.map(session => ({
        ...session,
        deviceId: device.id
      }));
      await storage.createWearableSessions(sessionsWithDeviceId);

      res.json({
        success: true,
        device: {
          ...device,
          apiCredentials: { connected: true }
        },
        message: 'Apple Watch connected successfully with 7 days of sample data'
      });
    } else {
      // For other devices, use the wearable service
      const authResult = await wearableService.authenticateDevice(deviceType, credentials || {});
      
      if (!authResult.success) {
        return res.status(400).json({
          success: false,
          error: authResult.error || 'Authentication failed'
        });
      }

      const deviceData: InsertWearableDevice = {
        userId: req.user.id,
        deviceType,
        deviceName: deviceName || `${deviceType} Device`,
        deviceId: `${deviceType}_${req.user.id}_${Date.now()}`,
        deviceModel: deviceModel || 'Unknown',
        lastSync: new Date(),
        syncFrequency: 60,
        isActive: true,
        connectionStatus: 'connected',
        apiCredentials: {
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken,
          tokenExpiry: authResult.tokenExpiry?.toISOString(),
          userId: authResult.userId
        }
      };

      const device = await storage.createWearableDevice(deviceData);

      res.json({
        success: true,
        device: {
          ...device,
          apiCredentials: { connected: true }
        }
      });
    }
  } catch (error) {
    console.error('Error connecting wearable device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect wearable device'
    });
  }
});

// POST /api/wearable/sync - Sync data from a specific device
router.post('/sync', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const { deviceId, forceSync } = syncDataSchema.parse(req.body);
    const storage = getStorageInstance();

    const device = await storage.getWearableDevice(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    if (device.deviceType === 'apple_watch') {
      // Generate new mock data for Apple Watch
      const appleWatchService = new AppleWatchService(req.user.id);
      const mockData = appleWatchService.generateMockHealthKitData(1); // Last 1 day
      const mockSleepData = appleWatchService.generateMockSleepData(1);
      
      // Convert and store new metrics
      const metrics = appleWatchService.convertToWearableMetrics(mockData, device.id);
      await storage.createWearableMetrics(metrics);
      
      // Store new sleep sessions
      const sessionsWithDeviceId = mockSleepData.map(session => ({
        ...session,
        deviceId: device.id
      }));
      await storage.createWearableSessions(sessionsWithDeviceId);

      // Update last sync time
      await storage.updateWearableDevice(deviceId, { lastSync: new Date() });

      res.json({
        success: true,
        syncResult: {
          success: true,
          metricsCount: metrics.length,
          sessionsCount: mockSleepData.length,
          alertsCount: 0,
          lastSyncTime: new Date()
        }
      });
    } else {
      // Use wearable service for other devices
      const syncResult = await wearableService.syncDeviceData(device);
      
      res.json({
        success: true,
        syncResult
      });
    }
  } catch (error) {
    console.error('Error syncing wearable data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync wearable data'
    });
  }
});

// GET /api/wearable/metrics/:deviceId - Get metrics for a specific device
router.get('/metrics/:deviceId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const days = parseInt(req.query.days as string) || 7;
    const storage = getStorageInstance();

    const device = await storage.getWearableDevice(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const metrics = await storage.getWearableMetrics(deviceId, startDate, new Date());
    
    res.json({
      success: true,
      metrics,
      device: {
        id: device.id,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        lastSync: device.lastSync
      }
    });
  } catch (error) {
    console.error('Error fetching wearable metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wearable metrics'
    });
  }
});

// GET /api/wearable/sessions/:deviceId - Get sessions for a specific device
router.get('/sessions/:deviceId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const days = parseInt(req.query.days as string) || 7;
    const storage = getStorageInstance();

    const device = await storage.getWearableDevice(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const sessions = await storage.getWearableSessions(deviceId, startDate, new Date());
    
    res.json({
      success: true,
      sessions,
      device: {
        id: device.id,
        deviceType: device.deviceType,
        deviceName: device.deviceName,
        lastSync: device.lastSync
      }
    });
  } catch (error) {
    console.error('Error fetching wearable sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wearable sessions'
    });
  }
});

// GET /api/wearable/summary/:deviceId - Get daily summary for Apple Watch
router.get('/summary/:deviceId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const storage = getStorageInstance();

    const device = await storage.getWearableDevice(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    if (device.deviceType === 'apple_watch') {
      const appleWatchService = new AppleWatchService(req.user.id);
      const summary = appleWatchService.generateDailySummary(date);
      
      res.json({
        success: true,
        summary,
        device: {
          id: device.id,
          deviceType: device.deviceType,
          deviceName: device.deviceName
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Daily summary only available for Apple Watch'
      });
    }
  } catch (error) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily summary'
    });
  }
});

// DELETE /api/wearable/disconnect/:deviceId - Disconnect a device
router.delete('/disconnect/:deviceId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const storage = getStorageInstance();

    const device = await storage.getWearableDevice(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Disconnect through wearable service
    await wearableService.disconnectDevice(device);
    
    // Update device status
    await storage.updateWearableDevice(deviceId, { 
      isActive: false, 
      connectionStatus: 'disconnected' 
    });

    res.json({
      success: true,
      message: 'Device disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting wearable device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect wearable device'
    });
  }
});

export default router;
