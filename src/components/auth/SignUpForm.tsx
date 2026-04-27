
"use client"

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, type User } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { upsertUserInFirestore } from "@/lib/services/userService";
import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff } from "lucide-react" 
import { useToast } from "@/hooks/use-toast";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { CardTitle } from "@/components/ui/card";

const SUPER_ADMIN_EMAIL = "microgrants.tech@gmail.com"; // Email to block

const passwordValidation = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter.",
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: "Password must contain at least one special character.",
  });


const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).refine(
    (email) => email.toLowerCase() !== SUPER_ADMIN_EMAIL,
    { message: "This email address is reserved and cannot be used for sign-up." }
  ),
  password: passwordValidation,
  confirmPassword: z.string(),
  terms: z.literal<boolean>(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

async function createSession(idToken: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: idToken }),
  });
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = getAuth(app);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteId, setInviteId] = useState<string | null>(null);

  useEffect(() => {
    const inviteParam = searchParams.get('inviteId');
    if (inviteParam) {
      setInviteId(inviteParam);
    }
  }, [searchParams]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const termsChecked = form.watch("terms");

  const handleAuthSuccess = async (user: User) => {
    // Final check for social logins
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      // This is a failsafe. If a user somehow gets through the initial block,
      // we'll sign them out and show an error.
      await auth.signOut();
      toast({
        title: "Sign Up Blocked",
        description: "This email address is reserved and cannot be used for sign-up.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
      return;
    }

    await upsertUserInFirestore(user);
    const idToken = await user.getIdToken();
    await createSession(idToken);
    
    if (inviteId && user.email) {
      const inviteRef = doc(db, 'formInvitations', inviteId);
      try {
        const inviteSnap = await getDoc(inviteRef);
        if (inviteSnap.exists() && inviteSnap.data().recipientEmail === user.email && inviteSnap.data().recipientId === null) {
          await updateDoc(inviteRef, { recipientId: user.uid });
          toast({ title: "Invitation Linked", description: "You can now accept the invitation on the Teams page." });
        }
      } catch (error) {
        console.error("Failed to link invitation:", error);
      }
    }
    
    toast({
      title: "Account Created!",
      description: "Welcome! Redirecting...",
    });
    router.push(inviteId ? "/dashboard/teams" : "/dashboard");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const defaultDisplayName = values.email.split('@')[0];
      await updateProfile(user, { displayName: defaultDisplayName });
      await user.reload();
      const updatedUser = auth.currentUser;
      if (updatedUser) {
        await handleAuthSuccess(updatedUser);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // Here we can't pre-emptively check the email, but we can check it after sign-in.
      const result = await signInWithPopup(auth, provider);
      await handleAuthSuccess(result.user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Google Sign-In popup closed by user.');
      } else {
        console.error("Google Sign-Up error:", error);
        toast({
          title: "Google Sign-Up Failed",
          description: error.message || "Could not sign up with Google.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8"> 
      <div className="text-left">
        <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="name@work-email.com" 
                    {...field} 
                    disabled={isLoading || isGoogleLoading} 
                    className="focus-visible:ring-border text-foreground" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading || isGoogleLoading}
                      className="focus-visible:ring-border text-foreground" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading || isGoogleLoading}
                      className="focus-visible:ring-border text-foreground" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading || isGoogleLoading}
                    id="terms"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="terms" className="text-sm font-normal text-muted-foreground">
                     I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </FormLabel>
                  <FormMessage/>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !termsChecked}>
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center hover:bg-background hover:text-foreground hover:scale-105 transition-transform duration-150 ease-in-out" 
            onClick={handleGoogleSignIn} 
            disabled={isLoading || isGoogleLoading}
          >
             {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
              )}
            Sign Up with Google
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
        </div>
      </Form>
    </div>
  )
}
