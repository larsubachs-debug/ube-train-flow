import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface DataExportButtonProps<T> {
  data: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
}

export function DataExportButton<T extends Record<string, any>>({
  data,
  filename,
  columns,
}: DataExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = columns?.map(c => c.label) || Object.keys(data[0] || {});
      const keys = columns?.map(c => c.key) || Object.keys(data[0] || {});

      const csvContent = [
        headers.join(','),
        ...data.map(row =>
          keys
            .map(key => {
              const value = row[key];
              // Escape quotes and wrap in quotes if contains comma
              const stringValue = String(value ?? '');
              if (stringValue.includes(',') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(',')
        ),
      ].join('\n');

      downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      
      toast({
        title: "Export geslaagd",
        description: `${data.length} items geëxporteerd naar CSV.`,
      });
    } catch (error) {
      toast({
        title: "Export mislukt",
        description: "Er is een fout opgetreden bij het exporteren.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `${filename}.json`, 'application/json');
      
      toast({
        title: "Export geslaagd",
        description: `${data.length} items geëxporteerd naar JSON.`,
      });
    } catch (error) {
      toast({
        title: "Export mislukt",
        description: "Er is een fout opgetreden bij het exporteren.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!data.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporteren...' : 'Exporteren'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          Exporteer als CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          Exporteer als JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
