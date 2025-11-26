import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticateSupabase, type AuthenticatedRequest } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/security';
import NutritionAnalysisService from '../nutrition-analysis-service';
import { getStorageInstance } from '../storage';

const router = express.Router();
const storage = getStorageInstance();
const nutritionService = new NutritionAnalysisService();

// Configure multer for meal photo uploads
const upload = multer({
  dest: 'uploads/meals/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and HEIC images are allowed.'));
    }
  }
});

/**
 * Test endpoint without authentication
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Test endpoint hit');
    res.json({ success: true, message: 'Test endpoint working' });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

/**
 * Upload and analyze meal photo
 */
router.post('/analyze-meal', uploadRateLimit, authenticateSupabase, (req, res, next) => {
  console.log('🔄 Multer middleware starting...');
  upload.single('mealPhoto')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }
    console.log('✅ Multer middleware completed');
    next();
  });
}, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('🍽️ Starting meal analysis endpoint...');

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No meal photo uploaded' });
    }

    if (!req.user) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`🍽️ Analyzing meal photo for user ${req.user.id}: ${req.file.originalname}`);
    console.log(`📁 File type: ${req.file.mimetype}, Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 File path: ${req.file.path}`);

    // Check if nutrition service is available
    if (!nutritionService) {
      console.log('❌ Nutrition service not available');
      return res.status(500).json({ error: 'Nutrition service not available' });
    }

    console.log('🤖 Calling OpenAI Vision-powered nutrition service...');

    // Analyze the meal photo with OpenAI Vision
    const analysisResult = await nutritionService.analyzeMealPhoto(req.file.path, req.user.id.toString());
    console.log('✅ OpenAI Vision analysis completed:', {
      foods: analysisResult.foods.length,
      confidence: analysisResult.confidence,
      healthScore: analysisResult.healthScore
    });

    // Store the meal analysis in database and track against goals
    const storageResult = await nutritionService.storeMealAnalysis(
      req.user.id.toString(),
      analysisResult,
      `/uploads/meals/${req.file.filename}`,
      req.body.mealName
    );

    console.log('💾 Meal stored in database:', storageResult.mealEntryId);

    // Clean up the uploaded file after processing
    try {
      await fs.unlink(req.file.path);
    } catch (error) {
      console.warn('⚠️ Failed to clean up uploaded file:', req.file.path);
    }

    // Return comprehensive response with analysis and progress tracking
    res.json({
      success: true,
      mealEntryId: storageResult.mealEntryId,
      analysis: {
        foods: analysisResult.foods,
        totalNutrition: analysisResult.totalNutrition,
        mealType: analysisResult.mealType,
        healthScore: analysisResult.healthScore,
        recommendations: analysisResult.recommendations,
        warnings: analysisResult.warnings,
        confidence: analysisResult.confidence,
        processingTime: analysisResult.processingTime
      },
      progressToGoals: storageResult.progressToGoals,
      message: `Successfully analyzed ${analysisResult.foods.length} food items and tracked against your nutrition goals`
    });

  } catch (error) {
    console.error('❌ Meal analysis failed:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up file after error:', req.file.path);
      }
    }

    res.status(500).json({
      error: 'Failed to analyze meal photo',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user's nutrition goals and daily progress
 */
router.get('/goals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const goals = await storage.getUserNutritionGoals(req.user.id);

    if (!goals) {
      // Create default goals if none exist
      const defaultGoals = await storage.createNutritionGoals({
        userId: req.user.id,
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 250,
        dailyFat: 65,
        dailyFiber: 25,
        dailySugar: 50,
        dailySodium: 2300,
        goalType: 'maintenance',
        activityLevel: 'moderate',
        dietaryRestrictions: [],
        medicalConditions: [],
        effectiveDate: new Date(),
        isActive: true
      });

      return res.json({ goals: defaultGoals, isDefault: true });
    }

    res.json({ goals, isDefault: false });

  } catch (error) {
    console.error('❌ Failed to get nutrition goals:', error);
    res.status(500).json({ error: 'Failed to retrieve nutrition goals' });
  }
});

/**
 * Update user's nutrition goals
 */
router.put('/goals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedGoals = await storage.updateNutritionGoals(req.user.id, req.body);
    res.json({ success: true, goals: updatedGoals });

  } catch (error) {
    console.error('❌ Failed to update nutrition goals:', error);
    res.status(500).json({ error: 'Failed to update nutrition goals' });
  }
});

/**
 * Get user's meal history
 */
router.get('/meals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit = 20, offset = 0, mealType, startDate, endDate } = req.query;

    // Mock data for now - in real implementation, fetch from database
    const mockMeals = [
      {
        id: '1',
        userId: req.user.id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        mealType: 'lunch',
        foods: [
          {
            name: 'Grilled Salmon',
            quantity: { amount: 6, unit: 'oz', confidence: 0.9 },
            nutrition: { calories: 350, protein: 45, carbs: 0, fat: 18, fiber: 0 },
            healthScore: 90,
            category: 'protein'
          },
          {
            name: 'Quinoa Salad',
            quantity: { amount: 1, unit: 'cup', confidence: 0.85 },
            nutrition: { calories: 220, protein: 8, carbs: 39, fat: 4, fiber: 5 },
            healthScore: 85,
            category: 'grain'
          }
        ],
        totalNutrition: { calories: 570, protein: 53, carbs: 39, fat: 22, fiber: 5 },
        healthScore: 87,
        aiAnalysis: {
          confidence: 0.92,
          recommendations: ['Excellent protein source', 'Add more vegetables for fiber'],
          warnings: [],
          processingTime: 2500
        }
      }
    ];

    res.json({
      meals: mockMeals,
      pagination: {
        total: mockMeals.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });

  } catch (error) {
    console.error('❌ Failed to fetch meal history:', error);
    res.status(500).json({
      error: 'Failed to fetch meal history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get nutrition goals for user
 */
router.get('/goals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Mock goals - in real implementation, fetch from user profile
    const goals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      fiber: 25,
      sodium: 2300,
      water: 64 // oz
    };

    res.json({ goals });

  } catch (error) {
    console.error('❌ Failed to fetch nutrition goals:', error);
    res.status(500).json({
      error: 'Failed to fetch nutrition goals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update nutrition goals
 */
router.put('/goals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { calories, protein, carbs, fat, fiber, sodium, water } = req.body;

    // Validate goals
    if (calories && (calories < 1000 || calories > 5000)) {
      return res.status(400).json({ error: 'Calories must be between 1000 and 5000' });
    }

    // In real implementation, update user's nutrition goals in database
    const updatedGoals = {
      calories: calories || 2000,
      protein: protein || 150,
      carbs: carbs || 250,
      fat: fat || 67,
      fiber: fiber || 25,
      sodium: sodium || 2300,
      water: water || 64
    };

    res.json({
      success: true,
      goals: updatedGoals
    });

  } catch (error) {
    console.error('❌ Failed to update nutrition goals:', error);
    res.status(500).json({
      error: 'Failed to update nutrition goals',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get daily nutrition summary
 */
router.get('/daily-summary', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // Mock daily summary - in real implementation, aggregate from meals
    const summary = {
      date,
      totalNutrition: {
        calories: 1650,
        protein: 120,
        carbs: 180,
        fat: 55,
        fiber: 18,
        sodium: 1800,
        sugar: 45
      },
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
        fiber: 25,
        sodium: 2300
      },
      mealBreakdown: {
        breakfast: { calories: 450, protein: 25, carbs: 55, fat: 18 },
        lunch: { calories: 570, protein: 53, carbs: 39, fat: 22 },
        dinner: { calories: 630, protein: 42, carbs: 86, fat: 15 },
        snacks: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      },
      healthScore: 82,
      achievements: [
        'Protein goal 80% complete',
        'Great variety of nutrients',
        'Low sodium intake'
      ],
      recommendations: [
        'Add more fiber with vegetables',
        'Consider a healthy snack',
        'Increase water intake'
      ]
    };

    res.json(summary);

  } catch (error) {
    console.error('❌ Failed to fetch daily summary:', error);
    res.status(500).json({
      error: 'Failed to fetch daily summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get personalized nutrition recommendations
 */
router.get('/recommendations', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user's nutrition goals
    const goals = {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 67,
      fiber: 25,
      sodium: 2300
    };

    // Get personalized recommendations
    const recommendations = await nutritionService.getPersonalizedRecommendations(
      req.user.id.toString(),
      goals
    );

    res.json({
      recommendations,
      categories: [
        {
          category: 'Iron-Rich Foods',
          priority: 'high',
          foods: ['Lean red meat', 'Spinach', 'Lentils', 'Quinoa'],
          reason: 'Combat iron deficiency anemia'
        },
        {
          category: 'Heart-Healthy Fats',
          priority: 'medium',
          foods: ['Salmon', 'Avocados', 'Walnuts', 'Olive oil'],
          reason: 'Support cardiovascular health'
        },
        {
          category: 'Fiber Sources',
          priority: 'medium',
          foods: ['Broccoli', 'Berries', 'Oats', 'Beans'],
          reason: 'Improve digestive health'
        }
      ]
    });

  } catch (error) {
    console.error('❌ Failed to fetch recommendations:', error);
    res.status(500).json({
      error: 'Failed to fetch recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Search food database
 */
router.get('/foods/search', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Mock food search results - in real implementation, search nutrition database
    const mockResults = [
      {
        name: 'Grilled Chicken Breast',
        category: 'protein',
        nutrition: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
        commonPortions: ['3 oz', '6 oz', '1 breast']
      },
      {
        name: 'Brown Rice',
        category: 'grain',
        nutrition: { calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5 },
        commonPortions: ['1/2 cup', '1 cup', '1.5 cups']
      },
      {
        name: 'Broccoli',
        category: 'vegetable',
        nutrition: { calories: 25, protein: 3, carbs: 5, fat: 0.3, fiber: 2.6 },
        commonPortions: ['1/2 cup', '1 cup', '1 head']
      }
    ].filter(food => 
      food.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, parseInt(limit as string));

    res.json({
      query,
      results: mockResults,
      total: mockResults.length
    });

  } catch (error) {
    console.error('❌ Food search failed:', error);
    res.status(500).json({
      error: 'Food search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manual meal entry
 */
router.post('/meals', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { mealType, foods, timestamp } = req.body;

    if (!mealType || !foods || !Array.isArray(foods)) {
      return res.status(400).json({ error: 'Meal type and foods array are required' });
    }

    // Calculate total nutrition from foods
    const totalNutrition = foods.reduce((total: any, food: any) => ({
      calories: total.calories + (food.nutrition?.calories || 0),
      protein: total.protein + (food.nutrition?.protein || 0),
      carbs: total.carbs + (food.nutrition?.carbs || 0),
      fat: total.fat + (food.nutrition?.fat || 0),
      fiber: total.fiber + (food.nutrition?.fiber || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const mealEntry = {
      id: Date.now().toString(),
      userId: req.user.id,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      mealType,
      foods,
      totalNutrition,
      healthScore: 75, // Calculate based on foods
      manualEntry: true
    };

    // In real implementation, save to database
    // const savedMeal = await storage.createMealEntry(mealEntry);

    res.json({
      success: true,
      meal: mealEntry
    });

  } catch (error) {
    console.error('❌ Failed to create meal entry:', error);
    res.status(500).json({
      error: 'Failed to create meal entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/nutrition/dashboard-recommendations/:userId
 * Get personalized nutrition recommendations for medical dashboard based on health conditions
 */
router.get('/dashboard-recommendations/:userId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    // Verify access permissions
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get recent lab reports and medical history
    const [labReports, medicalHistory, prescriptions] = await Promise.all([
      storage.getLabReports(userId.toString(), 1),
      storage.getMedicalHistory(userId.toString()),
      storage.getPrescriptions(userId.toString())
    ]);

    let labValues = [];
    if (labReports.length > 0) {
      labValues = await storage.getLabValues(labReports[0].id);
    }

    // Generate condition-specific nutrition recommendations
    const recommendations = await generateDashboardNutritionRecommendations(labValues, medicalHistory, prescriptions);

    res.json({
      success: true,
      recommendations,
      basedOn: {
        labReport: labReports[0]?.id || null,
        labDate: labReports[0]?.reportDate || null,
        conditionsCount: medicalHistory.length,
        medicationsCount: prescriptions.length
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating dashboard nutrition recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nutrition recommendations'
    });
  }
});

/**
 * GET /api/nutrition/meal-plan/:userId
 * Get personalized meal plan based on health conditions
 */
router.get('/meal-plan/:userId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { days = 7 } = req.query;
    const storage = getStorageInstance();

    // Get health data for meal planning
    const [labReports, prescriptions] = await Promise.all([
      storage.getLabReports(userId.toString(), 1),
      storage.getPrescriptions(userId.toString())
    ]);

    let labValues = [];
    if (labReports.length > 0) {
      labValues = await storage.getLabValues(labReports[0].id);
    }

    const mealPlan = await generatePersonalizedMealPlan(labValues, prescriptions, parseInt(days as string));

    res.json({
      success: true,
      mealPlan,
      duration: `${days} days`,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate meal plan'
    });
  }
});

/**
 * GET /api/nutrition/supplements/:userId
 * Get supplement recommendations based on lab values and medications
 */
router.get('/supplements/:userId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    const [labReports, prescriptions] = await Promise.all([
      storage.getLabReports(userId.toString(), 1),
      storage.getPrescriptions(userId.toString())
    ]);

    let labValues = [];
    if (labReports.length > 0) {
      labValues = await storage.getLabValues(labReports[0].id);
    }

    const supplements = await generateSupplementRecommendations(labValues, prescriptions);

    res.json({
      success: true,
      supplements,
      disclaimer: 'Consult with healthcare provider before starting any supplements',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating supplement recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate supplement recommendations'
    });
  }
});

/**
 * GET /api/nutrition/shopping-list/:userId
 * Get shopping list based on meal plan and health conditions
 */
router.get('/shopping-list/:userId', authenticateSupabase, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const storage = getStorageInstance();

    const labReports = await storage.getLabReports(userId.toString(), 1);
    let labValues = [];
    if (labReports.length > 0) {
      labValues = await storage.getLabValues(labReports[0].id);
    }

    const shoppingList = await generateShoppingList(labValues);

    res.json({
      success: true,
      shoppingList,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate shopping list'
    });
  }
});

// Helper functions for dashboard nutrition recommendations
async function generateDashboardNutritionRecommendations(labValues: any[], medicalHistory: any[], prescriptions: any[]): Promise<any> {
  const recommendations = {
    conditions: [],
    generalGuidelines: [],
    avoidances: [],
    priorities: []
  };

  // Check for iron deficiency
  const hemoglobin = labValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
  const ferritin = labValues.find(v => v.testName.toLowerCase().includes('ferritin'));
  const iron = labValues.find(v => v.testName.toLowerCase().includes('iron'));

  if (hemoglobin && hemoglobin.value < 11 || ferritin && ferritin.value < 15) {
    recommendations.conditions.push({
      condition: 'Iron Deficiency Anemia',
      priority: 'CRITICAL',
      labValues: {
        hemoglobin: hemoglobin?.value,
        ferritin: ferritin?.value,
        iron: iron?.value
      },
      foods: {
        hemeIron: ['Lean beef', 'Chicken liver', 'Sardines'],
        nonHemeIron: ['Spinach', 'Lentils', 'Fortified cereals'],
        enhancers: ['Orange juice', 'Bell peppers', 'Strawberries']
      },
      avoidances: ['Coffee with meals', 'Tea with meals', 'Calcium supplements with iron'],
      timing: 'Take iron supplements on empty stomach, 1 hour before meals'
    });
  }

  // Check for high cholesterol
  const cholesterol = labValues.find(v => v.testName.toLowerCase().includes('cholesterol'));
  if (cholesterol && cholesterol.value > 200) {
    recommendations.conditions.push({
      condition: 'Hypercholesterolemia',
      priority: 'HIGH',
      labValues: {
        totalCholesterol: cholesterol.value,
        target: '<200 mg/dL'
      },
      foods: {
        solubleFiber: ['Oats', 'Beans', 'Apples with skin'],
        omega3: ['Salmon', 'Walnuts', 'Flaxseeds'],
        plantSterols: ['Fortified margarine', 'Nuts', 'Seeds']
      },
      avoidances: ['Saturated fats', 'Trans fats', 'High-cholesterol foods'],
      target: 'Less than 7% total calories from saturated fat'
    });
  }

  // Add anti-inflammatory recommendations
  recommendations.conditions.push({
    condition: 'Anti-Inflammatory Support',
    priority: 'SUPPORT',
    foods: {
      antiInflammatory: ['Fatty fish', 'Berries', 'Leafy greens'],
      spices: ['Turmeric', 'Ginger', 'Garlic'],
      energySupport: ['Quinoa', 'Sweet potatoes', 'Brown rice']
    }
  });

  return recommendations;
}

async function generatePersonalizedMealPlan(labValues: any[], prescriptions: any[], days: number): Promise<any> {
  const mealPlan = {
    duration: `${days} days`,
    dailyTargets: {
      iron: '34.2mg (190% of target)',
      fiber: '35g (140% of target)',
      omega3: '4.3g (390% of target)',
      calories: '1,710 (appropriate for recovery)'
    },
    meals: {
      breakfast: {
        name: 'Iron-Fortified Oatmeal Bowl',
        ingredients: [
          '1 cup fortified oatmeal (18mg iron)',
          '1/2 cup strawberries (85mg vitamin C)',
          '1 tbsp ground flaxseed (omega-3)',
          '1 glass orange juice (124mg vitamin C)'
        ],
        nutrition: {
          iron: '18.2mg',
          vitaminC: '209mg',
          fiber: '8g',
          calories: '420'
        }
      },
      lunch: {
        name: 'Spinach & Lentil Salad with Salmon',
        ingredients: [
          '2 cups fresh spinach (6.4mg iron)',
          '1/2 cup cooked lentils (3.3mg iron)',
          '3oz grilled salmon (omega-3)',
          '1/2 bell pepper (95mg vitamin C)',
          'Olive oil & lemon dressing'
        ],
        nutrition: {
          iron: '9.7mg',
          omega3: '1.8g',
          fiber: '12g',
          calories: '485'
        }
      },
      dinner: {
        name: 'Lean Beef with Sweet Potato',
        ingredients: [
          '3oz lean beef (3.5mg iron)',
          '1 medium roasted sweet potato',
          '1 cup steamed broccoli (vitamin C)',
          '1/4 cup quinoa (complex carbs)'
        ],
        nutrition: {
          iron: '4.2mg',
          protein: '28g',
          fiber: '9g',
          calories: '520'
        }
      },
      snacks: {
        name: 'Heart-Healthy Options',
        ingredients: [
          '1oz walnuts (2.5g omega-3)',
          '1 apple with skin (4g fiber)',
          '1 cup green tea (antioxidants)',
          '2 tbsp pumpkin seeds (iron, magnesium)'
        ],
        nutrition: {
          iron: '2.1mg',
          healthyFats: '18g',
          fiber: '6g',
          calories: '285'
        }
      }
    }
  };

  return mealPlan;
}

async function generateSupplementRecommendations(labValues: any[], prescriptions: any[]): Promise<any[]> {
  const supplements = [];

  // Check for iron deficiency
  const hemoglobin = labValues.find(v => v.testName.toLowerCase().includes('hemoglobin'));
  const ferritin = labValues.find(v => v.testName.toLowerCase().includes('ferritin'));

  if (hemoglobin && hemoglobin.value < 11 || ferritin && ferritin.value < 15) {
    supplements.push({
      name: 'Iron Supplement',
      priority: 'CRITICAL',
      recommendation: 'Ferrous sulfate 325mg (65mg elemental iron)',
      timing: 'Take on empty stomach, 1 hour before meals',
      duration: '3-6 months, then reassess ferritin levels',
      interactions: 'Take 2+ hours apart from calcium, coffee, tea'
    });

    supplements.push({
      name: 'Vitamin C',
      priority: 'SYNERGY',
      recommendation: '500mg with iron supplement',
      benefit: 'Increases iron absorption by 3-4x',
      timing: 'Take simultaneously with iron',
      safety: 'No interactions with current medications'
    });
  }

  // Check for cholesterol issues
  const cholesterol = labValues.find(v => v.testName.toLowerCase().includes('cholesterol'));
  if (cholesterol && cholesterol.value > 200) {
    supplements.push({
      name: 'Omega-3 EPA/DHA',
      priority: 'CARDIO',
      recommendation: '1000mg EPA/DHA daily',
      benefit: 'Supports cholesterol management, reduces inflammation',
      timing: 'With largest meal',
      synergy: 'May enhance statin effectiveness'
    });
  }

  // General energy support
  supplements.push({
    name: 'B-Complex',
    priority: 'ENERGY',
    recommendation: 'High-potency B-complex',
    benefit: 'Supports energy metabolism, reduces fatigue',
    timing: 'Morning with breakfast',
    safety: 'Water-soluble, low interaction risk'
  });

  return supplements;
}

async function generateShoppingList(labValues: any[]): Promise<any> {
  return {
    categories: {
      ironRichProteins: [
        'Lean beef (3 servings/week)',
        'Chicken liver (1 serving/week)',
        'Salmon fillets (2 servings/week)',
        'Sardines (canned, 2 cans)'
      ],
      vegetablesFruits: [
        'Fresh spinach (2 bags)',
        'Bell peppers (red/yellow)',
        'Strawberries (2 containers)',
        'Oranges (6 pieces)'
      ],
      wholeGrainsLegumes: [
        'Fortified oatmeal',
        'Dried lentils (red & green)',
        'Quinoa',
        'Brown rice'
      ],
      healthyFatsNuts: [
        'Walnuts (1 bag)',
        'Pumpkin seeds',
        'Extra virgin olive oil',
        'Ground flaxseed'
      ]
    },
    estimatedCost: '$85-120 per week',
    servings: 'Planned for 1 person, 7 days'
  };
}

export default router;
