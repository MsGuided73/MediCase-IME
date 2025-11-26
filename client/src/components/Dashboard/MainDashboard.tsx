import React, { useState, useEffect } from 'react';
import SymptomTrendChart from './SymptomTrendChart';
import SymptomForm from '../SymptomTracker/SymptomForm';
import { useAuth } from '../../hooks/useAuth';
import type { User, SymptomEntry, Prescription } from '../../types';

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomEntry[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSymptomForm, setShowSymptomForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch real data from API
      const [symptomsResponse, prescriptionsResponse] = await Promise.all([
        fetch('/api/symptom-entries', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        }),
        fetch('/api/prescriptions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
          }
        })
      ]);

      if (symptomsResponse.ok) {
        const symptomsData = await symptomsResponse.json();
        setRecentSymptoms(symptomsData.slice(0, 5)); // Show last 5 symptoms
      }

      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        setPrescriptions(prescriptionsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomSubmit = () => {
    setShowSymptomForm(false);
    loadDashboardData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.firstName || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your health overview for today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Symptoms</p>
                <p className="text-2xl font-semibold text-gray-900">{recentSymptoms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Medications</p>
                <p className="text-2xl font-semibold text-gray-900">{prescriptions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Severity</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {recentSymptoms.length > 0 
                    ? (recentSymptoms.reduce((sum, s) => sum + s.severityScore, 0) / recentSymptoms.length).toFixed(1)
                    : '0'
                  }/10
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <button
              onClick={() => setShowSymptomForm(true)}
              className="w-full h-full flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Track Symptom
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2">
            <SymptomTrendChart />
          </div>

          {/* Recent Symptoms */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Symptoms</h3>
            <div className="space-y-4">
              {recentSymptoms.map((symptom) => (
                <div key={symptom.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{symptom.symptomDescription}</h4>
                      <p className="text-sm text-gray-600">{symptom.bodyLocation}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(symptom.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      symptom.severityScore <= 3
                        ? 'bg-green-100 text-green-800'
                        : symptom.severityScore <= 6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {symptom.severityScore}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Medications */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Medications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{prescription.medicationName}</h4>
                <p className="text-sm text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-gray-500">Effectiveness:</span>
                  <div className="ml-2 flex">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full mr-1 ${
                          i < (prescription.effectivenessRating || 0) ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-gray-600">{prescription.effectivenessRating || 0}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Symptom Form Modal */}
        {showSymptomForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
              <SymptomForm
                onSubmit={handleSymptomSubmit}
                onCancel={() => setShowSymptomForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDashboard;
