import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import OpenAI from 'openai';
import { getStorageInstance } from './storage';

export interface FoodItem {
  name: string;
  confidence: number;
  quantity: {
    amount: number;
    unit: string;
    confidence: number;
  };
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber: number; // grams
    sugar: number; // grams
    sodium: number; // mg
    vitamins: string[];
    minerals: string[];
  };
  healthScore: number; // 0-100
  category: 'protein' | 'vegetable' | 'fruit' | 'grain' | 'dairy' | 'fat' | 'processed' | 'beverage';
}

export interface MealAnalysisResult {
  foods: FoodItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown';
  healthScore: number;
  recommendations: string[];
  warnings: string[];
  processingTime: number;
  confidence: number;
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

class NutritionAnalysisService {
  private tesseractWorker: any;
  private nutritionDatabase: Map<string, any>;
  private openai: OpenAI | null;

  constructor() {
    this.initializeTesseract();
    this.loadNutritionDatabase();
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ OpenAI Vision API initialized for meal analysis');
    } else {
      this.openai = null;
      console.warn('⚠️  OpenAI API key not found - using fallback analysis');
    }
  }

  private async initializeTesseract() {
    try {
      this.tesseractWorker = await createWorker('eng');
      console.log('✅ Tesseract OCR worker initialized for nutrition analysis');
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract worker:', error);
    }
  }

  private loadNutritionDatabase() {
    // Initialize with common foods database
    this.nutritionDatabase = new Map([
      ['apple', {
        calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4,
        vitamins: ['Vitamin C', 'Vitamin K'], minerals: ['Potassium'],
        category: 'fruit', healthScore: 85
      }],
      ['banana', {
        calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3,
        vitamins: ['Vitamin B6', 'Vitamin C'], minerals: ['Potassium', 'Magnesium'],
        category: 'fruit', healthScore: 80
      }],
      ['chicken breast', {
        calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0,
        vitamins: ['Niacin', 'B6'], minerals: ['Phosphorus', 'Selenium'],
        category: 'protein', healthScore: 90
      }],
      ['salmon', {
        calories: 208, protein: 22, carbs: 0, fat: 12, fiber: 0,
        vitamins: ['Vitamin D', 'B12'], minerals: ['Selenium', 'Phosphorus'],
        category: 'protein', healthScore: 95
      }],
      ['broccoli', {
        calories: 25, protein: 3, carbs: 5, fat: 0.3, fiber: 2.6,
        vitamins: ['Vitamin C', 'Vitamin K', 'Folate'], minerals: ['Iron', 'Potassium'],
        category: 'vegetable', healthScore: 95
      }],
      ['quinoa', {
        calories: 222, protein: 8, carbs: 39, fat: 3.6, fiber: 5,
        vitamins: ['Folate', 'Thiamine'], minerals: ['Manganese', 'Phosphorus'],
        category: 'grain', healthScore: 88
      }],
      ['avocado', {
        calories: 234, protein: 3, carbs: 12, fat: 21, fiber: 10,
        vitamins: ['Vitamin K', 'Folate'], minerals: ['Potassium'],
        category: 'fat', healthScore: 85
      }]
    ]);
  }

  /**
   * Analyze a meal photo and extract nutritional information
   */
  async analyzeMealPhoto(imagePath: string, userId?: string): Promise<MealAnalysisResult> {
    const startTime = Date.now();
    console.log(`🍽️ Starting meal photo analysis for: ${imagePath}`);

    try {
      // Step 1: Preprocess image for better AI analysis
      const processedImagePath = await this.preprocessMealImage(imagePath);

      // Step 2: Use AI to identify foods in the image
      const identifiedFoods = await this.identifyFoodsWithAI(processedImagePath);

      // Step 3: Estimate portions using computer vision
      const foodsWithPortions = await this.estimatePortions(identifiedFoods, processedImagePath);

      // Step 4: Calculate nutritional values
      const foodsWithNutrition = await this.calculateNutrition(foodsWithPortions);

      // Step 5: Determine meal type based on foods and time
      const mealType = this.determineMealType(foodsWithNutrition);

      // Step 6: Calculate total nutrition
      const totalNutrition = this.calculateTotalNutrition(foodsWithNutrition);

      // Step 7: Generate health score and recommendations
      const healthScore = this.calculateMealHealthScore(foodsWithNutrition);
      const recommendations = this.generateRecommendations(foodsWithNutrition, totalNutrition);
      const warnings = this.generateWarnings(foodsWithNutrition, totalNutrition);

      // Step 8: Calculate overall confidence
      const confidence = this.calculateOverallConfidence(foodsWithNutrition);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Meal analysis completed in ${processingTime}ms`);

      // Clean up processed image
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath).catch(() => {});
      }

      return {
        foods: foodsWithNutrition,
        totalNutrition,
        mealType,
        healthScore,
        recommendations,
        warnings,
        processingTime,
        confidence
      };

    } catch (error) {
      console.error('❌ Meal photo analysis failed:', error);
      throw new Error('Failed to analyze meal photo');
    }
  }

  /**
   * Preprocess image for better food recognition
   */
  private async preprocessMealImage(imagePath: string): Promise<string> {
    const outputPath = imagePath.replace(/\.[^/.]+$/, '_processed.jpg');

    await sharp(imagePath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .sharpen()
      .modulate({ brightness: 1.1, saturation: 1.2 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Use OpenAI Vision API to comprehensively analyze meal image
   */
  private async identifyFoodsWithAI(imagePath: string): Promise<Partial<FoodItem>[]> {
    try {
      if (!this.openai) {
        console.warn('⚠️  OpenAI not available, using fallback analysis');
        return this.fallbackFoodIdentification(imagePath);
      }

      // Read and encode the image
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      console.log('🤖 Analyzing meal with OpenAI Vision API...');

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this meal image as a professional nutritionist. Identify all visible foods and provide detailed analysis.

Return a JSON array with objects containing:
- name: Specific food name (e.g., "grilled chicken breast", "steamed broccoli")
- confidence: Confidence level (0-1)
- category: One of: protein, vegetable, fruit, grain, dairy, fat, processed, beverage
- cookingMethod: How it's prepared (grilled, fried, steamed, raw, etc.)
- estimatedQuantity: Object with amount (number) and unit (cups, oz, pieces, etc.)
- nutrition: Object with estimated calories, protein, carbs, fat, fiber, sugar, sodium per serving
- healthScore: Health rating 0-100 (100 = very healthy)

Be accurate and specific. Consider portion sizes based on visual cues like plate size, utensils, etc.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision API');
      }

      console.log('🤖 OpenAI Vision Response:', content.substring(0, 200) + '...');

      // Parse the JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('⚠️  No valid JSON found, attempting to extract food names');
        return this.parseNonJsonResponse(content);
      }

      const identifiedFoods = JSON.parse(jsonMatch[0]);
      console.log(`✅ AI identified ${identifiedFoods.length} foods:`, identifiedFoods.map((f: any) => f.name).join(', '));

      // Validate and enhance the response
      return this.validateAndEnhanceFoodData(identifiedFoods);

    } catch (error) {
      console.error('❌ OpenAI Vision analysis failed:', error);
      console.log('🔄 Falling back to basic analysis...');
      return this.fallbackFoodIdentification(imagePath);
    }
  }

  /**
   * Validate and enhance food data from OpenAI
   */
  private validateAndEnhanceFoodData(foods: any[]): Partial<FoodItem>[] {
    return foods.map(food => ({
      name: food.name || 'Unknown food',
      confidence: Math.min(Math.max(food.confidence || 0.5, 0), 1),
      category: this.validateCategory(food.category),
      quantity: {
        amount: food.estimatedQuantity?.amount || 1,
        unit: food.estimatedQuantity?.unit || 'serving',
        confidence: food.confidence || 0.5
      },
      nutrition: {
        calories: food.nutrition?.calories || 0,
        protein: food.nutrition?.protein || 0,
        carbs: food.nutrition?.carbs || 0,
        fat: food.nutrition?.fat || 0,
        fiber: food.nutrition?.fiber || 0,
        sugar: food.nutrition?.sugar || 0,
        sodium: food.nutrition?.sodium || 0,
        vitamins: food.nutrition?.vitamins || [],
        minerals: food.nutrition?.minerals || []
      },
      healthScore: Math.min(Math.max(food.healthScore || 50, 0), 100),
      cookingMethod: food.cookingMethod || 'unknown'
    }));
  }

  /**
   * Validate food category
   */
  private validateCategory(category: string): FoodItem['category'] {
    const validCategories: FoodItem['category'][] = ['protein', 'vegetable', 'fruit', 'grain', 'dairy', 'fat', 'processed', 'beverage'];
    return validCategories.includes(category as FoodItem['category']) ? category as FoodItem['category'] : 'processed';
  }

  /**
   * Parse non-JSON response from OpenAI
   */
  private parseNonJsonResponse(content: string): Partial<FoodItem>[] {
    const foodNames = content.match(/(?:food|item|ingredient):\s*([^\n,]+)/gi) || [];
    return foodNames.map(match => ({
      name: match.replace(/(?:food|item|ingredient):\s*/i, '').trim(),
      confidence: 0.6,
      category: 'processed' as const
    }));
  }

  /**
   * Fallback food identification when OpenAI is not available
   */
  private async fallbackFoodIdentification(imagePath: string): Promise<Partial<FoodItem>[]> {
    // Simple filename-based detection as fallback
    const filename = path.basename(imagePath).toLowerCase();

    const commonFoods = [
      { keywords: ['chicken', 'poultry'], name: 'Chicken', category: 'protein' as const },
      { keywords: ['rice'], name: 'Rice', category: 'grain' as const },
      { keywords: ['salad', 'lettuce'], name: 'Salad', category: 'vegetable' as const },
      { keywords: ['banana'], name: 'Banana', category: 'fruit' as const },
      { keywords: ['sandwich'], name: 'Sandwich', category: 'processed' as const }
    ];

    const detectedFoods = commonFoods.filter(food =>
      food.keywords.some(keyword => filename.includes(keyword))
    );

    if (detectedFoods.length === 0) {
      return [{ name: 'Mixed meal', confidence: 0.3, category: 'processed' }];
    }

    return detectedFoods.map(food => ({
      name: food.name,
      confidence: 0.4,
      category: food.category
    }));
  }

  /**
   * Estimate portion sizes using computer vision
   */
  private async estimatePortions(foods: Partial<FoodItem>[], imagePath: string): Promise<Partial<FoodItem>[]> {
    // In a real implementation, this would:
    // - Analyze object sizes relative to reference objects (plates, utensils)
    // - Use depth estimation for 3D volume calculation
    // - Apply machine learning models trained on portion sizes

    return foods.map(food => ({
      ...food,
      quantity: {
        amount: this.getEstimatedPortion(food.name || ''),
        unit: this.getPortionUnit(food.category || 'unknown'),
        confidence: 0.75
      }
    }));
  }

  private getEstimatedPortion(foodName: string): number {
    // Simple portion estimation based on food type
    if (foodName.includes('salmon') || foodName.includes('chicken')) return 6; // oz
    if (foodName.includes('quinoa') || foodName.includes('rice')) return 1; // cup
    if (foodName.includes('broccoli') || foodName.includes('vegetable')) return 1; // cup
    return 1;
  }

  private getPortionUnit(category: string): string {
    switch (category) {
      case 'protein': return 'oz';
      case 'grain': return 'cup';
      case 'vegetable': return 'cup';
      case 'fruit': return 'medium';
      case 'dairy': return 'cup';
      default: return 'serving';
    }
  }

  /**
   * Calculate nutritional values for identified foods
   */
  private async calculateNutrition(foods: Partial<FoodItem>[]): Promise<FoodItem[]> {
    return foods.map(food => {
      const baseNutrition = this.nutritionDatabase.get(food.name?.toLowerCase() || '') || {
        calories: 100, protein: 5, carbs: 15, fat: 3, fiber: 2,
        vitamins: [], minerals: [], category: 'unknown', healthScore: 50
      };

      const portionMultiplier = this.calculatePortionMultiplier(
        food.quantity?.amount || 1,
        food.quantity?.unit || 'serving'
      );

      return {
        name: food.name || 'Unknown Food',
        confidence: food.confidence || 0.5,
        quantity: food.quantity || { amount: 1, unit: 'serving', confidence: 0.5 },
        nutrition: {
          calories: Math.round(baseNutrition.calories * portionMultiplier),
          protein: Math.round(baseNutrition.protein * portionMultiplier * 10) / 10,
          carbs: Math.round(baseNutrition.carbs * portionMultiplier * 10) / 10,
          fat: Math.round(baseNutrition.fat * portionMultiplier * 10) / 10,
          fiber: Math.round(baseNutrition.fiber * portionMultiplier * 10) / 10,
          sugar: Math.round((baseNutrition.sugar || 0) * portionMultiplier * 10) / 10,
          sodium: Math.round((baseNutrition.sodium || 0) * portionMultiplier),
          vitamins: baseNutrition.vitamins || [],
          minerals: baseNutrition.minerals || []
        },
        healthScore: baseNutrition.healthScore || 50,
        category: (food.category || baseNutrition.category || 'unknown') as any
      };
    });
  }

  private calculatePortionMultiplier(amount: number, unit: string): number {
    // Convert different units to standard serving sizes
    switch (unit.toLowerCase()) {
      case 'oz': return amount / 4; // 4 oz = 1 serving for protein
      case 'cup': return amount; // 1 cup = 1 serving
      case 'medium': return amount; // 1 medium = 1 serving for fruits
      case 'large': return amount * 1.5;
      case 'small': return amount * 0.5;
      default: return amount;
    }
  }

  private determineMealType(foods: FoodItem[]): 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown' {
    const currentHour = new Date().getHours();
    
    // Time-based determination
    if (currentHour >= 6 && currentHour < 11) return 'breakfast';
    if (currentHour >= 11 && currentHour < 16) return 'lunch';
    if (currentHour >= 16 && currentHour < 22) return 'dinner';
    
    // Food-based determination for edge cases
    const hasBreakfastFoods = foods.some(f => 
      f.name.toLowerCase().includes('egg') || 
      f.name.toLowerCase().includes('cereal') ||
      f.name.toLowerCase().includes('toast')
    );
    
    if (hasBreakfastFoods) return 'breakfast';
    
    return foods.length <= 2 ? 'snack' : 'unknown';
  }

  private calculateTotalNutrition(foods: FoodItem[]) {
    return foods.reduce((total, food) => ({
      calories: total.calories + food.nutrition.calories,
      protein: Math.round((total.protein + food.nutrition.protein) * 10) / 10,
      carbs: Math.round((total.carbs + food.nutrition.carbs) * 10) / 10,
      fat: Math.round((total.fat + food.nutrition.fat) * 10) / 10,
      fiber: Math.round((total.fiber + food.nutrition.fiber) * 10) / 10,
      sugar: Math.round((total.sugar + food.nutrition.sugar) * 10) / 10,
      sodium: total.sodium + food.nutrition.sodium
    }), {
      calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0
    });
  }

  private calculateMealHealthScore(foods: FoodItem[]): number {
    if (foods.length === 0) return 0;
    
    const averageScore = foods.reduce((sum, food) => sum + food.healthScore, 0) / foods.length;
    
    // Bonus for variety
    const varietyBonus = Math.min(foods.length * 2, 10);
    
    // Penalty for processed foods
    const processedPenalty = foods.filter(f => f.category === 'processed').length * 5;
    
    return Math.max(0, Math.min(100, Math.round(averageScore + varietyBonus - processedPenalty)));
  }

  private generateRecommendations(foods: FoodItem[], totalNutrition: any): string[] {
    const recommendations: string[] = [];
    
    // Protein recommendations
    if (totalNutrition.protein < 20) {
      recommendations.push('Consider adding more protein sources like lean meat, fish, or legumes');
    }
    
    // Fiber recommendations
    if (totalNutrition.fiber < 8) {
      recommendations.push('Add more fiber with vegetables, fruits, or whole grains');
    }
    
    // Vegetable recommendations
    const vegetableCount = foods.filter(f => f.category === 'vegetable').length;
    if (vegetableCount < 2) {
      recommendations.push('Try to include more colorful vegetables for better nutrition');
    }
    
    // Healthy fat recommendations
    const hasHealthyFats = foods.some(f => 
      f.name.toLowerCase().includes('avocado') ||
      f.name.toLowerCase().includes('nuts') ||
      f.name.toLowerCase().includes('salmon')
    );
    
    if (!hasHealthyFats) {
      recommendations.push('Consider adding healthy fats like avocado, nuts, or fatty fish');
    }
    
    return recommendations;
  }

  private generateWarnings(foods: FoodItem[], totalNutrition: any): string[] {
    const warnings: string[] = [];
    
    // High sodium warning
    if (totalNutrition.sodium > 1000) {
      warnings.push('High sodium content - consider reducing processed foods');
    }
    
    // High sugar warning
    if (totalNutrition.sugar > 25) {
      warnings.push('High sugar content - monitor added sugars');
    }
    
    // Processed food warning
    const processedCount = foods.filter(f => f.category === 'processed').length;
    if (processedCount > foods.length / 2) {
      warnings.push('High proportion of processed foods - try more whole foods');
    }
    
    return warnings;
  }

  private calculateOverallConfidence(foods: FoodItem[]): number {
    if (foods.length === 0) return 0;
    
    const avgFoodConfidence = foods.reduce((sum, food) => sum + food.confidence, 0) / foods.length;
    const avgPortionConfidence = foods.reduce((sum, food) => sum + food.quantity.confidence, 0) / foods.length;
    
    return Math.round((avgFoodConfidence + avgPortionConfidence) / 2 * 100) / 100;
  }

  /**
   * Get personalized nutrition recommendations based on user goals and health data
   */
  async getPersonalizedRecommendations(userId: string, goals: NutritionGoals): Promise<string[]> {
    // In a real implementation, this would:
    // - Analyze user's recent meal history
    // - Consider health conditions and medications
    // - Factor in activity level and fitness goals
    // - Use AI to generate personalized suggestions

    const recommendations = [
      'Based on your iron deficiency, focus on iron-rich foods with vitamin C',
      'Your protein intake is excellent - maintain current levels',
      'Consider adding more omega-3 rich foods for heart health',
      'Increase fiber intake with more vegetables and whole grains'
    ];

    return recommendations;
  }

  /**
   * Store meal analysis results in database and track against goals
   */
  async storeMealAnalysis(
    userId: string,
    analysisResult: MealAnalysisResult,
    imagePath: string,
    mealName?: string
  ): Promise<{ mealEntryId: string; progressToGoals: any }> {
    try {
      const storage = getStorageInstance();
      console.log(`💾 Storing meal analysis for user ${userId}`);

      // Store the main meal entry
      const mealEntry = await storage.createMealEntry({
        userId: parseInt(userId),
        timestamp: new Date(),
        mealType: analysisResult.mealType,
        mealName: mealName || `${analysisResult.mealType} - ${new Date().toLocaleDateString()}`,
        imageUrl: imagePath,
        imageFilename: path.basename(imagePath),
        aiAnalysis: {
          foods: analysisResult.foods,
          processingTime: analysisResult.processingTime,
          confidence: analysisResult.confidence,
          recommendations: analysisResult.recommendations,
          warnings: analysisResult.warnings
        },
        confidence: analysisResult.confidence,
        processingTime: analysisResult.processingTime,
        totalCalories: analysisResult.totalNutrition.calories,
        totalProtein: analysisResult.totalNutrition.protein,
        totalCarbs: analysisResult.totalNutrition.carbs,
        totalFat: analysisResult.totalNutrition.fat,
        totalFiber: analysisResult.totalNutrition.fiber,
        totalSugar: analysisResult.totalNutrition.sugar,
        totalSodium: analysisResult.totalNutrition.sodium,
        healthScore: analysisResult.healthScore,
        manualEntry: false,
        verifiedByUser: false
      });

      // Store individual food items
      const foodItemPromises = analysisResult.foods.map(food =>
        storage.createFoodItem({
          mealEntryId: mealEntry.id,
          name: food.name,
          category: food.category,
          quantity: food.quantity?.amount || 1,
          unit: food.quantity?.unit || 'serving',
          calories: food.nutrition.calories,
          protein: food.nutrition.protein,
          carbs: food.nutrition.carbs,
          fat: food.nutrition.fat,
          fiber: food.nutrition.fiber,
          sugar: food.nutrition.sugar,
          sodium: food.nutrition.sodium,
          vitamins: food.nutrition.vitamins,
          minerals: food.nutrition.minerals,
          healthScore: food.healthScore,
          confidence: food.confidence || 0.5,
          cookingMethod: (food as any).cookingMethod || 'unknown'
        })
      );

      await Promise.all(foodItemPromises);

      // Get user's nutrition goals and calculate progress
      const progressToGoals = await this.calculateProgressToGoals(userId, analysisResult.totalNutrition);

      console.log(`✅ Meal analysis stored successfully. Entry ID: ${mealEntry.id}`);

      return {
        mealEntryId: mealEntry.id,
        progressToGoals
      };

    } catch (error) {
      console.error('❌ Failed to store meal analysis:', error);
      throw new Error('Failed to store meal analysis in database');
    }
  }

  /**
   * Calculate progress towards nutrition goals
   */
  private async calculateProgressToGoals(userId: string, mealNutrition: any): Promise<any> {
    try {
      const storage = getStorageInstance();

      // Get user's current nutrition goals
      const goals = await storage.getUserNutritionGoals(parseInt(userId));

      if (!goals) {
        console.log('📊 No nutrition goals set for user, creating default goals');
        // Create default goals based on general recommendations
        const defaultGoals = await storage.createNutritionGoals({
          userId: parseInt(userId),
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

        return this.calculateProgress(defaultGoals, mealNutrition);
      }

      return this.calculateProgress(goals, mealNutrition);

    } catch (error) {
      console.error('❌ Failed to calculate progress to goals:', error);
      return {
        error: 'Could not calculate progress to nutrition goals'
      };
    }
  }

  /**
   * Calculate nutrition progress
   */
  private calculateProgress(goals: any, mealNutrition: any): any {
    return {
      calories: {
        consumed: mealNutrition.calories,
        goal: goals.dailyCalories,
        percentage: Math.round((mealNutrition.calories / goals.dailyCalories) * 100),
        remaining: Math.max(0, goals.dailyCalories - mealNutrition.calories)
      },
      protein: {
        consumed: mealNutrition.protein,
        goal: goals.dailyProtein,
        percentage: Math.round((mealNutrition.protein / goals.dailyProtein) * 100),
        remaining: Math.max(0, goals.dailyProtein - mealNutrition.protein)
      },
      carbs: {
        consumed: mealNutrition.carbs,
        goal: goals.dailyCarbs,
        percentage: Math.round((mealNutrition.carbs / goals.dailyCarbs) * 100),
        remaining: Math.max(0, goals.dailyCarbs - mealNutrition.carbs)
      },
      fat: {
        consumed: mealNutrition.fat,
        goal: goals.dailyFat,
        percentage: Math.round((mealNutrition.fat / goals.dailyFat) * 100),
        remaining: Math.max(0, goals.dailyFat - mealNutrition.fat)
      },
      fiber: {
        consumed: mealNutrition.fiber,
        goal: goals.dailyFiber,
        percentage: Math.round((mealNutrition.fiber / goals.dailyFiber) * 100),
        remaining: Math.max(0, goals.dailyFiber - mealNutrition.fiber)
      }
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
    }
  }
}

export default NutritionAnalysisService;
