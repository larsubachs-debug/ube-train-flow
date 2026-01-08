import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, Clock, Users, ChefHat, Search, Filter, Plus } from "lucide-react";
import { useRecipes, Recipe } from "@/hooks/useRecipes";
import { RecipeDetailDialog } from "./RecipeDetailDialog";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (id: string) => void;
  onClick: () => void;
}

const RecipeCard = ({ recipe, onToggleFavorite, onClick }: RecipeCardProps) => {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {recipe.image_url && (
        <div className="relative h-40 bg-muted">
          <img 
            src={recipe.image_url} 
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(recipe.id);
            }}
          >
            <Heart 
              className={cn(
                "h-5 w-5",
                recipe.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{recipe.name}</h3>
        
        {recipe.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings}</span>
            </div>
          )}
          {recipe.difficulty && (
            <Badge variant="secondary" className="capitalize">
              {recipe.difficulty === 'easy' ? 'Makkelijk' : 
               recipe.difficulty === 'medium' ? 'Gemiddeld' : 'Moeilijk'}
            </Badge>
          )}
        </div>

        {recipe.calories_per_serving && (
          <div className="flex gap-3 text-xs">
            <span className="text-orange-500 font-medium">{recipe.calories_per_serving} kcal</span>
            {recipe.protein_per_serving && (
              <span className="text-blue-500">{recipe.protein_per_serving}g eiwit</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecipesListProps {
  showFavoritesOnly?: boolean;
}

export const RecipesList = ({ showFavoritesOnly = false }: RecipesListProps) => {
  const { recipes, loading, toggleFavorite, fetchRecipeWithIngredients } = useRecipes();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const categories = [...new Set(recipes.map(r => r.category).filter(Boolean))];

  const filteredRecipes = recipes.filter(recipe => {
    if (showFavoritesOnly && !recipe.is_favorite) return false;
    if (search && !recipe.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && recipe.category !== selectedCategory) return false;
    return true;
  });

  const handleRecipeClick = async (recipe: Recipe) => {
    setDetailLoading(true);
    const fullRecipe = await fetchRecipeWithIngredients(recipe.id);
    setSelectedRecipe(fullRecipe);
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="h-64 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek recepten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(null)}
          >
            Alle
          </Badge>
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat as string)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      )}

      {/* Recipe grid */}
      {filteredRecipes.length === 0 ? (
        <Card className="p-8 text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Geen recepten gevonden</h3>
          <p className="text-sm text-muted-foreground">
            {showFavoritesOnly 
              ? "Je hebt nog geen favoriete recepten opgeslagen"
              : "Probeer een andere zoekopdracht"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleFavorite={toggleFavorite}
              onClick={() => handleRecipeClick(recipe)}
            />
          ))}
        </div>
      )}

      {/* Recipe Detail Dialog */}
      <RecipeDetailDialog
        recipe={selectedRecipe}
        open={!!selectedRecipe}
        onOpenChange={(open) => !open && setSelectedRecipe(null)}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};
