import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { educationModules } from "@/data/programs";
import { Brain, Heart, Dumbbell, Apple, Lightbulb, Play, Zap, Utensils, Search, Bookmark, X } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useEducationFavorites } from "@/hooks/useEducationFavorites";
import { Button } from "@/components/ui/button";

const iconMap = {
  sleep: Heart,
  stress: Brain,
  training: Dumbbell,
  nutrition: Apple,
  mindset: Lightbulb,
  hyrox: Zap,
  lifestyle: Utensils,
};

const colorMap = {
  sleep: "bg-blue-500/10 text-blue-600",
  stress: "bg-purple-500/10 text-purple-600",
  training: "bg-orange-500/10 text-orange-600",
  nutrition: "bg-green-500/10 text-green-600",
  mindset: "bg-amber-500/10 text-amber-600",
  hyrox: "bg-red-500/10 text-red-600",
  lifestyle: "bg-pink-500/10 text-pink-600",
};

const Education = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);
  const { favorites, toggleFavorite, isFavorite } = useEducationFavorites();
  
  const categories = [
    { id: null, name: "Alle", icon: Play },
    { id: "hyrox", name: "Hyrox Training", icon: Zap },
    { id: "training", name: "Training", icon: Dumbbell },
    { id: "nutrition", name: "Voeding", icon: Apple },
    { id: "sleep", name: "Slaap", icon: Heart },
    { id: "stress", name: "Stress", icon: Brain },
    { id: "mindset", name: "Mindset", icon: Lightbulb },
    { id: "lifestyle", name: "Lifestyle", icon: Utensils },
  ];

  const filteredModules = educationModules.filter((module) => {
    const matchesCategory = !selectedCategory || module.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.keyPoints.some(point => point.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFavorites = !showFavoritesOnly || isFavorite(module.id);
    
    return matchesCategory && matchesSearch && matchesFavorites;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Training Guides</h1>
        <p className="text-muted-foreground mb-4">
          Leer alles over trainen naar Hyrox en optimaliseer je prestaties.
        </p>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Favorites Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Bookmark className={`h-4 w-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
            Favorieten ({favorites.length})
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {filteredModules.map((module) => {
            const Icon = iconMap[module.category];
            const colorClass = colorMap[module.category];
            const isModuleFavorite = isFavorite(module.id);
            
            return (
              <Card 
                key={module.id} 
                className="p-5 hover:shadow-lg transition-shadow cursor-pointer relative"
                onClick={() => navigate(`/education/${module.id}`)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(module.id);
                  }}
                >
                  <Bookmark className={`h-4 w-4 ${isModuleFavorite ? "fill-current text-accent" : "text-muted-foreground"}`} />
                </Button>

                <div className="flex gap-4 pr-8">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{module.title}</h3>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {module.duration} min
                      </Badge>
                    </div>
                    
                    <ul className="space-y-1 mb-3">
                      {module.keyPoints.slice(0, 3).map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center gap-2 text-accent text-sm font-medium">
                      <Play className="w-4 h-4" />
                      <span>Lees Guide</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {showFavoritesOnly 
                ? "Je hebt nog geen favoriete guides." 
                : searchQuery 
                  ? "Geen guides gevonden voor je zoekopdracht."
                  : "Geen guides gevonden in deze categorie."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Education;
