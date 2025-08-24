"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./badge"

export interface SelectOption {
  value: string;
  label: string;
}

export interface GroupedSelectOption {
  label: string;
  options: SelectOption[];
}

interface GroupedMultiSelectComboboxProps {
  options: GroupedSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
}

export function GroupedMultiSelectCombobox({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No options found.",
}: GroupedMultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelectAll = (groupOptions: SelectOption[]) => {
    const groupValues = groupOptions.map(opt => opt.value);
    const newSelected = [...new Set([...selected, ...groupValues])];
    onChange(newSelected);
  };

  const selectedCount = selected.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedCount > 0 ? `${selectedCount} nội dung đã chọn` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            {options.map((group) => (
              <CommandGroup key={group.label} heading={
                <div className="flex justify-between items-center w-full">
                  <span>{group.label}</span>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={(e) => { e.stopPropagation(); handleSelectAll(group.options); }}>
                    Chọn tất cả
                  </Button>
                </div>
              }>
                {group.options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      const newSelected = selected.includes(option.value)
                        ? selected.filter((s) => s !== option.value)
                        : [...selected, option.value];
                      onChange(newSelected);
                    }}
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
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}