-- Meal Tracking Schema for Sherlock Health
-- Comprehensive nutrition and meal analysis system

-- Meal Entries Table
-- Stores individual meal records with AI analysis
CREATE TABLE IF NOT EXISTS meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Meal metadata
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    meal_name VARCHAR(255),
    
    -- Image and analysis
    image_url TEXT,
    image_filename VARCHAR(255),
    
    -- AI Analysis results
    ai_analysis JSONB DEFAULT '{}',
    confidence REAL DEFAULT 0.0,
    processing_time INTEGER, -- milliseconds
    
    -- Nutritional totals
    total_calories REAL DEFAULT 0,
    total_protein REAL DEFAULT 0, -- grams
    total_carbs REAL DEFAULT 0, -- grams
    total_fat REAL DEFAULT 0, -- grams
    total_fiber REAL DEFAULT 0, -- grams
    total_sugar REAL DEFAULT 0, -- grams
    total_sodium REAL DEFAULT 0, -- mg
    
    -- Health metrics
    health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
    
    -- Entry metadata
    manual_entry BOOLEAN DEFAULT FALSE,
    verified_by_user BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food Items Table
-- Individual foods identified in meals
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_entry_id UUID NOT NULL REFERENCES meal_entries(id) ON DELETE CASCADE,
    
    -- Food identification
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('protein', 'vegetable', 'fruit', 'grain', 'dairy', 'fat', 'processed', 'beverage')),
    confidence REAL DEFAULT 0.0,
    
    -- Quantity
    quantity_amount REAL,
    quantity_unit VARCHAR(50),
    quantity_confidence REAL DEFAULT 0.0,
    
    -- Nutritional values per serving
    calories REAL DEFAULT 0,
    protein REAL DEFAULT 0, -- grams
    carbs REAL DEFAULT 0, -- grams
    fat REAL DEFAULT 0, -- grams
    fiber REAL DEFAULT 0, -- grams
    sugar REAL DEFAULT 0, -- grams
    sodium REAL DEFAULT 0, -- mg
    
    -- Micronutrients (stored as JSON for flexibility)
    vitamins JSONB DEFAULT '[]',
    minerals JSONB DEFAULT '[]',
    
    -- Health scoring
    health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nutrition Goals Table
-- User's personalized nutrition targets
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Daily targets
    target_calories REAL NOT NULL,
    target_protein REAL NOT NULL, -- grams
    target_carbs REAL NOT NULL, -- grams
    target_fat REAL NOT NULL, -- grams
    target_fiber REAL NOT NULL, -- grams
    target_sodium REAL NOT NULL, -- mg
    target_water REAL DEFAULT 64, -- oz
    
    -- Goal metadata
    goal_type VARCHAR(50) DEFAULT 'maintenance' CHECK (goal_type IN ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'medical')),
    activity_level VARCHAR(20) DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    
    -- Medical considerations
    dietary_restrictions JSONB DEFAULT '[]', -- allergies, preferences
    medical_conditions JSONB DEFAULT '[]', -- diabetes, hypertension, etc.
    
    -- Validity period
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one active goal per user
    UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

-- Meal Recommendations Table
-- AI-generated meal suggestions based on goals and history
CREATE TABLE IF NOT EXISTS meal_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation metadata
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('daily_plan', 'meal_suggestion', 'nutrient_boost', 'medical_dietary')),
    meal_type VARCHAR(20) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    
    -- Recommendation content
    title VARCHAR(255) NOT NULL,
    description TEXT,
    foods JSONB NOT NULL DEFAULT '[]', -- Array of recommended foods
    
    -- Nutritional profile
    estimated_calories REAL,
    estimated_protein REAL,
    estimated_carbs REAL,
    estimated_fat REAL,
    estimated_fiber REAL,
    
    -- Recommendation scoring
    relevance_score REAL DEFAULT 0.0, -- How relevant to user's goals
    health_score INTEGER DEFAULT 0,
    
    -- User interaction
    viewed_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    
    -- Validity
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_timestamp ON meal_entries(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_meal_entries_meal_type ON meal_entries(meal_type);
CREATE INDEX IF NOT EXISTS idx_food_items_meal_entry ON food_items(meal_entry_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_active ON nutrition_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_meal_recommendations_user_type ON meal_recommendations(user_id, recommendation_type);

-- Comments for documentation
COMMENT ON TABLE meal_entries IS 'Individual meal records with AI analysis and nutritional data';
COMMENT ON TABLE food_items IS 'Individual foods identified within meals';
COMMENT ON TABLE nutrition_goals IS 'User personalized nutrition targets and dietary preferences';
COMMENT ON TABLE meal_recommendations IS 'AI-generated meal suggestions based on user goals and history';

-- Sample data for testing (optional)
-- INSERT INTO nutrition_goals (user_id, target_calories, target_protein, target_carbs, target_fat, target_fiber, target_sodium)
-- VALUES (1, 2000, 150, 250, 67, 25, 2300);
