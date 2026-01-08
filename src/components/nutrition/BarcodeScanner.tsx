import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const [isStarting, setIsStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.777,
          },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              scanner.stop().catch(console.error);
            }
          },
          () => {
            // Ignore scan errors (no barcode found)
          }
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (err) {
        console.error("Scanner error:", err);
        if (mounted) {
          setIsStarting(false);
          setError(
            err instanceof Error
              ? err.message
              : "Kon camera niet starten. Controleer of je toestemming hebt gegeven."
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-medium flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Scan barcode
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center relative" ref={containerRef}>
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Camera starten...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10 p-6">
            <div className="text-center text-white">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>
                Sluiten
              </Button>
            </div>
          </div>
        )}

        <div id="barcode-reader" className="w-full max-w-md" />
      </div>

      <div className="p-4 bg-black/80 text-center">
        <p className="text-white/70 text-sm">
          Richt je camera op de barcode van het product
        </p>
      </div>
    </div>
  );
};
