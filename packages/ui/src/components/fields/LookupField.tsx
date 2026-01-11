import React, { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { Label } from "../ui/label"
import { LookupFieldProps } from "./types"

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function LookupField({
  value,
  onChange,
  disabled,
  readOnly,
  className,
  placeholder,
  error,
  label,
  required,
  description,
  name,
  referenceTo, // The object name we are looking up
}: LookupFieldProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [contentLabel, setContentLabel] = useState<string>("")
  const [search, setSearch] = useState("")
  
  const debouncedSearch = useDebounce(search, 300)

  // Fetch initial label if value exists but we don't have the label
  useEffect(() => {
      if (value && !contentLabel) {
          // If value is an object (expanded), use it
          if (typeof value === 'object' && (value as any).name) {
              setContentLabel((value as any).name || (value as any).title || (value as any)._id);
              return;
          }
          
          if (typeof value !== 'string') return;

          // Fetch single record to get label
          fetch(`/api/data/${referenceTo}/${value}`)
            .then(res => res.json())
            .then(data => {
                if (data) {
                    setContentLabel(data.name || data.title || data.email || data._id || value);
                }
            })
            .catch(() => setContentLabel(value)); // Fallback to ID
      }
  }, [value, referenceTo]);

  // Search items
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    const params = new URLSearchParams();
    
    if (debouncedSearch) {
        // Try simple search first
        // In a real ObjectQL implementation this should use filters
        const filter = JSON.stringify([['name', 'contains', debouncedSearch], 'or', ['title', 'contains', debouncedSearch]]);
        params.append('filters', filter);
    }
    
    // Always limit results
    params.append('top', '20');

    fetch(`/api/data/${referenceTo}?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
            const list = Array.isArray(data) ? data : (data.list || []);
            setItems(list);
        })
        .catch(console.error)
        .finally(() => setLoading(false));

  }, [open, debouncedSearch, referenceTo]);

  const handleSelect = (currentValue: string, item: any) => {
    onChange?.(currentValue === value ? undefined : currentValue)
    setContentLabel(item.name || item.title || item.email || item._id);
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
      setContentLabel("");
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive"
            )}
            disabled={disabled || readOnly}
          >
            {value ? contentLabel || value : (placeholder || "Select record...")}
            {value && !disabled && !readOnly ? (
                <X className="ml-2 h-4 w-4 opacity-50 hover:opacity-100" onClick={handleClear} />
            ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
                placeholder={`Search ${referenceTo}...`} 
                value={search}
                onValueChange={setSearch} 
            />
            {loading && <div className="py-6 text-center text-sm text-muted-foreground flex justify-center"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...</div>}
            
            {!loading && (
                <CommandGroup className="max-h-[200px] overflow-auto">
                    {items.length === 0 ? (
                        <CommandEmpty>No results found.</CommandEmpty>
                    ) : (
                        items.map((item) => {
                            const itemId = item._id || item.id;
                            const itemLabel = item.name || item.title || item.email || itemId;
                            return (
                                <CommandItem
                                    key={itemId}
                                    value={itemId}
                                    onSelect={() => handleSelect(itemId, item)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === itemId ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {itemLabel}
                                </CommandItem>
                            )
                        })
                    )}
                </CommandGroup>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
