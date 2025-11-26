-- Row Level Security (RLS) Policies for Meal Tracking Tables
-- Ensures users can only access their own meal data

-- Enable RLS on all meal tracking tables
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_recommendations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MEAL ENTRIES POLICIES
-- =============================================

-- Users can view their own meal entries
CREATE POLICY "Users can view own meal entries" ON meal_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own meal entries
CREATE POLICY "Users can insert own meal entries" ON meal_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own meal entries
CREATE POLICY "Users can update own meal entries" ON meal_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own meal entries
CREATE POLICY "Users can delete own meal entries" ON meal_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- FOOD ITEMS POLICIES
-- =============================================

-- Users can view food items from their own meals
CREATE POLICY "Users can view own food items" ON food_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meal_entries 
            WHERE meal_entries.id = food_items.meal_entry_id 
            AND meal_entries.user_id::text = auth.uid()::text
        )
    );

-- Users can insert food items to their own meals
CREATE POLICY "Users can insert own food items" ON food_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meal_entries 
            WHERE meal_entries.id = food_items.meal_entry_id 
            AND meal_entries.user_id::text = auth.uid()::text
        )
    );

-- Users can update food items in their own meals
CREATE POLICY "Users can update own food items" ON food_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meal_entries 
            WHERE meal_entries.id = food_items.meal_entry_id 
            AND meal_entries.user_id::text = auth.uid()::text
        )
    );

-- Users can delete food items from their own meals
CREATE POLICY "Users can delete own food items" ON food_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meal_entries 
            WHERE meal_entries.id = food_items.meal_entry_id 
            AND meal_entries.user_id::text = auth.uid()::text
        )
    );

-- =============================================
-- NUTRITION GOALS POLICIES
-- =============================================

-- Users can view their own nutrition goals
CREATE POLICY "Users can view own nutrition goals" ON nutrition_goals
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own nutrition goals
CREATE POLICY "Users can insert own nutrition goals" ON nutrition_goals
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own nutrition goals
CREATE POLICY "Users can update own nutrition goals" ON nutrition_goals
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own nutrition goals
CREATE POLICY "Users can delete own nutrition goals" ON nutrition_goals
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- MEAL RECOMMENDATIONS POLICIES
-- =============================================

-- Users can view their own meal recommendations
CREATE POLICY "Users can view own meal recommendations" ON meal_recommendations
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own meal recommendations (for AI system)
CREATE POLICY "Users can insert own meal recommendations" ON meal_recommendations
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own meal recommendations (rating, acceptance)
CREATE POLICY "Users can update own meal recommendations" ON meal_recommendations
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can delete their own meal recommendations
CREATE POLICY "Users can delete own meal recommendations" ON meal_recommendations
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =============================================
-- ADDITIONAL SECURITY MEASURES
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON food_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nutrition_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_recommendations TO authenticated;

-- Grant usage on sequences (for auto-incrementing IDs if any)
-- Note: We're using UUIDs, but this is good practice
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON POLICY "Users can view own meal entries" ON meal_entries IS 'Allows users to view only their own meal entries';
COMMENT ON POLICY "Users can view own food items" ON food_items IS 'Allows users to view food items only from their own meals';
COMMENT ON POLICY "Users can view own nutrition goals" ON nutrition_goals IS 'Allows users to view only their own nutrition goals';
COMMENT ON POLICY "Users can view own meal recommendations" ON meal_recommendations IS 'Allows users to view only their own meal recommendations';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('meal_entries', 'food_items', 'nutrition_goals', 'meal_recommendations');
