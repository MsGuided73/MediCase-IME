import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import type { SymptomEntry } from '../../types';

interface TrendData {
  date: string;
  averageSeverity: number;
  symptomCount: number;
  symptoms: string[];
}

const SymptomTrendChart: React.FC = () => {
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'severity' | 'frequency'>('severity');

  useEffect(() => {
    loadSymptomData();
  }, []);

  const loadSymptomData = async () => {
    try {
      const response = await fetch('/api/symptom-entries', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        }
      });

      if (response.ok) {
        const entries = await response.json();
        setSymptomEntries(entries);
        generateTrendData(entries);
      }
    } catch (error) {
      console.error('Error loading symptom data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (entries: SymptomEntry[]) => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const trendData: TrendData[] = last30Days.map(date => {
      const dayStart = startOfDay(date);
      const dayEntries = entries.filter(entry => {
        const entryDate = startOfDay(parseISO(entry.createdAt));
        return entryDate.getTime() === dayStart.getTime();
      });

      const averageSeverity = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.severityScore, 0) / dayEntries.length
        : 0;

      return {
        date: format(date, 'MMM dd'),
        averageSeverity: Math.round(averageSeverity * 10) / 10,
        symptomCount: dayEntries.length,
        symptoms: [...new Set(dayEntries.map(entry => entry.symptomDescription))]
      };
    });

    setTrendData(trendData);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Symptom Trends (Last 30 Days)</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('severity')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewType === 'severity'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Severity
          </button>
          <button
            onClick={() => setViewType('frequency')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              viewType === 'frequency'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Frequency
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'severity' ? (
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
                label={{ value: 'Severity (1-10)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(1), 'Average Severity']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="averageSeverity" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: 'Number of Symptoms', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Symptom Count']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar 
                dataKey="symptomCount" 
                fill="#10B981"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(trendData.reduce((sum, day) => sum + day.averageSeverity, 0) / trendData.length).toFixed(1)}
          </div>
          <div className="text-gray-600">Avg Severity</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {trendData.reduce((sum, day) => sum + day.symptomCount, 0)}
          </div>
          <div className="text-gray-600">Total Symptoms</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {symptomEntries.length > 0 ? Math.max(...symptomEntries.map(s => s.severityScore)) : 0}
          </div>
          <div className="text-gray-600">Peak Severity</div>
        </div>
      </div>
    </div>
  );
};

export default SymptomTrendChart;
