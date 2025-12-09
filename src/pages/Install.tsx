import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell, 
  Zap,
  CheckCircle2,
  Share,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "App geïnstalleerd!",
        description: "U.be is toegevoegd aan je startscherm.",
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast({
        title: "Installatie gestart",
        description: "De app wordt geïnstalleerd...",
      });
    }
    
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: WifiOff,
      title: 'Offline beschikbaar',
      description: 'Train ook zonder internetverbinding'
    },
    {
      icon: Zap,
      title: 'Snelle toegang',
      description: 'Direct starten vanaf je startscherm'
    },
    {
      icon: Bell,
      title: 'Push notificaties',
      description: 'Ontvang herinneringen voor je workouts'
    },
    {
      icon: Smartphone,
      title: 'Native ervaring',
      description: 'Voelt aan als een echte app'
    }
  ];

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>App is geïnstalleerd!</CardTitle>
            <CardDescription>
              Je gebruikt U.be nu als geïnstalleerde app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ga naar Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/10 to-background px-4 pt-12 pb-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-foreground rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
          <img src="/app-icon-1024.png" alt="U.be" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Installeer U.be</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Voeg de app toe aan je startscherm voor de beste ervaring
        </p>
      </div>

      {/* Features */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-4">
              <feature.icon className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Install Instructions */}
      <div className="px-4 py-6 max-w-md mx-auto">
        {isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installeren op iPhone/iPad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Tik op het deel-icoon</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Share className="w-4 h-4" /> onderaan je scherm
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Scroll naar beneden</p>
                  <p className="text-sm text-muted-foreground">
                    Zoek "Zet op beginscherm"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Tik op "Voeg toe"</p>
                  <p className="text-sm text-muted-foreground">
                    De app verschijnt op je startscherm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Installeer App
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Één klik om te installeren. Geen app store nodig.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installeren op Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Open het menu</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MoreVertical className="w-4 h-4" /> rechtsboven in Chrome
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Tik op "App installeren"</p>
                  <p className="text-sm text-muted-foreground">
                    Of "Toevoegen aan startscherm"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Skip */}
      <div className="px-4 text-center">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Later, ga naar de app
        </Button>
      </div>
    </div>
  );
}
