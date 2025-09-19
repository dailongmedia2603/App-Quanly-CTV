import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "./checkbox";

export interface GroupedOption {
  label: string;
  options: { value: string; label: string }[];
}

interface GroupedMultiSelectProps {
  options: GroupedOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  className?: string;
}

export function GroupedMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No options found.",
  className,
}: GroupedMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleSelectGroup = (group: GroupedOption) => {
    const groupValues = group.options.map(opt => opt.value);
    const areAllSelected = groupValues.every(val => selected.includes(val));
    
    let newSelected = [...selected];
    if (areAllSelected) {
      // Deselect all in group
      newSelected = newSelected.filter(val => !groupValues.includes(val));
    } else {
      // Select all in group
      groupValues.forEach(val => {
        if (!newSelected.includes(val)) {
          newSelected.push(val);
        }
      });
    }
    onChange(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-10", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              <Badge variant="secondary">{`${selected.length} đã chọn`}</Badge>
            ) : (
              <span className="text-gray-500 font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            {options.map((group) => {
              const groupValues = group.options.map(opt => opt.value);
              const areAllSelected = groupValues.length > 0 && groupValues.every(val => selected.includes(val));
              const areSomeSelected = groupValues.some(val => selected.includes(val));

              return (
                <CommandGroup key={group.label} heading={
                  <div className="flex items-center py-1.5 px-2 cursor-pointer" onClick={() => handleSelectGroup(group)}>
                    <Checkbox
                      id={`group-${group.label}`}
                      checked={areAllSelected ? true : (areSomeSelected ? 'indeterminate' : false)}
                      className="mr-2"
                    />
                    <label htmlFor={`group-${group.label}`} className="text-sm font-medium cursor-pointer">{group.label} ({group.options.length})</label>
                  </div>
                }>
                  {group.options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                      className="pl-8"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}