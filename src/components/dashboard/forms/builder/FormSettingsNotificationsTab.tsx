
"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FormSettingsNotificationsTabProps {
  enableSubmissionNotifications: boolean;
  onEnableSubmissionNotificationsChange: (enabled: boolean) => void;
}

export function FormSettingsNotificationsTab({ enableSubmissionNotifications, onEnableSubmissionNotificationsChange }: FormSettingsNotificationsTabProps) {
  const [localEnableNotifications, setLocalEnableNotifications] = useState(enableSubmissionNotifications);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setLocalEnableNotifications(enableSubmissionNotifications);
    setIsDirty(false); // Reset dirty state when props change
  }, [enableSubmissionNotifications]);
  
  const handleToggleChange = (checked: boolean) => {
    setLocalEnableNotifications(checked);
    setIsDirty(checked !== enableSubmissionNotifications);
  };
  
  const handleCancel = () => {
    setLocalEnableNotifications(enableSubmissionNotifications);
    setIsDirty(false);
  };
  
  const handleUpdate = () => {
    onEnableSubmissionNotificationsChange(localEnableNotifications);
    setIsDirty(false);
    toast({
        title: "Notification Settings Updated",
        description: `Submission notifications are now ${localEnableNotifications ? 'enabled' : 'disabled'}.`
    });
  };

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage how you receive notifications for this form.</p>
        </div>
        <Card className="bg-card shadow-none border">
            <CardContent className="p-6 space-y-6">
                
                {/* Per-Form Notifications Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="enable-form-notifications" className="text-base font-medium text-foreground">
                            Enable notifications for this form
                        </Label>
                        <p className="text-sm text-muted-foreground mt-0.5">
                           Receive an in-app notification for each new submission.
                        </p>
                    </div>
                    <Switch
                        id="enable-form-notifications"
                        checked={localEnableNotifications}
                        onCheckedChange={handleToggleChange}
                        aria-label="Enable notifications for this form"
                    />
                </div>
                
                 {isDirty && (
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button onClick={handleUpdate}>Update</Button>
                    </div>
                )}
                
                <Separator />
                
                <div className="flex items-center justify-between opacity-50">
                    <div>
                        <Label htmlFor="enable-form-email-notifications" className="text-base font-medium text-foreground">
                            Enable email notifications
                        </Label>
                        <p className="text-sm text-muted-foreground mt-0.5">
                           Receive an email for each successful form submission. (Coming soon)
                        </p>
                    </div>
                    <Switch
                        id="enable-form-email-notifications"
                        disabled
                        aria-label="Enable email notifications"
                    />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
