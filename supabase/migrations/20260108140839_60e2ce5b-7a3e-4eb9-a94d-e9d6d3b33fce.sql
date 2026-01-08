-- Create recipes table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT,
  calories_per_serving INTEGER,
  protein_per_serving NUMERIC(10,2),
  carbs_per_serving NUMERIC(10,2),
  fat_per_serving NUMERIC(10,2),
  instructions TEXT[],
  tags TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recipe ingredients table
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2),
  unit TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meal plans table (weekly menus)
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_template BOOLEAN DEFAULT false,
  created_by UUID,
  assigned_to UUID,
  assigned_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meal plan items (links recipes to specific days/meals)
CREATE TABLE public.meal_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  custom_name TEXT,
  servings INTEGER DEFAULT 1,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping list table
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shopping list items
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  amount NUMERIC(10,2),
  unit TEXT,
  category TEXT,
  is_checked BOOLEAN DEFAULT false,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create favorite recipes table
CREATE TABLE public.favorite_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS on all tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_recipes ENABLE ROW LEVEL SECURITY;

-- Recipes policies (public recipes visible to all, own recipes manageable)
CREATE POLICY "Public recipes are viewable by everyone"
ON public.recipes FOR SELECT
USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create recipes"
ON public.recipes FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recipes"
ON public.recipes FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own recipes"
ON public.recipes FOR DELETE
USING (auth.uid() = created_by);

-- Recipe ingredients policies
CREATE POLICY "Ingredients viewable with recipe"
ON public.recipe_ingredients FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.recipes r 
  WHERE r.id = recipe_id AND (r.is_public = true OR auth.uid() = r.created_by)
));

CREATE POLICY "Recipe owners can manage ingredients"
ON public.recipe_ingredients FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.recipes r 
  WHERE r.id = recipe_id AND auth.uid() = r.created_by
));

-- Meal plans policies
CREATE POLICY "Users can view own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = created_by OR auth.uid() = assigned_to OR is_template = true);

CREATE POLICY "Users can create meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = created_by OR auth.uid() = assigned_by);

CREATE POLICY "Users can delete own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = created_by);

-- Meal plan items policies
CREATE POLICY "Users can view meal plan items"
ON public.meal_plan_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.meal_plans mp 
  WHERE mp.id = meal_plan_id AND (auth.uid() = mp.created_by OR auth.uid() = mp.assigned_to OR mp.is_template = true)
));

CREATE POLICY "Users can manage meal plan items"
ON public.meal_plan_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.meal_plans mp 
  WHERE mp.id = meal_plan_id AND (auth.uid() = mp.created_by OR auth.uid() = mp.assigned_by)
));

-- Shopping lists policies
CREATE POLICY "Users can view own shopping lists"
ON public.shopping_lists FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping lists"
ON public.shopping_lists FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping lists"
ON public.shopping_lists FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping lists"
ON public.shopping_lists FOR DELETE
USING (auth.uid() = user_id);

-- Shopping list items policies
CREATE POLICY "Users can view own shopping list items"
ON public.shopping_list_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.shopping_lists sl 
  WHERE sl.id = shopping_list_id AND auth.uid() = sl.user_id
));

CREATE POLICY "Users can manage own shopping list items"
ON public.shopping_list_items FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shopping_lists sl 
  WHERE sl.id = shopping_list_id AND auth.uid() = sl.user_id
));

-- Favorite recipes policies
CREATE POLICY "Users can view own favorites"
ON public.favorite_recipes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorite_recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
ON public.favorite_recipes FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_recipes_category ON public.recipes(category);
CREATE INDEX idx_recipes_created_by ON public.recipes(created_by);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_meal_plans_assigned_to ON public.meal_plans(assigned_to);
CREATE INDEX idx_meal_plan_items_meal_plan_id ON public.meal_plan_items(meal_plan_id);
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_favorite_recipes_user_id ON public.favorite_recipes(user_id);