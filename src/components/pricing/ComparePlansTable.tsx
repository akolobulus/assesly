
"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils"; 

const featuresData = [
  { 
    name: "Active Opportunities", 
    free: "3", 
    pro: "10", 
    enterprise: "Unlimited" 
  },
  { 
    name: "Applicants per Opportunity", 
    free: "100", 
    pro: "10,000", 
    enterprise: "Unlimited" 
  },
  { 
    name: "Basic Form Builder", 
    free: true, 
    pro: true, 
    enterprise: true 
  },
  { 
    name: "Advanced Form Builder (Custom Fields, Logic)", 
    free: false, 
    pro: true, 
    enterprise: true 
  },
  { 
    name: "Admin Accounts", 
    free: "1", 
    pro: "5", 
    enterprise: "Unlimited" 
  },
  { 
    name: "Role-Based Admin Permissions", 
    free: false, 
    pro: true, 
    enterprise: true 
  },
  { 
    name: "Scoring & Shortlisting Tools", 
    free: false, 
    pro: true, 
    enterprise: true 
  },
  { 
    name: "Bulk Export Functionality", 
    free: false, 
    pro: true, 
    enterprise: true 
  },
];

const planDetails = [
    { 
        name: "Free Plan", 
        price: "$0", 
        description: "Perfect for getting started!", 
        ctaLabel: "Start Free", 
        ctaHref: "/signup?plan=free",
        ctaVariant: "outline" as "outline" | "default",
    },
    { 
        name: "Pro Plan", 
        price: "₦30,000", 
        priceSuffix: "per month",
        description: "For growing teams.", 
        ctaLabel: "Start Now", 
        ctaHref: "/signup?plan=pro-yearly", 
        ctaVariant: "default" as "outline" | "default",
        isHighlighted: true,
    },
    { 
        name: "Enterprise Plan", 
        price: "Custom", 
        description: "For large organizations.", 
        ctaLabel: "Start Now", 
        ctaHref: "/contact-sales",
        ctaVariant: "outline" as "outline" | "default",
    }
];


export function ComparePlansTable() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          Compare Plans
        </h2>
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-[250px] text-sm font-semibold text-muted-foreground sticky left-0 bg-background z-10">Features</TableHead>
                {planDetails.map(plan => (
                  <TableHead key={plan.name} className="w-[200px] text-center p-4">
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {plan.price}
                      {plan.priceSuffix && <span className="text-sm font-normal text-muted-foreground ml-1">{plan.priceSuffix}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 h-8">{plan.description}</p>
                    <Button 
                        asChild 
                        variant={plan.ctaVariant} 
                        className={cn(
                            "w-full max-w-[150px]",
                            plan.ctaVariant === 'outline' && "border-primary text-primary",
                            plan.isHighlighted && "bg-primary text-primary-foreground"
                        )}
                    >
                      <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {featuresData.map((feature) => (
                <TableRow key={feature.name}>
                  <TableCell className="font-medium text-foreground sticky left-0 bg-background z-10">{feature.name}</TableCell>
                  {[feature.free, feature.pro, feature.enterprise].map((value, index) => (
                    <TableCell key={index} className="text-center">
                      {typeof value === 'boolean' ? (
                        value ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">{value}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
