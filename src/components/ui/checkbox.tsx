import { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-state={checked ? "checked" : "unchecked"}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300",
          "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked && "border-primary-500 bg-primary-500",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <Check
          className={cn(
            "h-3 w-3 text-white",
            checked ? "opacity-100" : "opacity-0"
          )}
        />
      </button>
    );
  }
);