import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Palette, Save, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranding } from "@/hooks/useBranding";

const fontOptions = [
  { value: 'system', label: 'Systeem Font' },
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'roboto', label: 'Roboto (Clean)' },
  { value: 'playfair', label: 'Playfair Display (Elegant)' },
  { value: 'montserrat', label: 'Montserrat (Bold)' }
];

export default function AdminBranding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: branding, isLoading } = useBranding();
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    app_name: 'U.be',
    tagline: 'ALL ABOUT U',
    hero_title: 'Welkom',
    hero_subtitle: '',
    logo_url: '',
    primary_color: '#1a1a1a',
    accent_color: '#ff6b00',
    font_family: 'system',
    show_weekly_progress: true,
    show_stats_cards: true
  });

  useEffect(() => {
    if (branding) {
      setSettings({
        app_name: branding.app_name || 'U.be',
        tagline: branding.tagline || 'ALL ABOUT U',
        hero_title: branding.hero_title || 'Welkom',
        hero_subtitle: branding.hero_subtitle || '',
        logo_url: branding.logo_url || '',
        primary_color: branding.primary_color || '#1a1a1a',
        accent_color: branding.accent_color || '#ff6b00',
        font_family: branding.font_family || 'system',
        show_weekly_progress: branding.show_weekly_progress ?? true,
        show_stats_cards: branding.show_stats_cards ?? true
      });
    }
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from('app_branding')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        ...settings
      });

    setIsSaving(false);

    if (error) {
      toast({
        title: "Fout",
        description: "Kon branding niet opslaan",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Opgeslagen!",
      description: "Branding instellingen zijn bijgewerkt"
    });

    queryClient.invalidateQueries({ queryKey: ['app-branding'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Palette className="h-8 w-8" />
            Branding & Styling
          </h1>
          <p className="text-muted-foreground">
            Pas de home pagina aan met je eigen branding
          </p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Algemene Instellingen</h2>
            <div className="space-y-4">
              <div>
                <Label>App Naam</Label>
                <Input
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  placeholder="U.be"
                />
              </div>

              <div>
                <Label>Tagline</Label>
                <Input
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="ALL ABOUT U"
                />
              </div>

              <div>
                <Label>Hero Titel</Label>
                <Input
                  value={settings.hero_title}
                  onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  placeholder="Welkom"
                />
              </div>

              <div>
                <Label>Hero Ondertitel (optioneel)</Label>
                <Textarea
                  value={settings.hero_subtitle}
                  onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  placeholder="Een welkomstbericht voor je members..."
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* Logo & Images */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo
            </h2>
            <div className="space-y-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://jouw-logo.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload je logo naar de Media pagina en kopieer de URL
                </p>
              </div>
              {settings.logo_url && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <p className="text-sm font-medium mb-2">Voorbeeld:</p>
                  <img 
                    src={settings.logo_url} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Colors */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Kleuren</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primaire Kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>

              <div>
                <Label>Accent Kleur</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={settings.accent_color}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.accent_color}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    placeholder="#ff6b00"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Typography */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Typografie</h2>
            <div>
              <Label>Font Familie</Label>
              <Select
                value={settings.font_family}
                onValueChange={(value) => setSettings({ ...settings, font_family: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Display Options */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Weergave Opties</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Wekelijkse Voortgang Tonen</Label>
                  <p className="text-sm text-muted-foreground">
                    Toon het voortgangsoverzicht op de home pagina
                  </p>
                </div>
                <Switch
                  checked={settings.show_weekly_progress}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_weekly_progress: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Statistieken Kaarten Tonen</Label>
                  <p className="text-sm text-muted-foreground">
                    Toon statistiek kaarten zoals streaks en PRs
                  </p>
                </div>
                <Switch
                  checked={settings.show_stats_cards}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_stats_cards: checked })}
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Opslaan...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Instellingen Opslaan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
