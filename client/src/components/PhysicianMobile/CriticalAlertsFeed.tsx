import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  TrendingUp, 
  Phone, 
  MessageSquare,
  ChevronRight,
  Filter,
  RefreshCw,
  Bell,
  Heart,
  Activity,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface CriticalAlert {
  id: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  alertType: 'critical_value' | 'trend_alert' | 'emergency_flag' | 'medication_alert';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  labValue?: {
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    flagged: boolean;
  };
  timestamp: string;
  timeAgo: string;
  isAcknowledged: boolean;
  requiresAction: boolean;
  recommendedActions: string[];
}

interface CriticalAlertsFeedProps {
  className?: string;
  compact?: boolean;
}

export const CriticalAlertsFeed: React.FC<CriticalAlertsFeedProps> = ({ 
  className, 
  compact = false 
}) => {
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);

  // Fetch critical alerts
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['/api/critical-alerts', filter],
    queryFn: () => apiRequest(`/api/critical-alerts?filter=${filter}`),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Monitor critical alerts
  useEffect(() => {
    if (alerts?.some((alert: CriticalAlert) =>
      alert.severity === 'critical' && !alert.isAcknowledged
    )) {
      console.log('Critical alert detected');
    }
  }, [alerts]);

  const handleAlertSelect = (alert: CriticalAlert) => {
    setSelectedAlert(alert);
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await apiRequest(`/api/critical-alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      refetch();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getSeverityIcon = (alertType: string, severity: string) => {
    const iconClass = severity === 'critical' ? 'text-red-600' : 
                     severity === 'high' ? 'text-orange-600' : 'text-yellow-600';
    
    switch (alertType) {
      case 'critical_value':
        return <AlertTriangle className={cn('h-5 w-5', iconClass)} />;
      case 'trend_alert':
        return <TrendingUp className={cn('h-5 w-5', iconClass)} />;
      case 'emergency_flag':
        return <Zap className={cn('h-5 w-5', iconClass)} />;
      case 'medication_alert':
        return <Heart className={cn('h-5 w-5', iconClass)} />;
      default:
        return <Bell className={cn('h-5 w-5', iconClass)} />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("bg-gray-50", className)}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-gray-900">Critical Alerts</h2>
            {alerts && alerts.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {alerts.filter((a: CriticalAlert) => !a.isAcknowledged).length}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => refetch()}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 mt-3">
          {[
            { id: 'unacknowledged', label: 'New', count: alerts?.filter((a: CriticalAlert) => !a.isAcknowledged).length },
            { id: 'critical', label: 'Critical', count: alerts?.filter((a: CriticalAlert) => a.severity === 'critical').length },
            { id: 'all', label: 'All', count: alerts?.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                filter === tab.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="overflow-y-auto">
        {!alerts || alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No critical alerts</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unacknowledged' ? 'All alerts have been acknowledged' : 'No alerts match the current filter'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert: CriticalAlert) => (
              <div
                key={alert.id}
                onClick={() => handleAlertSelect(alert)}
                className={cn(
                  "bg-white rounded-lg p-4 border cursor-pointer transition-all",
                  getSeverityColor(alert.severity),
                  !alert.isAcknowledged && "shadow-md",
                  "hover:shadow-lg"
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Alert Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.alertType, alert.severity)}
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {alert.patientName}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!alert.isAcknowledged && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                        <span className="text-xs text-gray-500">{alert.timeAgo}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {alert.title}
                    </p>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {alert.description}
                    </p>
                    
                    {/* Lab Value Display */}
                    {alert.labValue && (
                      <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{alert.labValue.name}</span>
                          <span className={cn(
                            "text-sm font-bold",
                            alert.labValue.flagged ? "text-red-600" : "text-gray-900"
                          )}>
                            {alert.labValue.value} {alert.labValue.unit}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Reference: {alert.labValue.referenceRange}
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        {!alert.isAcknowledged && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700"
                          >
                            Acknowledge
                          </button>
                        )}
                        
                        {alert.requiresAction && (
                          <button className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full hover:bg-orange-700">
                            Take Action
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-50">
                          <Phone className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-1 rounded-full hover:bg-white hover:bg-opacity-50">
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalAlertsFeed;
