import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NutritionalRecommendation {
  category: string;
  foods: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  interactions: string[];
  reason: string;
}

interface MealPlan {
  meal: string;
  foods: string[];
  nutrients: string[];
  notes: string;
}

const nutritionalRecommendations: NutritionalRecommendation[] = [
  {
    category: 'Iron-Rich Foods',
    foods: ['Lean red meat', 'Spinach', 'Lentils', 'Quinoa', 'Dark chocolate', 'Tofu'],
    reason: 'Combat iron deficiency anemia (ferritin 8 ng/mL)',
    priority: 'high'
  },
  {
    category: 'Vitamin C Enhancers',
    foods: ['Citrus fruits', 'Bell peppers', 'Strawberries', 'Broccoli', 'Tomatoes'],
    reason: 'Enhance iron absorption by up to 300%',
    priority: 'high'
  },
  {
    category: 'Heart-Healthy Fats',
    foods: ['Salmon', 'Avocados', 'Walnuts', 'Olive oil', 'Chia seeds'],
    reason: 'Address elevated cholesterol (248 mg/dL)',
    priority: 'medium'
  },
  {
    category: 'Avoid/Limit',
    foods: ['Coffee with meals', 'Tea with meals', 'Calcium supplements with iron', 'Processed foods'],
    reason: 'These can inhibit iron absorption or worsen cholesterol',
    priority: 'medium'
  }
];

const supplements: Supplement[] = [
  {
    name: 'Iron Bisglycinate',
    dosage: '25mg elemental iron',
    timing: 'Empty stomach, 1 hour before meals',
    duration: '3-6 months',
    interactions: ['Avoid with coffee/tea', 'Separate from calcium by 2 hours'],
    reason: 'Gentle form with better absorption and fewer GI side effects'
  },
  {
    name: 'Vitamin C',
    dosage: '500mg',
    timing: 'With iron supplement',
    duration: 'While taking iron',
    interactions: ['Enhances iron absorption'],
    reason: 'Significantly improves iron bioavailability'
  },
  {
    name: 'Omega-3 EPA/DHA',
    dosage: '1000mg daily',
    timing: 'With largest meal',
    duration: 'Long-term',
    interactions: ['Monitor if on blood thinners'],
    reason: 'Support cardiovascular health and reduce inflammation'
  }
];

const mealPlans: MealPlan[] = [
  {
    meal: 'Breakfast',
    foods: ['Spinach omelet with bell peppers', 'Orange slices', 'Whole grain toast'],
    nutrients: ['Iron', 'Vitamin C', 'Folate', 'Protein'],
    notes: 'Take iron supplement 1 hour before this meal'
  },
  {
    meal: 'Lunch',
    foods: ['Quinoa salad with lentils', 'Grilled chicken', 'Strawberries', 'Olive oil dressing'],
    nutrients: ['Iron', 'Protein', 'Vitamin C', 'Healthy fats'],
    notes: 'Avoid coffee/tea for 2 hours after eating'
  },
  {
    meal: 'Dinner',
    foods: ['Grilled salmon', 'Steamed broccoli', 'Sweet potato', 'Mixed greens'],
    nutrients: ['Omega-3', 'Iron', 'Vitamin C', 'Beta-carotene'],
    notes: 'Light meal to support better sleep quality'
  },
  {
    meal: 'Snacks',
    foods: ['Dark chocolate (70%+)', 'Walnuts', 'Dried apricots', 'Hummus with vegetables'],
    nutrients: ['Iron', 'Healthy fats', 'Antioxidants'],
    notes: 'Choose 1-2 snacks daily based on hunger and energy needs'
  }
];

const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high':
      return 'bg-red-500 text-white';
    case 'medium':
      return 'bg-orange-500 text-white';
    case 'low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const NutritionalInsightsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'supplements' | 'meal-plan'>('recommendations');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-2 bg-gray-50 rounded-xl">
        <Button
          variant={activeTab === 'recommendations' ? "default" : "ghost"}
          className={cn(
            "flex-1 text-sm font-medium",
            activeTab === 'recommendations' 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          onClick={() => setActiveTab('recommendations')}
        >
          Food Recommendations
        </Button>
        <Button
          variant={activeTab === 'supplements' ? "default" : "ghost"}
          className={cn(
            "flex-1 text-sm font-medium",
            activeTab === 'supplements' 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          onClick={() => setActiveTab('supplements')}
        >
          Supplements
        </Button>
        <Button
          variant={activeTab === 'meal-plan' ? "default" : "ghost"}
          className={cn(
            "flex-1 text-sm font-medium",
            activeTab === 'meal-plan' 
              ? "bg-blue-500 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
          onClick={() => setActiveTab('meal-plan')}
        >
          Meal Planning
        </Button>
      </div>

      {/* Food Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🥗</span>
            Personalized Food Recommendations
          </h2>
          
          {nutritionalRecommendations.map((rec, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{rec.category}</h3>
                  <Badge className={cn('text-xs font-semibold', getPriorityStyles(rec.priority))}>
                    {rec.priority.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="flex flex-wrap gap-2">
                    {rec.foods.map((food, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 italic">{rec.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Supplements Tab */}
      {activeTab === 'supplements' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">💊</span>
            Supplement Recommendations
          </h2>
          
          {supplements.map((supplement, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{supplement.name}</h3>
                  <Badge className="bg-blue-500 text-white text-xs">
                    {supplement.dosage}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="font-medium text-gray-700 text-sm">Timing:</span>
                    <p className="text-sm text-gray-600">{supplement.timing}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 text-sm">Duration:</span>
                    <p className="text-sm text-gray-600">{supplement.duration}</p>
                  </div>
                </div>
                
                {supplement.interactions.length > 0 && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700 text-sm">Important Notes:</span>
                    <ul className="text-sm text-gray-600 mt-1">
                      {supplement.interactions.map((interaction, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{interaction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                  <strong>Why:</strong> {supplement.reason}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meal Planning Tab */}
      {activeTab === 'meal-plan' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            7-Day Meal Planning Guide
          </h2>
          
          {mealPlans.map((meal, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-800 mb-3">{meal.meal}</h3>
                
                <div className="mb-3">
                  <span className="font-medium text-gray-700 text-sm">Suggested Foods:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {meal.foods.map((food, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm">
                        {food}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <span className="font-medium text-gray-700 text-sm">Key Nutrients:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {meal.nutrients.map((nutrient, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-sm">
                        {nutrient}
                      </span>
                    ))}
                  </div>
                </div>
                
                {meal.notes && (
                  <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded">
                    <strong>Note:</strong> {meal.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NutritionalInsightsPanel;
