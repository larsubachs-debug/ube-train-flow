-- Create food_catalog table for common food items
CREATE TABLE public.food_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size NUMERIC NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  calories_per_serving INTEGER NOT NULL DEFAULT 0,
  carbs_per_serving NUMERIC NOT NULL DEFAULT 0,
  fat_per_serving NUMERIC NOT NULL DEFAULT 0,
  protein_per_serving NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone can view public food items
CREATE POLICY "Anyone can view public food items" 
ON public.food_catalog 
FOR SELECT 
USING (is_public = true);

-- Users can view their own custom food items
CREATE POLICY "Users can view own food items" 
ON public.food_catalog 
FOR SELECT 
USING (created_by = auth.uid());

-- Users can create custom food items
CREATE POLICY "Users can create food items" 
ON public.food_catalog 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Users can update their own food items
CREATE POLICY "Users can update own food items" 
ON public.food_catalog 
FOR UPDATE 
USING (created_by = auth.uid());

-- Coaches can manage all food items
CREATE POLICY "Coaches can manage food items" 
ON public.food_catalog 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_food_catalog_updated_at
BEFORE UPDATE ON public.food_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common Dutch food items
INSERT INTO public.food_catalog (name, brand, serving_size, serving_unit, calories_per_serving, carbs_per_serving, fat_per_serving, protein_per_serving, category) VALUES
-- Zuivel
('Magere kwark', NULL, 100, 'g', 54, 4, 0.1, 10, 'Zuivel'),
('Griekse yoghurt', NULL, 100, 'g', 97, 3.6, 5, 9, 'Zuivel'),
('Volle melk', NULL, 100, 'ml', 64, 4.7, 3.5, 3.3, 'Zuivel'),
('Halfvolle melk', NULL, 100, 'ml', 47, 4.8, 1.5, 3.5, 'Zuivel'),
('Cottage cheese', NULL, 100, 'g', 98, 3.4, 4.3, 11, 'Zuivel'),
('Mozzarella', NULL, 100, 'g', 280, 2.2, 17, 28, 'Zuivel'),
('Ei (gekookt)', NULL, 1, 'stuk', 78, 0.6, 5, 6, 'Zuivel'),

-- Vlees & Vis
('Kipfilet', NULL, 100, 'g', 110, 0, 1.3, 23, 'Vlees'),
('Rundergehakt mager', NULL, 100, 'g', 176, 0, 10, 21, 'Vlees'),
('Zalm', NULL, 100, 'g', 208, 0, 13, 20, 'Vis'),
('Tonijn (in water)', NULL, 100, 'g', 116, 0, 1, 26, 'Vis'),
('Kabeljauw', NULL, 100, 'g', 82, 0, 0.7, 18, 'Vis'),
('Garnalen', NULL, 100, 'g', 99, 0.2, 0.3, 24, 'Vis'),
('Kalkoenfilet', NULL, 100, 'g', 104, 0, 1, 24, 'Vlees'),

-- Granen & Brood
('Havermout', NULL, 100, 'g', 379, 67, 7, 13, 'Granen'),
('Volkoren brood', NULL, 1, 'snee', 69, 12, 1, 3, 'Brood'),
('Witte rijst (gekookt)', NULL, 100, 'g', 130, 28, 0.3, 2.7, 'Granen'),
('Volkoren pasta (gekookt)', NULL, 100, 'g', 124, 24, 1.1, 5, 'Granen'),
('Quinoa (gekookt)', NULL, 100, 'g', 120, 21, 1.9, 4.4, 'Granen'),
('Couscous (gekookt)', NULL, 100, 'g', 112, 23, 0.2, 3.8, 'Granen'),

-- Groenten
('Broccoli', NULL, 100, 'g', 35, 7, 0.4, 2.8, 'Groenten'),
('Spinazie', NULL, 100, 'g', 23, 3.6, 0.4, 2.9, 'Groenten'),
('Paprika', NULL, 100, 'g', 31, 6, 0.3, 1, 'Groenten'),
('Tomaat', NULL, 100, 'g', 18, 3.9, 0.2, 0.9, 'Groenten'),
('Komkommer', NULL, 100, 'g', 16, 3.6, 0.1, 0.7, 'Groenten'),
('Wortel', NULL, 100, 'g', 41, 10, 0.2, 0.9, 'Groenten'),
('Sla (gemengd)', NULL, 100, 'g', 15, 2.9, 0.2, 1.3, 'Groenten'),
('Champignons', NULL, 100, 'g', 22, 3.3, 0.3, 3.1, 'Groenten'),
('Avocado', NULL, 100, 'g', 160, 9, 15, 2, 'Groenten'),

-- Fruit
('Banaan', NULL, 1, 'stuk', 105, 27, 0.4, 1.3, 'Fruit'),
('Appel', NULL, 1, 'stuk', 95, 25, 0.3, 0.5, 'Fruit'),
('Sinaasappel', NULL, 1, 'stuk', 62, 15, 0.2, 1.2, 'Fruit'),
('Aardbeien', NULL, 100, 'g', 33, 8, 0.3, 0.7, 'Fruit'),
('Blauwe bessen', NULL, 100, 'g', 57, 14, 0.3, 0.7, 'Fruit'),

-- Noten & Zaden
('Amandelen', NULL, 100, 'g', 579, 22, 50, 21, 'Noten'),
('Walnoten', NULL, 100, 'g', 654, 14, 65, 15, 'Noten'),
('Pindakaas', NULL, 100, 'g', 588, 20, 50, 25, 'Noten'),
('Chiazaad', NULL, 100, 'g', 486, 42, 31, 17, 'Zaden'),
('Lijnzaad', NULL, 100, 'g', 534, 29, 42, 18, 'Zaden'),

-- Oliën & Vetten
('Olijfolie', NULL, 1, 'eetlepel', 119, 0, 14, 0, 'Oliën'),
('Kokosolie', NULL, 1, 'eetlepel', 121, 0, 14, 0, 'Oliën'),
('Roomboter', NULL, 100, 'g', 717, 0.1, 81, 0.9, 'Vetten'),

-- Supplementen
('Whey protein', NULL, 30, 'g', 120, 3, 1, 24, 'Supplementen'),
('Caseine protein', NULL, 30, 'g', 110, 3, 0.5, 24, 'Supplementen'),

-- Populaire producten
('Havermelk', 'Oatly', 100, 'ml', 46, 6.5, 1.5, 1, 'Zuivel'),
('Skyr naturel', 'Arla', 100, 'g', 63, 4, 0.2, 11, 'Zuivel'),
('Proteine shake', 'Optimum Nutrition', 1, 'portie', 120, 3, 1.5, 24, 'Supplementen'),
('Rijstwafels', NULL, 1, 'stuk', 35, 7, 0.3, 0.8, 'Snacks'),
('Hummus', NULL, 100, 'g', 166, 14, 10, 8, 'Snacks');
