
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AccessSettings } from './types';
import { useToast } from '@/hooks/use-toast';

interface FormSettingsAccessTabProps {
  accessSettings: AccessSettings;
  onAccessSettingsChange: (settings: AccessSettings) => void;
}

interface DateTimePickerProps {
  label: string;
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  time: string;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ label, date, onDateChange, time, onTimeChange, disabled }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <Label className="text-xs text-muted-foreground">{label} Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal h-10 mt-1",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex-1 sm:max-w-[120px]">
        <Label className="text-xs text-muted-foreground">{label} Time</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="h-10 mt-1 bg-background border-input"
          disabled={disabled}
        />
      </div>
    </div>
  );
};


interface AccessOptionProps {
  id: string;
  title: string;
  description?: string;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const AccessOption: React.FC<AccessOptionProps> = ({ id, title, description, isChecked, onCheckedChange, children, disabled }) => {
  return (
    <div className={cn("space-y-3", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={id} className="text-base font-medium text-foreground">
            {title}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <Switch
          id={id}
          checked={isChecked}
          onCheckedChange={onCheckedChange}
          aria-label={`Toggle ${title}`}
          disabled={disabled}
        />
      </div>
      {isChecked && children && <div className="pl-0 mt-2">{children}</div>}
    </div>
  );
};

export function FormSettingsAccessTab({ accessSettings, onAccessSettingsChange }: FormSettingsAccessTabProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<AccessSettings>(accessSettings || {});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalSettings(accessSettings || {});
  }, [accessSettings]);

  useEffect(() => {
    // Only set dirty if the component has mounted and settings are not being initialized
    if (accessSettings) {
        setIsDirty(JSON.stringify(localSettings) !== JSON.stringify(accessSettings));
    }
  }, [localSettings, accessSettings]);

  const handleToggleCloseForm = (checked: boolean) => {
    const newSettings: AccessSettings = { ...localSettings, isClosed: checked };
    if (checked) {
        newSettings.openDate = null;
        newSettings.closeDate = null;
        newSettings.submissionLimit = null;
        toast({ title: "Scheduling Disabled", description: "Manual close overrides automatic scheduling and submission limits." });
    }
    setLocalSettings(newSettings);
  };

  const handleToggleOpenDate = (checked: boolean) => {
      const newSettings: AccessSettings = { ...localSettings, openDate: checked ? new Date().toISOString() : null };
      if (checked) {
          newSettings.isClosed = false;
      }
      setLocalSettings(newSettings);
  };

  const handleToggleCloseDate = (checked: boolean) => {
      const newSettings: AccessSettings = { ...localSettings, closeDate: checked ? new Date().toISOString() : null };
      if (checked) {
          newSettings.isClosed = false;
          newSettings.submissionLimit = null;
      }
      setLocalSettings(newSettings);
  };

  const handleToggleSubmissionLimit = (checked: boolean) => {
      const newSettings: AccessSettings = { ...localSettings, submissionLimit: checked ? 100 : null };
      if (checked) {
          newSettings.isClosed = false;
          newSettings.closeDate = null;
      }
      setLocalSettings(newSettings);
  };
  
  const handleDateTimeChange = (key: 'openDate' | 'closeDate', newDate: Date | undefined, newTime: string) => {
    if (newDate) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const combinedDate = new Date(newDate);
        combinedDate.setHours(hours, minutes, 0, 0);
        setLocalSettings(prev => ({ ...prev, [key]: combinedDate.toISOString() }));
    } else {
        setLocalSettings(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleCancel = () => {
    setLocalSettings(accessSettings);
  };
  
  const handleUpdate = () => {
    const { openDate: openDateStr, closeDate: closeDateStr } = localSettings;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const openDate = openDateStr ? new Date(openDateStr) : null;
    const closeDate = closeDateStr ? new Date(closeDateStr) : null;

    // Rule 1: "Open Form" date cannot be in the past.
    if (openDate && openDate < startOfToday) {
      toast({
        title: "Invalid Open Date",
        description: "The form's open date cannot be set in the past.",
        variant: "destructive",
      });
      return;
    }

    // Rule 2: "Close Form" date must be in the future.
    if (closeDate && closeDate < new Date()) {
      toast({
        title: "Invalid Close Date",
        description: "The form's close date must be in the future.",
        variant: "destructive",
      });
      return;
    }

    if (openDate && closeDate) {
      // Rule 3: Open and close dates cannot be the same.
      const openDayStart = new Date(openDate);
      openDayStart.setHours(0, 0, 0, 0);
      const closeDayStart = new Date(closeDate);
      closeDayStart.setHours(0, 0, 0, 0);

      if (openDayStart.getTime() === closeDayStart.getTime()) {
        toast({
          title: "Invalid Date Range",
          description: "The open and close dates cannot be on the same day.",
          variant: "destructive",
        });
        return;
      }

      // Implied Rule: Close date must be after open date.
      if (closeDate <= openDate) {
        toast({
          title: "Invalid Date Range",
          description: "The form's close date must be set after the open date.",
          variant: "destructive",
        });
        return;
      }
    }

    onAccessSettingsChange(localSettings);
    toast({
        title: "Access Settings Updated",
        description: "Your changes have been saved."
    });
  };

  // Derived state for individual date/time pickers
  const openDate = localSettings.openDate ? new Date(localSettings.openDate) : undefined;
  const openTime = localSettings.openDate ? format(new Date(localSettings.openDate), 'HH:mm') : '09:00';
  const closeDate = localSettings.closeDate ? new Date(localSettings.closeDate) : undefined;
  const closeTime = localSettings.closeDate ? format(new Date(localSettings.closeDate), 'HH:mm') : '23:59';
  
  // Logic to disable conflicting options
  const disableCloseForm = !!localSettings.openDate || !!localSettings.closeDate || typeof localSettings.submissionLimit === 'number';
  const disableOpenDate = !!localSettings.isClosed;
  const disableCloseDate = !!localSettings.isClosed || typeof localSettings.submissionLimit === 'number';
  const disableSubmissionLimit = !!localSettings.isClosed || !!localSettings.closeDate;
  
  return (
    <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Access</h2>
        <Card className="bg-card shadow-none border">
            <CardContent className="p-6 space-y-6">
                <AccessOption
                    id="closeForm"
                    title="Close Form"
                    description="Manually close this form to restrict access and disable new responses. You can reopen it at any time."
                    isChecked={!!localSettings.isClosed}
                    onCheckedChange={handleToggleCloseForm}
                    disabled={disableCloseForm}
                />

                <Separator />

                <AccessOption
                    id="openOnDate"
                    title="Open form on a specific date"
                    description="Schedule your form to automatically start accepting responses at a future date and time."
                    isChecked={!!localSettings.openDate}
                    onCheckedChange={handleToggleOpenDate}
                    disabled={disableOpenDate}
                >
                    <DateTimePicker
                        label="Open"
                        date={openDate}
                        onDateChange={(d) => handleDateTimeChange('openDate', d, openTime)}
                        time={openTime}
                        onTimeChange={(t) => handleDateTimeChange('openDate', openDate, t)}
                    />
                </AccessOption>

                <Separator />

                <AccessOption
                    id="closeOnDate"
                    title="Close form on a specific date"
                    description="Set a deadline for your form. It will automatically stop accepting responses at this date and time."
                    isChecked={!!localSettings.closeDate}
                    onCheckedChange={handleToggleCloseDate}
                    disabled={disableCloseDate}
                >
                     <DateTimePicker
                        label="Close"
                        date={closeDate}
                        onDateChange={(d) => handleDateTimeChange('closeDate', d, closeTime)}
                        time={closeTime}
                        onTimeChange={(t) => handleDateTimeChange('closeDate', closeDate, t)}
                     />
                </AccessOption>

                <Separator />

                <AccessOption
                    id="limitSubmissions"
                    title="Limit number of submissions"
                    description="Close the form automatically after a specific number of submissions has been reached."
                    isChecked={typeof localSettings.submissionLimit === 'number'}
                    onCheckedChange={handleToggleSubmissionLimit}
                    disabled={disableSubmissionLimit}
                >
                    <Input
                        id="submissionLimitInput"
                        type="number"
                        value={localSettings.submissionLimit || ''}
                        onChange={(e) => setLocalSettings(prev => ({...prev, submissionLimit: e.target.value ? Number(e.target.value) : null}))}
                        placeholder="Enter limit"
                        className="h-10 bg-background border-input"
                        min="1"
                    />
                </AccessOption>

                 {isDirty && (
                    <>
                        <Separator />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                            <Button onClick={handleUpdate}>Update Settings</Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
