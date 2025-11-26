import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WearableMetric {
  label: string;
  value: string;
  unit: string;
  status: 'good' | 'fair' | 'poor';
  trend: 'up' | 'down' | 'stable';
  change: string;
  icon: string;
}

interface SleepData {
  totalSleep: string;
  deepSleep: string;
  remSleep: string;
  efficiency: string;
  quality: 'good' | 'fair' | 'poor';
}

const wearableMetrics: WearableMetric[] = [
  {
    label: 'Steps',
    value: '5,420',
    unit: 'steps',
    status: 'poor',
    trend: 'down',
    change: '-34% vs 6mo ago',
    icon: '👟'
  },
  {
    label: 'Heart Rate',
    value: '76',
    unit: 'bpm',
    status: 'fair',
    trend: 'up',
    change: '+8 bpm vs baseline',
    icon: '💓'
  },
  {
    label: 'HRV',
    value: '28',
    unit: 'ms',
    status: 'poor',
    trend: 'down',
    change: '-15% vs baseline',
    icon: '📊'
  },
  {
    label: 'SpO2',
    value: '97%',
    unit: '',
    status: 'good',
    trend: 'stable',
    change: 'Normal range',
    icon: '🫁'
  },
  {
    label: 'Stress Level',
    value: '68',
    unit: '/100',
    status: 'poor',
    trend: 'up',
    change: '+31% vs baseline',
    icon: '😰'
  },
  {
    label: 'Active Minutes',
    value: '18',
    unit: 'min',
    status: 'poor',
    trend: 'down',
    change: '-42% vs 6mo ago',
    icon: '🏃‍♀️'
  }
];

const sleepData: SleepData = {
  totalSleep: '6h 45m',
  deepSleep: '1h 12m',
  remSleep: '1h 38m',
  efficiency: '78%',
  quality: 'poor'
};

const getStatusStyles = (status: 'good' | 'fair' | 'poor') => {
  switch (status) {
    case 'good':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'fair':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'poor':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'stable':
    default:
      return '➡️';
  }
};

export const WearableMetricsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,16.41 16.41,20 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>
          </svg>
          Wearable Metrics (Last 7 Days)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wearableMetrics.map((metric, index) => (
            <Card key={index} className={cn('border-2', getStatusStyles(metric.status))}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{metric.icon}</span>
                    <span className="font-medium text-gray-700 text-sm">{metric.label}</span>
                  </div>
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                </div>
                
                <div className="text-2xl font-bold text-gray-800 mb-1">
                  {metric.value}
                  {metric.unit && <span className="text-sm font-normal text-gray-600 ml-1">{metric.unit}</span>}
                </div>
                
                <div className="text-xs text-gray-600">
                  {metric.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sleep Analysis */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-lg">😴</span>
            Sleep Analysis (Last Night)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{sleepData.totalSleep}</div>
              <div className="text-sm text-gray-600">Total Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{sleepData.deepSleep}</div>
              <div className="text-sm text-gray-600">Deep Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{sleepData.remSleep}</div>
              <div className="text-sm text-gray-600">REM Sleep</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{sleepData.efficiency}</div>
              <div className="text-sm text-gray-600">Efficiency</div>
            </div>
          </div>

          <div className="p-3 bg-white/70 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Sleep Quality</span>
              <Badge className={cn('text-xs', getStatusStyles(sleepData.quality))}>
                {sleepData.quality.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Sleep efficiency declined 9% from baseline. Deep sleep reduced by 23% correlating with hemoglobin decline.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Insights */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-lg">🔗</span>
            Health Correlations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">
                💓 Cardiovascular Compensation
              </div>
              <p className="text-sm text-gray-700">
                Resting heart rate increased 8 bpm over 4 months, indicating cardiac compensation for reduced oxygen-carrying capacity from anemia.
              </p>
            </div>

            <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">
                😰 Stress Response Pattern
              </div>
              <p className="text-sm text-gray-700">
                HRV stress scores elevated 31% above baseline, correlating with fatigue symptoms and iron deficiency progression.
              </p>
            </div>

            <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
              <div className="font-semibold text-gray-800 text-sm mb-1">
                🏃‍♀️ Activity Decline Feedback Loop
              </div>
              <p className="text-sm text-gray-700">
                34% reduction in daily steps creates deconditioning that compounds anemia-related fatigue, requiring graduated exercise intervention.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <span className="text-lg">⌚</span>
            Connected Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">⌚</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Apple Watch Series 8</div>
                <div className="text-sm text-gray-600">Last sync: 2 hours ago</div>
                <div className="text-xs text-green-600">✓ Connected</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">F</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Fitbit Charge 5</div>
                <div className="text-sm text-gray-600">Last sync: 1 hour ago</div>
                <div className="text-xs text-green-600">✓ Connected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WearableMetricsDashboard;
