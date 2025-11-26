import React, { useState } from 'react';
import { 
  Calendar,
  ChefHat,
  Clock,
  Users,
  ShoppingCart,
  Bookmark,
  Star,
  Filter,
  Search,
  Plus,
  Heart,
  Zap,
  Leaf,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  healthScore: number;
  tags: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: string[];
  instructions: string[];
  personalizedFor?: string[];
}

interface MealPlan {
  date: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe[];
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  healthScore: number;
}

const MealPlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planner' | 'recipes' | 'shopping'>('planner');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Mock recipes with personalized recommendations
  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Iron-Rich Spinach & Quinoa Bowl',
      description: 'Nutrient-dense bowl perfect for combating iron deficiency',
      image: '/api/placeholder/300/200',
      cookTime: 25,
      servings: 2,
      difficulty: 'easy',
      healthScore: 95,
      tags: ['iron-rich', 'vegetarian', 'high-protein', 'gluten-free'],
      nutrition: { calories: 420, protein: 18, carbs: 52, fat: 12, fiber: 8 },
      ingredients: [
        '1 cup quinoa',
        '4 cups fresh spinach',
        '1/2 cup chickpeas',
        '1/4 cup pumpkin seeds',
        '2 tbsp olive oil',
        'Lemon juice',
        'Salt and pepper'
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Sauté spinach with olive oil until wilted',
        'Combine quinoa, spinach, and chickpeas',
        'Top with pumpkin seeds and lemon dressing'
      ],
      personalizedFor: ['Iron deficiency', 'Vegetarian diet']
    },
    {
      id: '2',
      name: 'Omega-3 Salmon with Sweet Potato',
      description: 'Heart-healthy meal rich in omega-3 fatty acids',
      image: '/api/placeholder/300/200',
      cookTime: 30,
      servings: 2,
      difficulty: 'medium',
      healthScore: 92,
      tags: ['omega-3', 'heart-healthy', 'high-protein', 'anti-inflammatory'],
      nutrition: { calories: 485, protein: 35, carbs: 28, fat: 22, fiber: 4 },
      ingredients: [
        '2 salmon fillets (6 oz each)',
        '2 medium sweet potatoes',
        '2 cups broccoli',
        '1 tbsp olive oil',
        'Herbs and spices'
      ],
      instructions: [
        'Preheat oven to 400°F',
        'Roast sweet potatoes for 25 minutes',
        'Season and bake salmon for 12-15 minutes',
        'Steam broccoli until tender'
      ],
      personalizedFor: ['Heart health', 'High cholesterol']
    },
    {
      id: '3',
      name: 'Fiber-Rich Berry Overnight Oats',
      description: 'High-fiber breakfast to support digestive health',
      image: '/api/placeholder/300/200',
      cookTime: 5,
      servings: 1,
      difficulty: 'easy',
      healthScore: 88,
      tags: ['high-fiber', 'breakfast', 'make-ahead', 'antioxidants'],
      nutrition: { calories: 320, protein: 12, carbs: 58, fat: 8, fiber: 12 },
      ingredients: [
        '1/2 cup rolled oats',
        '1/2 cup almond milk',
        '1 tbsp chia seeds',
        '1/2 cup mixed berries',
        '1 tbsp almond butter',
        '1 tsp honey'
      ],
      instructions: [
        'Mix oats, milk, and chia seeds',
        'Refrigerate overnight',
        'Top with berries and almond butter',
        'Drizzle with honey before serving'
      ],
      personalizedFor: ['Digestive health', 'Weight management']
    }
  ];

  const weeklyMealPlan: MealPlan[] = [
    {
      date: '2024-08-02',
      meals: {
        breakfast: recipes[2],
        lunch: recipes[0],
        dinner: recipes[1]
      },
      totalNutrition: { calories: 1225, protein: 65, carbs: 138, fat: 42, fiber: 24 },
      healthScore: 92
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilters = selectedFilters.length === 0 || 
                          selectedFilters.some(filter => recipe.tags.includes(filter));
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Meal Planner
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Recipe
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200">
            <TabsTrigger value="planner" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Meal Planner</span>
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center space-x-2">
              <ChefHat className="w-4 h-4" />
              <span>Recipes</span>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Shopping List</span>
            </TabsTrigger>
          </TabsList>

          {/* Meal Planner Tab */}
          <TabsContent value="planner" className="space-y-6">
            {/* Weekly Overview */}
            <Card className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">This Week's Plan</h2>
                    <p className="text-orange-100">
                      Personalized meals based on your health goals
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">92</div>
                    <div className="text-sm text-orange-100">Health Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Avg Calories</div>
                    <div className="text-xl font-bold">1,225</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Protein</div>
                    <div className="text-xl font-bold">65g</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Fiber</div>
                    <div className="text-xl font-bold">24g</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-sm font-medium mb-1">Iron Focus</div>
                    <div className="text-xl font-bold">✓</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Meal Plan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Breakfast', 'Lunch', 'Dinner'].map((mealType, index) => {
                const recipe = index === 0 ? recipes[2] : index === 1 ? recipes[0] : recipes[1];
                return (
                  <Card key={mealType} className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{mealType}</span>
                        <Badge variant="outline" className="text-xs">
                          {recipe.cookTime} min
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <ChefHat className="w-8 h-8 text-gray-400" />
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{recipe.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{recipe.nutrition.calories} cal</span>
                            <div className={`flex items-center space-x-1 ${getHealthScoreColor(recipe.healthScore)}`}>
                              <Star className="w-3 h-3" />
                              <span>{recipe.healthScore}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {recipe.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1">
                            <Bookmark className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            View Recipe
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </Button>
              </div>
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                      <ChefHat className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{recipe.name}</h3>
                        <div className={`flex items-center space-x-1 ${getHealthScoreColor(recipe.healthScore)}`}>
                          <Star className="w-4 h-4" />
                          <span className="text-sm font-medium">{recipe.healthScore}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{recipe.cookTime}m</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{recipe.servings}</span>
                          </div>
                        </div>
                        <Badge className={getDifficultyColor(recipe.difficulty)}>
                          {recipe.difficulty}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {recipe.personalizedFor && (
                        <div className="bg-blue-50 rounded-lg p-2 mb-4">
                          <div className="flex items-center space-x-1 mb-1">
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-900">Personalized for you</span>
                          </div>
                          <div className="text-xs text-blue-700">
                            {recipe.personalizedFor.join(', ')}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
                        <div>
                          <div className="font-medium text-gray-900">{recipe.nutrition.calories}</div>
                          <div className="text-gray-500">cal</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{recipe.nutrition.protein}g</div>
                          <div className="text-gray-500">protein</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{recipe.nutrition.carbs}g</div>
                          <div className="text-gray-500">carbs</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{recipe.nutrition.fiber}g</div>
                          <div className="text-gray-500">fiber</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1">
                          Add to Plan
                        </Button>
                        <Button size="sm" variant="outline">
                          <Heart className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shopping List Tab */}
          <TabsContent value="shopping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <span>Weekly Shopping List</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Proteins', 'Vegetables', 'Grains', 'Pantry Items'].map((category) => (
                    <div key={category} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-semibold text-gray-900 mb-2">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {category === 'Proteins' && ['2 salmon fillets', '1 lb chicken breast', '1 can chickpeas'].map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                        {category === 'Vegetables' && ['4 cups spinach', '2 cups broccoli', '2 sweet potatoes'].map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                        {category === 'Grains' && ['1 cup quinoa', '1/2 cup oats', '1 cup brown rice'].map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                        {category === 'Pantry Items' && ['Olive oil', 'Chia seeds', 'Almond butter'].map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MealPlanner;
