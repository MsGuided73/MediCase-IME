# 🍽️ OpenAI Vision Meal Analysis Setup Guide

## 🚀 Overview

Your meal tracker now uses **OpenAI GPT-4o Vision** to provide comprehensive food analysis including:

- **Food Identification**: Recognizes specific foods and cooking methods
- **Nutrition Analysis**: Calculates calories, protein, carbs, fat, fiber, sodium
- **Health Scoring**: Rates individual foods and overall meal health (0-100)
- **Goal Tracking**: Automatically tracks progress against your nutrition goals
- **AI Recommendations**: Provides personalized nutrition suggestions
- **Database Storage**: Saves all analysis results for history and trends

---

## 🔧 Setup Requirements

### 1. OpenAI API Key
Add your OpenAI API key to `.env.local`:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Get your API key**: https://platform.openai.com/api-keys

### 2. Deploy Database Schema
Follow the steps in `SUPABASE-COMPLETE-SETUP.md` to deploy the meal tracking database schema.

### 3. Restart Servers
After adding the API key, restart both servers:
```powershell
# Stop current servers (Ctrl+C in terminals)
# Then restart:
npm run dev:win    # Backend server
npx vite          # Frontend server
```

---

## 🎯 How It Works

### 1. **Photo Upload/Capture**
- Upload existing photos or take live photos with camera
- Supports common image formats (JPG, PNG, WEBP)

### 2. **OpenAI Vision Analysis**
- GPT-4o analyzes the image with high detail
- Identifies individual foods and cooking methods
- Estimates portion sizes and nutritional content
- Calculates health scores for each food item

### 3. **Database Storage**
- Stores meal entry with all identified foods
- Tracks nutrition against your daily goals
- Generates personalized recommendations
- Maintains meal history for trends

### 4. **Progress Tracking**
- Compares meal nutrition to your daily goals
- Shows percentage progress for calories, protein, carbs, fat, fiber
- Displays remaining amounts needed to meet goals
- Updates in real-time as you log meals

---

## 📊 Features

### **Food Identification**
- Specific food names (e.g., "grilled chicken breast", "steamed broccoli")
- Cooking method detection (grilled, fried, steamed, raw, etc.)
- Confidence scoring for each identification
- Food categorization (protein, vegetable, fruit, grain, dairy, etc.)

### **Nutrition Analysis**
- Calories per food item and total meal
- Macronutrients: protein, carbohydrates, fat
- Micronutrients: fiber, sugar, sodium
- Portion size estimation with units

### **Health Scoring**
- Individual food health scores (0-100)
- Overall meal health score
- Factors in processing level, nutrient density, cooking method

### **Goal Management**
- Default goals: 2000 calories, 150g protein, 250g carbs, 65g fat
- Customizable goals through the Goals tab
- Progress tracking with visual indicators
- Remaining amounts calculation

### **AI Recommendations**
- Personalized suggestions based on meal analysis
- Nutrition improvement recommendations
- Cooking method suggestions for healthier preparation

---

## 🎨 User Interface

### **Analysis Tab**
After analyzing a meal, view:
- **Summary Cards**: Total calories, health score, foods identified
- **Food Details**: Individual food breakdown with nutrition and confidence
- **Progress to Goals**: Visual progress bars for all nutrition targets
- **AI Recommendations**: Personalized suggestions for improvement

### **Goal Tracking**
- Real-time progress updates
- Visual progress bars with percentages
- Remaining amounts to reach daily goals
- Color-coded indicators (green = on track, yellow = behind, red = over)

---

## 🧪 Testing

### **Test the Integration**
1. Take or upload a photo of your meal
2. Wait for OpenAI Vision analysis (5-10 seconds)
3. Check the Analysis tab for detailed results
4. Verify nutrition goals are updated
5. Review AI recommendations

### **Example Analysis**
For a chicken and rice meal, expect:
- **Foods**: "Grilled chicken breast", "Steamed white rice", "Mixed vegetables"
- **Nutrition**: ~400-600 calories, 30-40g protein, 45-60g carbs
- **Health Score**: 70-85/100 (depending on preparation)
- **Recommendations**: "Consider adding more vegetables for fiber"

---

## 🔍 Troubleshooting

### **No Analysis Results**
- Check OpenAI API key is set correctly
- Ensure image is clear and well-lit
- Verify food is visible and recognizable
- Check browser console for error messages

### **Low Confidence Scores**
- Use better lighting when taking photos
- Ensure foods are clearly visible and separated
- Avoid blurry or dark images
- Take photos from above for best results

### **Nutrition Goals Not Updating**
- Verify Supabase database schema is deployed
- Check authentication is working
- Ensure RLS policies are enabled on all tables
- Review server logs for database errors

---

## 💡 Tips for Best Results

### **Photo Quality**
- Use good lighting (natural light preferred)
- Take photos from above (bird's eye view)
- Ensure all foods are visible
- Avoid shadows and reflections

### **Food Presentation**
- Separate foods when possible
- Use standard plates/bowls for portion reference
- Include utensils for size reference
- Avoid heavily mixed or blended foods

### **Goal Setting**
- Set realistic daily nutrition goals
- Adjust goals based on activity level and health objectives
- Review and update goals regularly
- Use the default goals as a starting point

---

## 🎉 Ready to Use!

Your OpenAI Vision-powered meal tracker is now ready! Start by:

1. **Setting your nutrition goals** in the Goals tab
2. **Taking a photo** of your next meal
3. **Reviewing the AI analysis** in the Analysis tab
4. **Tracking your progress** throughout the day

The system will learn and improve recommendations based on your meal patterns and preferences.
