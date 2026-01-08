import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MealType } from "@/hooks/useFoodLogs";
import { useFoodCatalog, FoodCatalogItem } from "@/hooks/useFoodCatalog";
import { useRecentFoods, RecentFood } from "@/hooks/useRecentFoods";
import { Search, Plus, ArrowLeft, ChevronRight, ScanBarcode, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/useDebounce";
import { BarcodeScanner } from "./BarcodeScanner";
import { toast } from "sonner";

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  mealLabel: string;
  onAdd: (data: {
    name: string;
    calories: number;
    carbs: number;
    fat: number;
    protein: number;
  }) => void;
  isLoading: boolean;
}

type DialogStep = "search" | "quantity" | "manual" | "barcode";

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    proteins_100g?: number;
  };
  serving_size?: string;
}

export const AddFoodDialog = ({
  open,
  onOpenChange,
  mealType,
  mealLabel,
  onAdd,
  isLoading,
}: AddFoodDialogProps) => {
  const [step, setStep] = useState<DialogStep>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FoodCatalogItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  
  // Manual entry fields
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [protein, setProtein] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { data: catalogItems = [], isLoading: isSearching } = useFoodCatalog(debouncedSearch);
  const { data: recentFoods = [] } = useRecentFoods(5);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("search");
      setSearchQuery("");
      setSelectedItem(null);
      setQuantity("1");
      setName("");
      setCalories("");
      setCarbs("");
      setFat("");
      setProtein("");
    }
  }, [open]);

  const handleSelectItem = (item: FoodCatalogItem) => {
    setSelectedItem(item);
    setQuantity("1");
    setStep("quantity");
  };

  const handleSelectRecentFood = (item: RecentFood) => {
    // For recent foods, go directly to add with quantity 1
    onAdd({
      name: item.name,
      calories: item.calories,
      carbs: item.carbs,
      fat: item.fat,
      protein: item.protein,
    });
  };

  const handleAddFromCatalog = () => {
    if (!selectedItem) return;
    
    const multiplier = parseFloat(quantity) || 1;
    
    onAdd({
      name: `${selectedItem.name}${selectedItem.brand ? ` (${selectedItem.brand})` : ""} - ${quantity} ${selectedItem.serving_unit}`,
      calories: Math.round(selectedItem.calories_per_serving * multiplier),
      carbs: Math.round(selectedItem.carbs_per_serving * multiplier * 10) / 10,
      fat: Math.round(selectedItem.fat_per_serving * multiplier * 10) / 10,
      protein: Math.round(selectedItem.protein_per_serving * multiplier * 10) / 10,
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      calories: parseInt(calories) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      protein: parseFloat(protein) || 0,
    });
  };

  const handleBarcodeScan = async (barcode: string) => {
    setStep("search");
    setIsFetchingBarcode(true);

    try {
      // Fetch product info from Open Food Facts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product: OpenFoodFactsProduct = data.product;
        const nutriments = product.nutriments || {};

        // Create a catalog-like item from the scanned product
        const scannedItem: FoodCatalogItem = {
          id: barcode,
          name: product.product_name || "Onbekend product",
          brand: product.brands || null,
          serving_size: 100,
          serving_unit: "gram",
          calories_per_serving: Math.round(nutriments["energy-kcal_100g"] || 0),
          carbs_per_serving: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat_per_serving: Math.round((nutriments.fat_100g || 0) * 10) / 10,
          protein_per_serving: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
          category: null,
        };

        setSelectedItem(scannedItem);
        setQuantity("1");
        setStep("quantity");
        toast.success(`Product gevonden: ${scannedItem.name}`);
      } else {
        toast.error("Product niet gevonden in database");
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast.error("Kon product niet ophalen");
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const calculatedNutrition = selectedItem && quantity ? {
    calories: Math.round(selectedItem.calories_per_serving * (parseFloat(quantity) || 0)),
    carbs: Math.round(selectedItem.carbs_per_serving * (parseFloat(quantity) || 0) * 10) / 10,
    fat: Math.round(selectedItem.fat_per_serving * (parseFloat(quantity) || 0) * 10) / 10,
    protein: Math.round(selectedItem.protein_per_serving * (parseFloat(quantity) || 0) * 10) / 10,
  } : null;

  // Show barcode scanner as overlay
  if (step === "barcode") {
    return (
      <BarcodeScanner
        onScan={handleBarcodeScan}
        onClose={() => setStep("search")}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center gap-2">
            {step !== "search" && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setStep("search")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {step === "search" && `Voeding toevoegen - ${mealLabel}`}
              {step === "quantity" && "Hoeveelheid"}
              {step === "manual" && "Handmatig toevoegen"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search Step */}
        {step === "search" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-4 py-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek voedingsmiddel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("barcode")}
                disabled={isFetchingBarcode}
              >
                {isFetchingBarcode ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ScanBarcode className="h-4 w-4 mr-2" />
                )}
                {isFetchingBarcode ? "Product ophalen..." : "Scan barcode"}
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="space-y-1 pb-4">
                {/* Recent Foods Section - only show when no search query */}
                {!searchQuery && recentFoods.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Recent gebruikt</span>
                    </div>
                    {recentFoods.map((item, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => handleSelectRecentFood(item)}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{item.calories} kcal</span>
                            <span>•</span>
                            <span>K: {item.carbs}g</span>
                            <span>•</span>
                            <span>V: {item.fat}g</span>
                            <span>•</span>
                            <span>E: {item.protein}g</span>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    <div className="border-t my-3" />
                  </div>
                )}

                {/* Catalog Items */}
                {catalogItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {item.name}
                        {item.brand && (
                          <span className="text-muted-foreground font-normal"> ({item.brand})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{item.calories_per_serving} kcal</span>
                        <span>•</span>
                        <span>{item.serving_size} {item.serving_unit}</span>
                        {item.category && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs py-0">
                              {item.category}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                {isSearching && (
                  <div className="p-4 text-center text-muted-foreground">
                    Zoeken...
                  </div>
                )}

                {!isSearching && catalogItems.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Geen resultaten gevonden
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep("manual")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Handmatig toevoegen
              </Button>
            </div>
          </div>
        )}

        {/* Quantity Step */}
        {step === "quantity" && selectedItem && (
          <div className="p-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium">
                {selectedItem.name}
                {selectedItem.brand && (
                  <span className="text-muted-foreground font-normal"> ({selectedItem.brand})</span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Per {selectedItem.serving_size} {selectedItem.serving_unit}: {selectedItem.calories_per_serving} kcal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Aantal ({selectedItem.serving_unit === 'stuk' || selectedItem.serving_unit === 'portie' || selectedItem.serving_unit === 'snee' || selectedItem.serving_unit === 'eetlepel' 
                  ? selectedItem.serving_unit 
                  : `x ${selectedItem.serving_size}${selectedItem.serving_unit}`})
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </div>

            {calculatedNutrition && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Voedingswaarden:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Calorieën:</span>{" "}
                    <span className="font-medium">{calculatedNutrition.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Koolhydraten:</span>{" "}
                    <span className="font-medium">{calculatedNutrition.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vet:</span>{" "}
                    <span className="font-medium">{calculatedNutrition.fat}g</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Eiwit:</span>{" "}
                    <span className="font-medium">{calculatedNutrition.protein}g</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("search")}
              >
                Terug
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleAddFromCatalog}
                disabled={isLoading || !quantity || parseFloat(quantity) <= 0}
              >
                {isLoading ? "Toevoegen..." : "Toevoegen"}
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry Step */}
        {step === "manual" && (
          <form onSubmit={handleManualSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                placeholder="bijv. Havermout met banaan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calories">Calorieën (kcal)</Label>
              <Input
                id="calories"
                type="number"
                placeholder="0"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="carbs">Koolh. (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Vet (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Eiwit (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep("search")}
              >
                Terug
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || !name.trim()}>
                {isLoading ? "Toevoegen..." : "Toevoegen"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
