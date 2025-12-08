import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value: externalValue,
  onSearch,
  placeholder = 'Zoeken...',
  debounceMs = 300,
  className,
  autoFocus = false,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(externalValue || '');
  const debouncedValue = useDebounce(inputValue, debounceMs);

  // Sync with external value
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== inputValue) {
      setInputValue(externalValue);
    }
  }, [externalValue]);

  // Trigger search on debounced value change
  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        autoFocus={autoFocus}
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
