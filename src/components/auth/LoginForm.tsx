
"use client"

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, type User } from "firebase/auth";
import { app } from "@/lib/firebase"; 
import { upsertUserInFirestore } from "@/lib/services/userService";

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
import { Loader2, Eye, EyeOff } from "lucide-react" 
import { useToast } from "@/hooks/use-toast";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { CardTitle } from "@/components/ui/card";

const SUPER_ADMIN_EMAIL = "microgrants.tech@gmail.com";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

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

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth(app);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function handleAuthSuccess(user: User) {
    await upsertUserInFirestore(user);
    const idToken = await user.getIdToken();
    await createSession(idToken);
    toast({
      title: "Login Successful!",
      description: "Welcome back!",
    });
    router.push("/dashboard");
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      toast({
        title: "Access Denied",
        description: "This is a Super Admin account. Please use the Super Admin login portal.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: errorMessage,
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
      const result = await signInWithPopup(auth, provider);
      if (result.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: "This is a Super Admin account. Please use the Super Admin login portal.",
          variant: "destructive",
        });
        setIsGoogleLoading(false);
        return;
      }
      await handleAuthSuccess(result.user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Google Sign-In popup closed by user.');
      } else {
        console.error("Google Sign-In error:", error);
        toast({
          title: "Google Sign-In Failed",
          description: error.message || "Could not sign in with Google.",
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
        <CardTitle className="text-3xl font-bold">Sign in</CardTitle>
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
                    className="focus-visible:ring-border"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/recover-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={isLoading || isGoogleLoading}
                      className="focus-visible:ring-border"
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
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
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
            Sign in with Google
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign Up
          </Link>
        </div>
      </Form>
    </div>
  )
}
