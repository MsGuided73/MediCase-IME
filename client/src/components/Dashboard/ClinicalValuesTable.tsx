import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import type { LabValue } from '../../types/dashboard';

interface ClinicalValuesTableProps {
  reportId: number;
  compact?: boolean;
  showTrends?: boolean;
}

export const ClinicalValuesTable: React.FC<ClinicalValuesTableProps> = ({
  reportId,
  compact = false,
  showTrends = false
}) => {
  const [values, setValues] = useState<LabValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof LabValue>('testName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterAbnormal, setFilterAbnormal] = useState(false);
  const [filterCritical, setFilterCritical] = useState(false);
  const [showNormalValues, setShowNormalValues] = useState(true);

  useEffect(() => {
    fetchLabValues();
  }, [reportId]);

  const fetchLabValues = async () => {
    try {
      const response = await fetch(`/api/lab-reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setValues(data.values || []);
      }
    } catch (error) {
      console.error('Failed to fetch lab values:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort values
  const processedValues = useMemo(() => {
    let filtered = values;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(value => 
        value.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.unit?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Abnormal filter
    if (filterAbnormal) {
      filtered = filtered.filter(value => 
        value.abnormalFlag && value.abnormalFlag !== 'N'
      );
    }

    // Critical filter
    if (filterCritical) {
      filtered = filtered.filter(value => value.criticalFlag);
    }

    // Normal values filter
    if (!showNormalValues) {
      filtered = filtered.filter(value => 
        value.abnormalFlag && value.abnormalFlag !== 'N'
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle numeric sorting
      if (sortField === 'numericValue') {
        aValue = a.numericValue || 0;
        bValue = b.numericValue || 0;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue != null && bValue != null) {
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    // Prioritize critical and abnormal values
    return filtered.sort((a, b) => {
      if (a.criticalFlag && !b.criticalFlag) return -1;
      if (!a.criticalFlag && b.criticalFlag) return 1;
      
      const aAbnormal = a.abnormalFlag && a.abnormalFlag !== 'N';
      const bAbnormal = b.abnormalFlag && b.abnormalFlag !== 'N';
      
      if (aAbnormal && !bAbnormal) return -1;
      if (!aAbnormal && bAbnormal) return 1;
      
      return 0;
    });
  }, [values, searchTerm, sortField, sortDirection, filterAbnormal, filterCritical, showNormalValues]);

  const handleSort = (field: keyof LabValue) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getAbnormalFlagColor = (flag?: string) => {
    switch (flag) {
      case 'HH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'LL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'H':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'L':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'N':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAbnormalFlagIcon = (flag?: string) => {
    switch (flag) {
      case 'HH':
      case 'H':
        return <TrendingUp className="w-3 h-3" />;
      case 'LL':
      case 'L':
        return <TrendingDown className="w-3 h-3" />;
      case 'N':
        return <Minus className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getRowClassName = (value: LabValue) => {
    if (value.criticalFlag) {
      return 'bg-red-50 border-l-4 border-red-500';
    }
    if (value.abnormalFlag && value.abnormalFlag !== 'N') {
      return 'bg-orange-50 border-l-4 border-orange-500';
    }
    return 'hover:bg-gray-50';
  };

  const stats = useMemo(() => {
    const total = values.length;
    const abnormal = values.filter(v => v.abnormalFlag && v.abnormalFlag !== 'N').length;
    const critical = values.filter(v => v.criticalFlag).length;
    const normal = total - abnormal;

    return { total, abnormal, critical, normal };
  }, [values]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Lab Values</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {processedValues.length} of {values.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNormalValues(!showNormalValues)}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors
                ${showNormalValues ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}
              `}
            >
              {showNormalValues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Normal</span>
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{stats.critical}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">{stats.abnormal}</div>
            <div className="text-xs text-gray-500">Abnormal</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{stats.normal}</div>
            <div className="text-xs text-gray-500">Normal</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lab values..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterCritical(!filterCritical)}
              className={`
                flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors
                ${filterCritical ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
              `}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Critical</span>
            </button>
            
            <button
              onClick={() => setFilterAbnormal(!filterAbnormal)}
              className={`
                flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors
                ${filterAbnormal ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}
              `}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Abnormal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('testName')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Test Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('value')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Value</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flag
              </th>
              {!compact && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interpretation
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedValues.map((value) => (
              <tr key={value.id} className={getRowClassName(value)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {value.testName}
                        {value.criticalFlag && (
                          <AlertCircle className="w-4 h-4 text-red-500 inline ml-2" />
                        )}
                      </div>
                      {value.testCode && (
                        <div className="text-xs text-gray-500">{value.testCode}</div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {value.value} {value.unit && <span className="text-gray-500">{value.unit}</span>}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {value.referenceRangeText || 'N/A'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {value.abnormalFlag && value.abnormalFlag !== 'N' ? (
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                      ${getAbnormalFlagColor(value.abnormalFlag)}
                    `}>
                      {getAbnormalFlagIcon(value.abnormalFlag)}
                      <span className="ml-1">{value.abnormalFlag}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                      <Minus className="w-3 h-3 mr-1" />
                      Normal
                    </span>
                  )}
                </td>
                
                {!compact && (
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={value.clinicalInterpretation}>
                      {value.clinicalInterpretation || 'No interpretation available'}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {processedValues.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No lab values found matching your criteria</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default ClinicalValuesTable;
