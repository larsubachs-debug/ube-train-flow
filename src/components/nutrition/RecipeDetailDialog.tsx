import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Clock, Users, ChefHat } from "lucide-react";
import { Recipe } from "@/hooks/useRecipes";
import { cn } from "@/lib/utils";

interface RecipeDetailDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleFavorite: (id: string) => void;
}

export const RecipeDetailDialog = ({ 
  recipe, 
  open, 
  onOpenChange, 
  onToggleFavorite 
}: RecipeDetailDialogProps) => {
  if (!recipe) return null;

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleFavorite(recipe.id)}
            >
              <Heart 
                className={cn(
                  "h-5 w-5",
                  recipe.is_favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
        </DialogHeader>

        {recipe.image_url && (
          <div className="relative h-48 rounded-lg overflow-hidden">
            <img 
              src={recipe.image_url} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {totalTime > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
              {recipe.prep_time_minutes && recipe.cook_time_minutes && (
                <span className="text-xs">
                  ({recipe.prep_time_minutes} voorbereiden + {recipe.cook_time_minutes} koken)
                </span>
              )}
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} porties</span>
            </div>
          )}
          {recipe.difficulty && (
            <Badge variant="secondary" className="capitalize">
              {recipe.difficulty === 'easy' ? 'Makkelijk' : 
               recipe.difficulty === 'medium' ? 'Gemiddeld' : 'Moeilijk'}
            </Badge>
          )}
        </div>

        {/* Nutrition info */}
        {recipe.calories_per_serving && (
          <div className="grid grid-cols-4 gap-2 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-500">{recipe.calories_per_serving}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{recipe.protein_per_serving || 0}g</div>
              <div className="text-xs text-muted-foreground">Eiwit</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{recipe.carbs_per_serving || 0}g</div>
              <div className="text-xs text-muted-foreground">Koolh.</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500">{recipe.fat_per_serving || 0}g</div>
              <div className="text-xs text-muted-foreground">Vet</div>
            </div>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Ingrediënten
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map(ing => (
                <li key={ing.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>
                    {ing.amount && `${ing.amount} `}
                    {ing.unit && `${ing.unit} `}
                    {ing.name}
                    {ing.notes && <span className="text-muted-foreground"> ({ing.notes})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Bereiding</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
