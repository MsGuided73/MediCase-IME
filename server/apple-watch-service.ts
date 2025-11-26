import type { 
  WearableDevice, 
  InsertWearableDevice, 
  WearableMetric, 
  InsertWearableMetric,
  WearableSession,
  InsertWearableSession 
} from "../shared/schema";

// Apple HealthKit Data Types
export interface HealthKitDataPoint {
  type: HealthKitDataType;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  metadata?: Record<string, any>;
}

export enum HealthKitDataType {
  // Activity
  STEPS = 'HKQuantityTypeIdentifierStepCount',
  DISTANCE_WALKING = 'HKQuantityTypeIdentifierDistanceWalkingRunning',
  ACTIVE_ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned',
  EXERCISE_TIME = 'HKQuantityTypeIdentifierAppleExerciseTime',
  STAND_TIME = 'HKQuantityTypeIdentifierAppleStandTime',
  
  // Heart
  HEART_RATE = 'HKQuantityTypeIdentifierHeartRate',
  RESTING_HEART_RATE = 'HKQuantityTypeIdentifierRestingHeartRate',
  HEART_RATE_VARIABILITY = 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  
  // Sleep
  SLEEP_ANALYSIS = 'HKCategoryTypeIdentifierSleepAnalysis',
  
  // Respiratory
  RESPIRATORY_RATE = 'HKQuantityTypeIdentifierRespiratoryRate',
  OXYGEN_SATURATION = 'HKQuantityTypeIdentifierOxygenSaturation',
  
  // Body Measurements
  BODY_MASS = 'HKQuantityTypeIdentifierBodyMass',
  HEIGHT = 'HKQuantityTypeIdentifierHeight',
  BODY_TEMPERATURE = 'HKQuantityTypeIdentifierBodyTemperature',
  BLOOD_PRESSURE_SYSTOLIC = 'HKQuantityTypeIdentifierBloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC = 'HKQuantityTypeIdentifierBloodPressureDiastolic'
}

// Apple Watch Service for HealthKit Integration
export class AppleWatchService {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  // Generate realistic mock data for Apple Watch metrics
  generateMockHealthKitData(days: number = 7): HealthKitDataPoint[] {
    const data: HealthKitDataPoint[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate daily metrics with realistic patterns
      data.push(...this.generateDayMetrics(date));
    }

    return data.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  private generateDayMetrics(date: Date): HealthKitDataPoint[] {
    const metrics: HealthKitDataPoint[] = [];
    
    // Base values that decline over time (simulating anemia progression)
    const daysSinceStart = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const anemiaFactor = 1 - (daysSinceStart * 0.02); // 2% decline per day
    
    // Steps (declining due to fatigue)
    const baseSteps = 8200;
    const steps = Math.floor(baseSteps * anemiaFactor * (0.8 + Math.random() * 0.4));
    metrics.push({
      type: HealthKitDataType.STEPS,
      value: steps,
      unit: 'count',
      startDate: new Date(date.setHours(0, 0, 0, 0)),
      endDate: new Date(date.setHours(23, 59, 59, 999))
    });

    // Heart Rate (increasing due to cardiac compensation)
    const baseRestingHR = 68;
    const restingHR = Math.floor(baseRestingHR + (daysSinceStart * 0.3) + (Math.random() * 4 - 2));
    metrics.push({
      type: HealthKitDataType.RESTING_HEART_RATE,
      value: restingHR,
      unit: 'count/min',
      startDate: new Date(date.setHours(6, 0, 0, 0)),
      endDate: new Date(date.setHours(6, 0, 0, 0))
    });

    // Heart Rate Variability (declining due to stress)
    const baseHRV = 35;
    const hrv = Math.floor(baseHRV * anemiaFactor * (0.9 + Math.random() * 0.2));
    metrics.push({
      type: HealthKitDataType.HEART_RATE_VARIABILITY,
      value: hrv,
      unit: 'ms',
      startDate: new Date(date.setHours(6, 0, 0, 0)),
      endDate: new Date(date.setHours(6, 0, 0, 0))
    });

    // Oxygen Saturation (slightly declining)
    const baseSpO2 = 98;
    const spO2 = Math.floor(baseSpO2 - (daysSinceStart * 0.05) + (Math.random() * 2 - 1));
    metrics.push({
      type: HealthKitDataType.OXYGEN_SATURATION,
      value: Math.max(95, spO2),
      unit: '%',
      startDate: new Date(date.setHours(22, 0, 0, 0)),
      endDate: new Date(date.setHours(22, 0, 0, 0))
    });

    // Active Energy (declining due to reduced activity)
    const baseActiveEnergy = 450;
    const activeEnergy = Math.floor(baseActiveEnergy * anemiaFactor * (0.7 + Math.random() * 0.6));
    metrics.push({
      type: HealthKitDataType.ACTIVE_ENERGY,
      value: activeEnergy,
      unit: 'kcal',
      startDate: new Date(date.setHours(0, 0, 0, 0)),
      endDate: new Date(date.setHours(23, 59, 59, 999))
    });

    // Exercise Time (declining)
    const baseExerciseTime = 35;
    const exerciseTime = Math.floor(baseExerciseTime * anemiaFactor * (0.6 + Math.random() * 0.8));
    metrics.push({
      type: HealthKitDataType.EXERCISE_TIME,
      value: exerciseTime,
      unit: 'min',
      startDate: new Date(date.setHours(0, 0, 0, 0)),
      endDate: new Date(date.setHours(23, 59, 59, 999))
    });

    return metrics;
  }

  // Generate sleep data with declining quality
  generateMockSleepData(days: number = 7): WearableSession[] {
    const sessions: WearableSession[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const daysSinceStart = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      const sleepQualityFactor = 1 - (daysSinceStart * 0.015); // 1.5% decline per day

      // Sleep session (previous night)
      const sleepStart = new Date(date);
      sleepStart.setHours(22, 30 + Math.random() * 60, 0, 0);
      sleepStart.setDate(sleepStart.getDate() - 1);
      
      const baseSleepDuration = 7.5; // hours
      const sleepDuration = baseSleepDuration * sleepQualityFactor * (0.85 + Math.random() * 0.3);
      
      const sleepEnd = new Date(sleepStart);
      sleepEnd.setHours(sleepEnd.getHours() + sleepDuration);

      // Calculate sleep stages
      const totalMinutes = sleepDuration * 60;
      const deepSleepPercent = 0.20 * sleepQualityFactor; // Deep sleep declines with anemia
      const remSleepPercent = 0.25;
      const lightSleepPercent = 1 - deepSleepPercent - remSleepPercent;

      sessions.push({
        id: 0, // Will be set by database
        deviceId: 1, // Assuming device ID 1 for Apple Watch
        sessionType: 'sleep',
        startTime: sleepStart,
        endTime: sleepEnd,
        duration: Math.floor(totalMinutes),
        calories: Math.floor(60 + Math.random() * 20), // Calories burned during sleep
        averageHeartRate: Math.floor(55 + Math.random() * 10),
        maxHeartRate: Math.floor(75 + Math.random() * 15),
        steps: 0,
        distance: 0,
        metadata: {
          sleepStages: {
            deep: Math.floor(totalMinutes * deepSleepPercent),
            rem: Math.floor(totalMinutes * remSleepPercent),
            light: Math.floor(totalMinutes * lightSleepPercent)
          },
          sleepEfficiency: Math.floor(sleepQualityFactor * 90 + Math.random() * 10),
          restlessness: Math.floor((1 - sleepQualityFactor) * 15 + Math.random() * 5),
          timeToFallAsleep: Math.floor(8 + (1 - sleepQualityFactor) * 12 + Math.random() * 5)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return sessions;
  }

  // Convert HealthKit data to WearableMetric format
  convertToWearableMetrics(healthKitData: HealthKitDataPoint[], deviceId: number): InsertWearableMetric[] {
    return healthKitData.map(dataPoint => ({
      deviceId,
      metricType: this.mapHealthKitTypeToMetricType(dataPoint.type),
      value: dataPoint.value,
      unit: dataPoint.unit,
      timestamp: dataPoint.startDate,
      metadata: {
        healthKitType: dataPoint.type,
        endDate: dataPoint.endDate,
        ...dataPoint.metadata
      }
    }));
  }

  private mapHealthKitTypeToMetricType(healthKitType: HealthKitDataType): string {
    const mapping: Record<HealthKitDataType, string> = {
      [HealthKitDataType.STEPS]: 'steps',
      [HealthKitDataType.HEART_RATE]: 'heart_rate',
      [HealthKitDataType.RESTING_HEART_RATE]: 'resting_heart_rate',
      [HealthKitDataType.HEART_RATE_VARIABILITY]: 'heart_rate_variability',
      [HealthKitDataType.OXYGEN_SATURATION]: 'oxygen_saturation',
      [HealthKitDataType.ACTIVE_ENERGY]: 'active_energy',
      [HealthKitDataType.EXERCISE_TIME]: 'exercise_time',
      [HealthKitDataType.DISTANCE_WALKING]: 'distance_walking',
      [HealthKitDataType.RESPIRATORY_RATE]: 'respiratory_rate',
      [HealthKitDataType.BODY_MASS]: 'body_mass',
      [HealthKitDataType.HEIGHT]: 'height',
      [HealthKitDataType.BODY_TEMPERATURE]: 'body_temperature',
      [HealthKitDataType.BLOOD_PRESSURE_SYSTOLIC]: 'blood_pressure_systolic',
      [HealthKitDataType.BLOOD_PRESSURE_DIASTOLIC]: 'blood_pressure_diastolic',
      [HealthKitDataType.SLEEP_ANALYSIS]: 'sleep_analysis',
      [HealthKitDataType.STAND_TIME]: 'stand_time'
    };

    return mapping[healthKitType] || 'unknown';
  }

  // Calculate stress score based on HRV and heart rate
  calculateStressScore(hrv: number, restingHR: number, baselineHRV: number = 35, baselineHR: number = 68): number {
    const hrvStress = Math.max(0, (baselineHRV - hrv) / baselineHRV * 50);
    const hrStress = Math.max(0, (restingHR - baselineHR) / baselineHR * 50);
    return Math.min(100, Math.floor(hrvStress + hrStress));
  }

  // Generate comprehensive daily summary
  generateDailySummary(date: Date): any {
    const healthKitData = this.generateDayMetrics(date);
    const sleepData = this.generateMockSleepData(1)[0];

    const steps = healthKitData.find(d => d.type === HealthKitDataType.STEPS)?.value || 0;
    const restingHR = healthKitData.find(d => d.type === HealthKitDataType.RESTING_HEART_RATE)?.value || 68;
    const hrv = healthKitData.find(d => d.type === HealthKitDataType.HEART_RATE_VARIABILITY)?.value || 35;
    const spO2 = healthKitData.find(d => d.type === HealthKitDataType.OXYGEN_SATURATION)?.value || 98;
    const activeEnergy = healthKitData.find(d => d.type === HealthKitDataType.ACTIVE_ENERGY)?.value || 400;
    const exerciseTime = healthKitData.find(d => d.type === HealthKitDataType.EXERCISE_TIME)?.value || 30;

    return {
      date: date.toISOString().split('T')[0],
      metrics: {
        steps,
        restingHeartRate: restingHR,
        heartRateVariability: hrv,
        oxygenSaturation: spO2,
        activeEnergy,
        exerciseTime,
        stressScore: this.calculateStressScore(hrv, restingHR)
      },
      sleep: sleepData ? {
        duration: Math.floor(sleepData.duration / 60 * 10) / 10, // Convert to hours
        efficiency: sleepData.metadata?.sleepEfficiency || 85,
        deepSleep: Math.floor((sleepData.metadata?.sleepStages?.deep || 0) / 60 * 10) / 10,
        remSleep: Math.floor((sleepData.metadata?.sleepStages?.rem || 0) / 60 * 10) / 10,
        restlessness: sleepData.metadata?.restlessness || 5
      } : null,
      trends: {
        stepsVsBaseline: ((steps - 8200) / 8200 * 100).toFixed(1),
        heartRateVsBaseline: ((restingHR - 68) / 68 * 100).toFixed(1),
        hrvVsBaseline: ((hrv - 35) / 35 * 100).toFixed(1)
      }
    };
  }
}

export default AppleWatchService;
