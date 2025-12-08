import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  hideLabel?: boolean;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      hideLabel = false,
      id,
      className,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s/g, "-")}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const successId = `${inputId}-success`;

    const describedBy = [
      error && errorId,
      hint && hintId,
      success && successId,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={inputId}
          className={cn(
            hideLabel && "sr-only",
            error && "text-destructive"
          )}
        >
          {label}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          )}
        </Label>

        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            aria-required={required}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              success && "border-ube-green focus-visible:ring-ube-green",
              (error || success) && "pr-10",
              className
            )}
            {...props}
          />

          {/* Status icon */}
          {(error || success) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              {error && <AlertCircle className="h-4 w-4 text-destructive" />}
              {success && !error && <CheckCircle2 className="h-4 w-4 text-ube-green" />}
            </div>
          )}
        </div>

        {/* Hint text */}
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="text-sm text-destructive flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Success message */}
        {success && !error && (
          <p
            id={successId}
            className="text-sm text-ube-green flex items-center gap-1"
            role="status"
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";
