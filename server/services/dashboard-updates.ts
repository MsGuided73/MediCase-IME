/**
 * Real-time Dashboard Updates Service
 * Integrates with existing medical dashboard APIs for live lab result notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { getStorageInstance } from '../storage';
import { triggerAIAnalysis } from './ai-analysis-trigger';

interface DashboardUpdate {
  type: 'LAB_RESULTS' | 'CRITICAL_VALUE' | 'AI_ANALYSIS' | 'BATCH_STATUS';
  patientId: string;
  data: any;
  timestamp: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

let io: SocketIOServer | null = null;

/**
 * Initialize WebSocket server for real-time dashboard updates
 */
export function initializeDashboardWebSocket(socketServer: SocketIOServer) {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log(`📱 Dashboard client connected: ${socket.id}`);

    // Handle patient dashboard subscription
    socket.on('subscribe-patient-dashboard', async (data) => {
      const { patientId, userRole } = data;
      
      // Verify user has access to this patient's data
      const hasAccess = await verifyPatientAccess(socket.userId, patientId, userRole);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to patient data' });
        return;
      }

      // Join patient-specific room
      socket.join(`patient-${patientId}`);
      console.log(`👤 User ${socket.userId} subscribed to patient ${patientId} dashboard`);

      // Send current dashboard state
      const dashboardData = await getCurrentDashboardState(patientId);
      socket.emit('dashboard-state', dashboardData);
    });

    // Handle physician dashboard subscription
    socket.on('subscribe-physician-dashboard', async (data) => {
      const { physicianId } = data;
      
      // Verify physician identity
      if (socket.userId !== physicianId) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Join physician-specific room
      socket.join(`physician-${physicianId}`);
      console.log(`👨‍⚕️ Physician ${physicianId} subscribed to dashboard`);

      // Send physician dashboard data
      const physicianDashboard = await getPhysicianDashboardState(physicianId);
      socket.emit('physician-dashboard-state', physicianDashboard);
    });

    // Handle lab batch status subscription
    socket.on('subscribe-batch-status', async (data) => {
      const { batchId } = data;
      socket.join(`batch-${batchId}`);
      console.log(`📊 Client subscribed to batch ${batchId} status`);
    });

    socket.on('disconnect', () => {
      console.log(`📱 Dashboard client disconnected: ${socket.id}`);
    });
  });

  console.log('🔄 Dashboard WebSocket server initialized');
}

/**
 * Update medical dashboard when new lab results arrive
 */
export async function updateMedicalDashboard(patientId: string, labReportId: number) {
  if (!io) {
    console.warn('⚠️ WebSocket server not initialized');
    return;
  }

  try {
    const storage = getStorageInstance();
    
    // Get lab report and values
    const [labReport, labValues] = await Promise.all([
      storage.getLabReport(labReportId),
      storage.getLabValues(labReportId)
    ]);

    // Check for critical values
    const criticalValues = labValues.filter(v => v.criticalFlag);
    const abnormalValues = labValues.filter(v => v.abnormalFlag !== 'NORMAL');

    // Prepare dashboard update
    const dashboardUpdate: DashboardUpdate = {
      type: 'LAB_RESULTS',
      patientId,
      data: {
        labReportId,
        reportDate: labReport.reportDate,
        laboratoryName: labReport.laboratoryName,
        totalValues: labValues.length,
        abnormalValues: abnormalValues.length,
        criticalValues: criticalValues.length,
        values: labValues.map(v => ({
          testName: v.testName,
          value: v.value,
          unit: v.unit,
          abnormalFlag: v.abnormalFlag,
          criticalFlag: v.criticalFlag
        }))
      },
      timestamp: new Date().toISOString(),
      urgency: criticalValues.length > 0 ? 'CRITICAL' : abnormalValues.length > 0 ? 'HIGH' : 'MEDIUM'
    };

    // Send to patient dashboard
    io.to(`patient-${patientId}`).emit('lab-results-update', dashboardUpdate);

    // Send to associated physicians
    const physicians = await storage.getPatientPhysicians(patientId);
    for (const physician of physicians) {
      io.to(`physician-${physician.id}`).emit('patient-lab-update', {
        ...dashboardUpdate,
        patientInfo: {
          id: patientId,
          name: `Patient ${patientId}` // Would get actual name in production
        }
      });
    }

    // If critical values, send urgent notifications
    if (criticalValues.length > 0) {
      await sendCriticalValueNotifications(patientId, criticalValues, physicians);
    }

    console.log(`📊 Dashboard updated for patient ${patientId}: ${labValues.length} values, ${criticalValues.length} critical`);

  } catch (error) {
    console.error('❌ Failed to update medical dashboard:', error);
  }
}

/**
 * Send critical value notifications
 */
async function sendCriticalValueNotifications(patientId: string, criticalValues: any[], physicians: any[]) {
  if (!io) return;

  const criticalUpdate: DashboardUpdate = {
    type: 'CRITICAL_VALUE',
    patientId,
    data: {
      criticalValues: criticalValues.map(v => ({
        testName: v.testName,
        value: v.value,
        unit: v.unit,
        normalRange: v.normalRange
      })),
      requiresImmediateAttention: true,
      alertLevel: 'CRITICAL'
    },
    timestamp: new Date().toISOString(),
    urgency: 'CRITICAL'
  };

  // Send critical alert to patient
  io.to(`patient-${patientId}`).emit('critical-value-alert', criticalUpdate);

  // Send urgent alerts to physicians
  for (const physician of physicians) {
    io.to(`physician-${physician.id}`).emit('critical-value-alert', {
      ...criticalUpdate,
      patientInfo: {
        id: patientId,
        name: `Patient ${patientId}`,
        contact: 'Contact info would be here'
      }
    });
  }

  console.log(`🚨 Critical value alerts sent for patient ${patientId}`);
}

/**
 * Update AI analysis progress
 */
export async function updateAIAnalysisProgress(labReportId: number, progress: any) {
  if (!io) return;

  try {
    const storage = getStorageInstance();
    const labReport = await storage.getLabReport(labReportId);
    
    const analysisUpdate: DashboardUpdate = {
      type: 'AI_ANALYSIS',
      patientId: labReport.userId.toString(),
      data: {
        labReportId,
        progress: progress.progress || 0,
        stage: progress.stage || 'processing',
        estimatedCompletion: progress.estimatedCompletion,
        analysisTypes: progress.analysisTypes || []
      },
      timestamp: new Date().toISOString(),
      urgency: 'LOW'
    };

    // Send to patient dashboard
    io.to(`patient-${labReport.userId}`).emit('ai-analysis-progress', analysisUpdate);

    // Send to physicians
    const physicians = await storage.getPatientPhysicians(labReport.userId.toString());
    for (const physician of physicians) {
      io.to(`physician-${physician.id}`).emit('ai-analysis-progress', analysisUpdate);
    }

  } catch (error) {
    console.error('❌ Failed to update AI analysis progress:', error);
  }
}

/**
 * Update batch processing status
 */
export async function updateBatchStatus(batchId: string, status: any) {
  if (!io) return;

  const batchUpdate = {
    batchId,
    status: status.status,
    progress: status.processedResults / status.totalResults * 100,
    processedResults: status.processedResults,
    totalResults: status.totalResults,
    failedResults: status.failedResults,
    timestamp: new Date().toISOString()
  };

  // Send to batch subscribers
  io.to(`batch-${batchId}`).emit('batch-status-update', batchUpdate);

  console.log(`📊 Batch status updated: ${batchId} - ${status.status}`);
}

/**
 * Get current dashboard state for a patient
 */
async function getCurrentDashboardState(patientId: string) {
  const storage = getStorageInstance();

  try {
    // Get recent lab reports
    const labReports = await storage.getLabReports(patientId, 5);
    
    // Get pending AI analyses
    const pendingAnalyses = await storage.getPendingAIAnalyses(patientId);
    
    // Get active critical alerts
    const criticalAlerts = await storage.getActiveCriticalAlerts(patientId);

    // Get latest medical dashboard data
    const dashboardData = await storage.getMedicalDashboardData(patientId);

    return {
      patientId,
      recentLabReports: labReports.length,
      pendingAnalyses: pendingAnalyses.length,
      activeCriticalAlerts: criticalAlerts.length,
      lastUpdated: new Date().toISOString(),
      dashboardData
    };

  } catch (error) {
    console.error('❌ Failed to get dashboard state:', error);
    return {
      patientId,
      error: 'Failed to load dashboard data',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Get physician dashboard state
 */
async function getPhysicianDashboardState(physicianId: string) {
  const storage = getStorageInstance();

  try {
    // Get physician's patients with recent activity
    const patients = await storage.getPhysicianPatients(physicianId);
    
    // Get critical alerts for all patients
    const criticalAlerts = await storage.getPhysicianCriticalAlerts(physicianId);
    
    // Get pending reviews
    const pendingReviews = await storage.getPendingPhysicianReviews(physicianId);

    return {
      physicianId,
      totalPatients: patients.length,
      activeCriticalAlerts: criticalAlerts.length,
      pendingReviews: pendingReviews.length,
      recentActivity: await storage.getPhysicianRecentActivity(physicianId),
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to get physician dashboard state:', error);
    return {
      physicianId,
      error: 'Failed to load physician dashboard',
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Verify user has access to patient data
 */
async function verifyPatientAccess(userId: string, patientId: string, userRole: string): Promise<boolean> {
  const storage = getStorageInstance();

  try {
    // If user is the patient themselves
    if (userId === patientId) {
      return true;
    }

    // If user is a physician
    if (userRole === 'physician') {
      const relationship = await storage.getPatientPhysicianRelationship(patientId, userId);
      return relationship && relationship.is_active;
    }

    // If user is healthcare staff with appropriate permissions
    if (userRole === 'healthcare_staff') {
      const permissions = await storage.getUserPermissions(userId);
      return permissions.includes('view_patient_data');
    }

    return false;

  } catch (error) {
    console.error('❌ Failed to verify patient access:', error);
    return false;
  }
}

/**
 * Send push notifications for mobile apps
 */
export async function sendMobileNotification(userId: string, notification: any) {
  // This would integrate with push notification services like FCM or APNS
  console.log(`📱 Mobile notification for user ${userId}:`, notification);
  
  // For now, send via WebSocket if user is connected
  if (io) {
    io.to(`patient-${userId}`).emit('mobile-notification', notification);
  }
}
