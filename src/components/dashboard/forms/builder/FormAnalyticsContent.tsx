
"use client";

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { DateRange } from "react-day-picker"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Monitor, Smartphone, Tablet, MonitorSmartphone  } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { getFormAnalytics, type FormAnalyticsData } from '@/lib/services/analyticsService';
import { format, subDays } from 'date-fns';

const initialAnalyticsData: FormAnalyticsData = {
  totalViews: 0,
  totalSubmissions: 0,
  submissionRate: 0,
  dropOffRate: 0,
  timeSeriesData: [],
  deviceData: [],
};

const chartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))",
  },
  submissions: {
    label: "Submissions",
    color: "hsl(145 74% 36%)", // Green
  },
} satisfies ChartConfig

const deviceChartConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--primary))", // Red
  },
  submissions: {
    label: "Submissions",
    color: "hsl(145 74% 36%)", // Green
  },
} satisfies ChartConfig;


export function FormAnalyticsContent({ formId, userId }: { formId: string | null, userId: string | null }) {
  const [analyticsData, setAnalyticsData] = useState<FormAnalyticsData>(initialAnalyticsData);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  useEffect(() => {
    if (!formId || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await getFormAnalytics(formId, userId, dateRange);
        setAnalyticsData(data);
      } catch (error) {
        console.error("Failed to fetch form analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [formId, userId, dateRange]);
  
  const getDeviceIcon = (device: string) => {
    switch (device) {
        case 'Desktop': return Monitor;
        case 'Mobile': return Smartphone;
        case 'Tablet': return Tablet;
        default: return MonitorSmartphone; // Default icon for 'Others'
    }
  }
  
  if (isLoading) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading analytics...</p>
        </div>
    );
  }

  const keyMetricsData = [
    { label: "No. Of Views", value: analyticsData.totalViews.toLocaleString() },
    { label: "Submissions", value: analyticsData.totalSubmissions.toLocaleString() },
    { label: "Submission Rate", value: `${analyticsData.submissionRate.toFixed(1)}%` },
    { label: "Dropoff Rate", value: `${analyticsData.dropOffRate.toFixed(1)}%` },
  ];
  
  return (
    <div className="flex-1 mt-0 overflow-hidden bg-background">
      <ScrollArea className="h-full">
        <div className="pt-4 px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {keyMetricsData.map(stat => (
                <Card key={stat.label} className="shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

             <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-semibold text-foreground">
                    Performance over time
                    </CardTitle>
                    <DatePickerWithRange 
                      initialDateRange={dateRange} 
                      onDateChange={setDateRange}
                    />
                </CardHeader>
                <CardContent className="pb-2">
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={analyticsData.timeSeriesData} margin={{ left: 12, right: 12 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="views"
                        fill="var(--color-views)"
                        radius={4}
                      />
                      <Bar
                        dataKey="submissions"
                        fill="var(--color-submissions)"
                        radius={4}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                Distribution of Views and Submissions by Device
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ChartContainer config={deviceChartConfig} className="h-[250px] w-full">
                  <BarChart data={analyticsData.deviceData} margin={{ top: 20 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="device" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                    <Bar dataKey="submissions" fill="var(--color-submissions)" radius={4} />
                  </BarChart>
                </ChartContainer>
                <div className="space-y-3">
                  {analyticsData.deviceData.map((item) => {
                    const Icon = getDeviceIcon(item.device);
                    const conversionRate = item.views > 0 ? (item.submissions / item.views) * 100 : 0;
                    return (
                      <div key={item.device} className="flex items-center p-3  rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-md mr-4">
                            <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">{item.device}</p>
                            <p className="text-base font-semibold text-foreground">
                                {item.views} views, {item.submissions} submissions
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {conversionRate.toFixed(1)}% conversion rate
                            </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
        </div>
      </ScrollArea>
    </div>
  );
}
