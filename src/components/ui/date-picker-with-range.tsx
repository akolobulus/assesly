"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, isSameDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  onDateChange?: (dateRange: DateRange | undefined) => void;
  initialDateRange?: DateRange;
  initialPresetLabel?: string;
}

const presetRangesDefinition = [
  { label: "All time", range: () => ({ from: undefined, to: undefined }) },
  { label: "Today", range: () => ({ from: new Date(), to: new Date() }) },
  { label: "Last week", range: () => ({ from: startOfWeek(subWeeks(new Date(), 1)), to: endOfWeek(subWeeks(new Date(), 1)) }) },
  { label: "Last month", range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Last year", range: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
];

export function DatePickerWithRange({
  className,
  onDateChange,
  initialDateRange = { from: undefined, to: undefined }, // Default to "All time" effectively
  initialPresetLabel = "All time",
}: DatePickerWithRangeProps) {
  const [appliedDate, setAppliedDate] = React.useState<DateRange | undefined>(initialDateRange);
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(initialDateRange);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState<string | null>(initialPresetLabel);
  const [displayLabel, setDisplayLabel] = React.useState<string>(initialPresetLabel);

  React.useEffect(() => {
    // Update display label when appliedDate or activePreset changes
    if (activePreset && presetRangesDefinition.find(p => p.label === activePreset)) {
      const preset = presetRangesDefinition.find(p => p.label === activePreset);
      if (preset) {
        const currentPresetRange = preset.range();
        // Check if appliedDate matches this preset's range
        const datesMatchPreset = 
          (currentPresetRange.from === undefined && appliedDate?.from === undefined && currentPresetRange.to === undefined && appliedDate?.to === undefined) ||
          (currentPresetRange.from && appliedDate?.from && isSameDay(currentPresetRange.from, appliedDate.from) &&
           currentPresetRange.to && appliedDate?.to && isSameDay(currentPresetRange.to, appliedDate.to)) ||
           (currentPresetRange.from && appliedDate?.from && isSameDay(currentPresetRange.from, appliedDate.from) && currentPresetRange.to === undefined && appliedDate?.to === undefined && preset.label === "All time" && appliedDate?.from === undefined);


        if (datesMatchPreset || preset.label === "All time" && !appliedDate?.from && !appliedDate?.to) {
            setDisplayLabel(preset.label);
            return;
        }
      }
    }

    if (appliedDate?.from) {
      if (appliedDate.to) {
        setDisplayLabel(`${format(appliedDate.from, "LLL dd, y")} - ${format(appliedDate.to, "LLL dd, y")}`);
      } else {
        setDisplayLabel(format(appliedDate.from, "LLL dd, y"));
      }
    } else {
      setDisplayLabel("All time"); // Fallback if no specific range or matching preset
    }
  }, [appliedDate, activePreset]);


  const handlePresetClick = (presetLabel: string) => {
    const preset = presetRangesDefinition.find(p => p.label === presetLabel);
    if (preset) {
      setTempDate(preset.range());
      setActivePreset(presetLabel);
    }
  };

  const handleApply = () => {
    setAppliedDate(tempDate);
    if (onDateChange) {
      onDateChange(tempDate);
    }
    // Determine if the applied tempDate matches any preset to update activePreset
    let matchedPresetLabel: string | null = null;
    for (const p of presetRangesDefinition) {
        const pr = p.range();
        const isMatch = 
            (pr.from === undefined && tempDate?.from === undefined && pr.to === undefined && tempDate?.to === undefined) || // Both fully undefined (All time)
            (pr.from && tempDate?.from && isSameDay(pr.from, tempDate.from) && pr.to && tempDate?.to && isSameDay(pr.to, tempDate.to)) || // Both dates match
            (pr.from && tempDate?.from && isSameDay(pr.from, tempDate.from) && !pr.to && !tempDate.to); // Only from date matches (Today)
        if (isMatch) {
            matchedPresetLabel = p.label;
            break;
        }
    }
    setActivePreset(matchedPresetLabel); // Update active preset based on applied range
    setPopoverOpen(false);
  };

  const handleCancel = () => {
    setTempDate(appliedDate); // Reset tempDate to the last applied state
    // Reset activePreset to match the appliedDate
    let currentAppliedPresetLabel: string | null = null;
     for (const p of presetRangesDefinition) {
        const pr = p.range();
        const isMatch = 
            (pr.from === undefined && appliedDate?.from === undefined && pr.to === undefined && appliedDate?.to === undefined) ||
            (pr.from && appliedDate?.from && isSameDay(pr.from, appliedDate.from) && pr.to && appliedDate?.to && isSameDay(pr.to, appliedDate.to)) ||
            (pr.from && appliedDate?.from && isSameDay(pr.from, appliedDate.from) && !pr.to && !appliedDate.to);
        if (isMatch) {
            currentAppliedPresetLabel = p.label;
            break;
        }
    }
    setActivePreset(currentAppliedPresetLabel);
    setPopoverOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setTempDate(range);
    setActivePreset(null); // Clear active preset when custom range is selected
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={popoverOpen} onOpenChange={(open) => {
        if (open) {
          // When opening, ensure tempDate and activePreset reflect the current applied state
          setTempDate(appliedDate);
          let currentAppliedPresetLabel: string | null = null;
          for (const p of presetRangesDefinition) {
              const pr = p.range();
              const isMatch = 
                  (pr.from === undefined && appliedDate?.from === undefined && pr.to === undefined && appliedDate?.to === undefined) ||
                  (pr.from && appliedDate?.from && isSameDay(pr.from, appliedDate.from) && pr.to && appliedDate?.to && isSameDay(pr.to, appliedDate.to)) ||
                  (pr.from && appliedDate?.from && isSameDay(pr.from, appliedDate.from) && !pr.to && !appliedDate.to);
              if (isMatch) {
                  currentAppliedPresetLabel = p.label;
                  break;
              }
          }
          setActivePreset(currentAppliedPresetLabel);
        }
        setPopoverOpen(open);
      }}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-auto justify-start text-left font-normal h-9 min-w-[180px]",
              !appliedDate?.from && !activePreset && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="end">
          <div className="flex flex-col space-y-1 p-3 pr-2 border-r border-border min-w-[150px]">
            {presetRangesDefinition.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm h-8 px-2 font-normal hover:bg-muted/20",
                  activePreset === preset.label && "bg-muted/20 hover:bg-muted/20"
                )}
                onClick={() => handlePresetClick(preset.label)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDate?.from}
              selected={tempDate}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
            />
            <div className="flex justify-end gap-2 p-3 border-t border-border">
              <Button variant="ghost" onClick={handleCancel} className="h-9">Cancel</Button>
              <Button onClick={handleApply} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">Apply</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
