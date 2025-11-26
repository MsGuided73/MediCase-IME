import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Watch, 
  Heart, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Wind,
  Brain,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

interface HeartRateData {
  timestamp: Date;
  heartRate: number;
  hrv: number; // Heart Rate Variability
  stressLevel: number; // 1-5 scale derived from HRV
}

interface StressAlert {
  id: string;
  timestamp: Date;
  level: 'mild' | 'moderate' | 'high';
  message: string;
  suggestion: string;
}

interface AppleWatchStressMonitorProps {
  onStressAlert?: (alert: StressAlert) => void;
  onInterventionTriggered?: (type: string) => void;
}

const AppleWatchStressMonitor: React.FC<AppleWatchStressMonitorProps> = ({ 
  onStressAlert, 
  onInterventionTriggered 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const [currentHRV, setCurrentHRV] = useState<number | null>(null);
  const [currentStressLevel, setCurrentStressLevel] = useState<number | null>(null);
  const [recentData, setRecentData] = useState<HeartRateData[]>([]);
  const [alerts, setAlerts] = useState<StressAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate Apple Watch connection
    checkWatchConnection();
    
    if (isConnected && isMonitoring) {
      const interval = setInterval(() => {
        generateMockData();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isConnected, isMonitoring]);

  const checkWatchConnection = async () => {
    // In a real app, this would check for actual Apple Watch connectivity
    // For demo purposes, we'll simulate connection
    try {
      // Simulate API call to check watch connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
      setLastSync(new Date());
    } catch (error) {
      setIsConnected(false);
    }
  };

  const generateMockData = () => {
    // Generate realistic heart rate and HRV data
    const baseHeartRate = 70;
    const heartRateVariation = Math.random() * 20 - 10; // ±10 bpm
    const heartRate = Math.max(50, Math.min(120, baseHeartRate + heartRateVariation));
    
    // HRV typically ranges from 20-50ms for healthy adults
    const baseHRV = 35;
    const hrvVariation = Math.random() * 20 - 10;
    const hrv = Math.max(15, Math.min(60, baseHRV + hrvVariation));
    
    // Calculate stress level based on HRV (lower HRV = higher stress)
    const stressLevel = hrv < 25 ? 4 : hrv < 30 ? 3 : hrv < 35 ? 2 : 1;
    
    const newData: HeartRateData = {
      timestamp: new Date(),
      heartRate: Math.round(heartRate),
      hrv: Math.round(hrv),
      stressLevel
    };

    setCurrentHeartRate(newData.heartRate);
    setCurrentHRV(newData.hrv);
    setCurrentStressLevel(newData.stressLevel);
    setRecentData(prev => [newData, ...prev.slice(0, 19)]); // Keep last 20 readings
    setLastSync(new Date());

    // Check for stress alerts
    checkForStressAlerts(newData);
  };

  const checkForStressAlerts = (data: HeartRateData) => {
    if (data.stressLevel >= 4) {
      const alert: StressAlert = {
        id: Date.now().toString(),
        timestamp: data.timestamp,
        level: data.stressLevel === 5 ? 'high' : 'moderate',
        message: data.stressLevel === 5 
          ? 'High stress detected. Your heart rate variability suggests significant stress.'
          : 'Elevated stress detected. Consider taking a moment to breathe.',
        suggestion: data.stressLevel === 5
          ? 'Try a 5-minute breathing exercise or step away from stressful activities.'
          : 'A quick 2-minute breathing exercise might help you feel more centered.'
      };

      setAlerts(prev => [alert, ...prev.slice(0, 4)]);
      
      if (onStressAlert) {
        onStressAlert(alert);
      }

      // Auto-suggest intervention
      if (data.stressLevel >= 4) {
        suggestIntervention();
      }
    }
  };

  const suggestIntervention = () => {
    const interventions = [
      { type: 'breathing', name: '4-7-8 Breathing', duration: '2 min' },
      { type: 'mindfulness', name: 'Quick Body Scan', duration: '3 min' },
      { type: 'movement', name: 'Gentle Stretching', duration: '5 min' }
    ];

    const suggested = interventions[Math.floor(Math.random() * interventions.length)];
    
    if (onInterventionTriggered) {
      onInterventionTriggered(suggested.type);
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    generateMockData(); // Get initial reading
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const getStressLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-500';
      case 2: return 'text-yellow-500';
      case 3: return 'text-orange-500';
      case 4: return 'text-red-500';
      case 5: return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStressLevelText = (level: number) => {
    switch (level) {
      case 1: return 'Very Calm';
      case 2: return 'Relaxed';
      case 3: return 'Neutral';
      case 4: return 'Stressed';
      case 5: return 'Very Stressed';
      default: return 'Unknown';
    }
  };

  const calculateAverageStress = () => {
    if (recentData.length === 0) return 0;
    const sum = recentData.reduce((acc, data) => acc + data.stressLevel, 0);
    return Math.round((sum / recentData.length) * 10) / 10;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Watch className="w-6 h-6 text-blue-500" />
            <span>Apple Watch Stress Monitor</span>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
              {lastSync && (
                <p className="text-sm text-gray-500">
                  Last sync: {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="space-x-2">
              {!isConnected && (
                <Button onClick={checkWatchConnection} variant="outline">
                  Reconnect
                </Button>
              )}
              {isConnected && (
                <Button
                  onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  className={isMonitoring ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                >
                  {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Readings */}
      {isConnected && isMonitoring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-500">
                {currentHeartRate || '--'}
              </div>
              <p className="text-sm text-gray-500">BPM</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-500">
                {currentHRV || '--'}
              </div>
              <p className="text-sm text-gray-500">HRV (ms)</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Brain className={`w-8 h-8 mx-auto mb-2 ${getStressLevelColor(currentStressLevel || 0)}`} />
              <div className={`text-2xl font-bold ${getStressLevelColor(currentStressLevel || 0)}`}>
                {currentStressLevel || '--'}
              </div>
              <p className="text-sm text-gray-500">
                {currentStressLevel ? getStressLevelText(currentStressLevel) : 'Stress Level'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stress Trend */}
      {recentData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Stress Trend (Last 20 readings)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Stress Level:</span>
                <span className={`font-bold ${getStressLevelColor(Math.round(calculateAverageStress()))}`}>
                  {calculateAverageStress()}/5
                </span>
              </div>
              
              <div className="grid grid-cols-10 gap-1">
                {recentData.slice(0, 10).reverse().map((data, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className={`h-8 rounded ${
                        data.stressLevel === 1 ? 'bg-green-200' :
                        data.stressLevel === 2 ? 'bg-yellow-200' :
                        data.stressLevel === 3 ? 'bg-orange-200' :
                        data.stressLevel === 4 ? 'bg-red-200' :
                        'bg-red-300'
                      }`}
                      title={`${data.timestamp.toLocaleTimeString()}: Stress Level ${data.stressLevel}`}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {data.timestamp.toLocaleTimeString().slice(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <span>Recent Stress Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="border-l-4 border-orange-300 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium ${
                      alert.level === 'high' ? 'text-red-600' : 
                      alert.level === 'moderate' ? 'text-orange-600' : 
                      'text-yellow-600'
                    }`}>
                      {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)} Stress Alert
                    </span>
                    <span className="text-sm text-gray-500">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                  <p className="text-sm text-blue-600 font-medium">{alert.suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Interventions */}
      {currentStressLevel && currentStressLevel >= 3 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Wind className="w-5 h-5" />
              <span>Suggested Stress Relief</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => onInterventionTriggered?.('breathing')}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Wind className="w-4 h-4 mr-2" />
                Breathing Exercise
              </Button>
              <Button 
                onClick={() => onInterventionTriggered?.('mindfulness')}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Brain className="w-4 h-4 mr-2" />
                Quick Meditation
              </Button>
              <Button 
                onClick={() => onInterventionTriggered?.('movement')}
                variant="outline" 
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <Zap className="w-4 h-4 mr-2" />
                Gentle Movement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>Stress Management Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <div>
              <h4 className="font-medium mb-2">For Better HRV:</h4>
              <ul className="space-y-1">
                <li>• Practice deep breathing daily</li>
                <li>• Get 7-9 hours of quality sleep</li>
                <li>• Stay hydrated throughout the day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Stress Reduction:</h4>
              <ul className="space-y-1">
                <li>• Take regular breaks from work</li>
                <li>• Practice mindfulness meditation</li>
                <li>• Engage in gentle physical activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppleWatchStressMonitor;
