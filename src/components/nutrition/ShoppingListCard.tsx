import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useShoppingList, ShoppingListItem } from "@/hooks/useShoppingList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export const ShoppingListCard = () => {
  const { activeList, loading, toggleItem, addItem, removeItem, CATEGORIES } = useShoppingList();
  const [newItem, setNewItem] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES));

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeList) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Geen boodschappenlijst</h3>
          <p className="text-sm text-muted-foreground">
            Genereer een lijst vanuit je maaltijdplan
          </p>
        </CardContent>
      </Card>
    );
  }

  const itemsByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = activeList.items?.filter(item => item.category === category) || [];
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const checkedCount = activeList.items?.filter(item => item.is_checked).length || 0;
  const totalCount = activeList.items?.length || 0;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleAddItem = async () => {
    if (!newItem.trim() || !activeList) return;
    await addItem(activeList.id, newItem.trim());
    setNewItem("");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {activeList.name}
          </div>
          <Badge variant="secondary">
            {checkedCount}/{totalCount}
          </Badge>
        </CardTitle>
        
        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Item toevoegen..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button onClick={handleAddItem} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Items by category */}
        <div className="space-y-2">
          {CATEGORIES.map(category => {
            const items = itemsByCategory[category];
            if (items.length === 0) return null;

            const categoryChecked = items.filter(i => i.is_checked).length;
            const isExpanded = expandedCategories.has(category);

            return (
              <Collapsible 
                key={category} 
                open={isExpanded}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{category}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryChecked}/{items.length}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-2 space-y-1">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                        item.is_checked && "bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={item.is_checked}
                        onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                      />
                      <span className={cn(
                        "flex-1 text-sm",
                        item.is_checked && "line-through text-muted-foreground"
                      )}>
                        {item.amount && `${item.amount} `}
                        {item.unit && `${item.unit} `}
                        {item.ingredient_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
