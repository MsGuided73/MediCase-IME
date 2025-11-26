import React, { useState } from 'react';

interface SymptomFormData {
  symptomName: string;
  severity: number;
  location: string;
  description: string;
  triggers: string[];
  duration: string;
}

interface SymptomFormProps {
  onSubmit?: (data: SymptomFormData) => void;
  onCancel?: () => void;
}

const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<SymptomFormData>({
    symptomName: '',
    severity: 5,
    location: '',
    description: '',
    triggers: [],
    duration: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const commonSymptoms = [
    'Headache', 'Back Pain', 'Fatigue', 'Nausea', 'Dizziness',
    'Joint Pain', 'Muscle Aches', 'Insomnia', 'Anxiety', 'Stomach Pain'
  ];

  const commonTriggers = [
    'Stress', 'Weather Change', 'Physical Activity', 'Poor Sleep',
    'Diet', 'Work', 'Travel', 'Medication', 'Allergies'
  ];

  const durationOptions = [
    '15 minutes', '30 minutes', '1 hour', '2 hours', '4 hours', 'All day'
  ];

  const handleInputChange = (field: keyof SymptomFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTriggerToggle = (trigger: string) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter(t => t !== trigger)
        : [...prev.triggers, trigger]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit to real API
      const response = await fetch('/api/symptom-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitSuccess(true);

        // Reset form after success
        setTimeout(() => {
          setFormData({
            symptomName: '',
            severity: 5,
            location: '',
            description: '',
            triggers: [],
            duration: ''
          });
          setSubmitSuccess(false);
          onSubmit?.(formData);
        }, 1500);
      } else {
        throw new Error('Failed to submit symptom entry');
      }
    } catch (error) {
      console.error('Error submitting symptom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Symptom Recorded!</h2>
          <p className="text-gray-600">Your symptom has been successfully tracked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Track New Symptom</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symptom Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symptom Name *
          </label>
          <input
            type="text"
            value={formData.symptomName}
            onChange={(e) => handleInputChange('symptomName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter symptom name"
            required
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {commonSymptoms.map(symptom => (
              <button
                key={symptom}
                type="button"
                onClick={() => handleInputChange('symptomName', symptom)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                {symptom}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity: {formData.severity}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.severity}
            onChange={(e) => handleInputChange('severity', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Mild</span>
            <span>Moderate</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Where do you feel this symptom?"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration
          </label>
          <select
            value={formData.duration}
            onChange={(e) => handleInputChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select duration</option>
            {durationOptions.map(duration => (
              <option key={duration} value={duration}>{duration}</option>
            ))}
          </select>
        </div>

        {/* Triggers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Possible Triggers
          </label>
          <div className="flex flex-wrap gap-2">
            {commonTriggers.map(trigger => (
              <button
                key={trigger}
                type="button"
                onClick={() => handleTriggerToggle(trigger)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  formData.triggers.includes(trigger)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {trigger}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional details about this symptom..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.symptomName}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Recording...' : 'Record Symptom'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SymptomForm;
