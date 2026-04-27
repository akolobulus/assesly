
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export interface Plan {
  name: string;
  variant: 'basic' | 'pro' | 'enterprise';
  tagText?: string;
  price?: string | number;
  priceSuffix?: string;
  billingText?: string;
  savePercentText?: string;
  description: string;
  features: string[];
  ctaLabel: string;
  href: string;
  userEmail: string;
}

export function PricingCard({ 
  name, 
  variant,
  tagText,
  price, 
  priceSuffix,
  billingText,
  savePercentText,
  description, 
  features, 
  ctaLabel, 
  href,
  userEmail,
}: Plan) {
  
  const { toast } = useToast();
  const router = useRouter();
  const isPro = variant === 'pro';
  const isFree = price === 'Free';
  const isCustom = price === 'Custom';

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: userEmail,
    amount: (typeof price === 'number' ? price : 0) * 100, // Paystack amount is in kobo/cents
    publicKey: 'pk_test_25fcae045489e9a05dddc803de4e4f8213dbb367',
    metadata: {
      planName: name,
      billingCycle: billingText,
    },
    currency: 'NGN',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const onSuccess = (reference: any) => {
    console.log(reference);
    toast({
      title: "Payment Successful!",
      description: "Your subscription has been activated. We'll update your plan details shortly.",
    });
  };

  const onClose = () => {
    console.log('Payment modal closed.');
  };

  const handleSubscribe = () => {
    if (!userEmail) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to subscribe.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }
    initializePayment({ onSuccess, onClose });
  };
  
  const cardClasses = cn(
    "flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl relative bg-card text-card-foreground",
    {
      "border": variant === 'basic' || variant === 'enterprise', // Default border for basic/enterprise
      "border-2 border-primary": variant === 'pro', // Red border for Pro
      "lg:scale-105 lg:z-10": variant === 'pro' 
    }
  );

  const titleClasses = cn("text-2xl font-semibold text-foreground");
  const descriptionClasses = cn("mt-1 text-sm min-h-[3rem] text-muted-foreground");
  const priceTextClasses = cn("text-4xl font-bold text-foreground");
  const priceSuffixClasses = cn("ml-1 text-sm text-muted-foreground");
  const featureTextClasses = cn("text-sm text-muted-foreground");
  const featureCheckIconClasses = cn("h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-primary"); // Red check for all

  let ctaButtonVariant: "default" | "outline" = "outline";
  let ctaButtonClasses = "w-full border-primary text-primary hover:bg-primary/10";

  if (isPro) {
    ctaButtonVariant = "default";
    ctaButtonClasses = "w-full bg-primary text-primary-foreground hover:bg-primary/90";
  }
  
  const currencySymbol = priceSuffix?.toUpperCase().includes('NGN') ? '₦' : '$';

  return (
    <Card className={cardClasses}>
      {tagText && isPro && (
         <div className="absolute -top-px left-1/2 -translate-x-1/2 w-auto px-4 py-1.5 bg-primary rounded-b-md shadow-md z-20">
             <Badge variant="default" className="bg-transparent text-primary-foreground p-0 shadow-none hover:bg-transparent flex items-center">
                 <TagIcon className="h-4 w-4 mr-1.5 text-primary-foreground" /> {tagText}
            </Badge>
        </div>
      )}
      <CardHeader className={cn("pb-4", {"pt-12": isPro && tagText, "pt-8": !isPro || !tagText})}>
        <CardTitle className={titleClasses}>{name}</CardTitle>
        <CardDescription className={descriptionClasses}>{description}</CardDescription>
        {price && (
          <div className="flex items-baseline mt-4">
            <span className={priceTextClasses}>
              {typeof price === 'number' ? `${currencySymbol}${price.toLocaleString()}` : price}
            </span>
            {priceSuffix && !isFree && !isCustom && <span className={priceSuffixClasses}>{priceSuffix}</span>}
          </div>
        )}
        {billingText && !isFree && !isCustom &&(
          <div className="flex items-center gap-2 mt-1">
            <p className={`text-xs text-muted-foreground`}>{billingText}</p>
            {savePercentText && (
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 hover:bg-green-600">{savePercentText}</Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow pt-2 pb-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className={featureCheckIconClasses} />
              <span className={featureTextClasses}>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto pb-6">
        {isPro ? (
          <Button size="lg" variant={ctaButtonVariant} className={ctaButtonClasses} onClick={handleSubscribe}>
            {ctaLabel}
          </Button>
        ) : (
          <Button asChild size="lg" variant={ctaButtonVariant} className={ctaButtonClasses}>
            <Link href={href}>{ctaLabel}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
