"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { LayoutV2 } from "@/components/layout-v2/layout-v2";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { useLoadingState } from "@/hooks/use-loading-state";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AuthForm = () => {
  const { withLoading } = useLoadingState();
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect straight to the CMS dashboard
  useEffect(() => {
    if (user) router.replace("/cms/dashboard");
  }, [user, router]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const userCredential = await withLoading(async () => signIn(data.email, data.password));
      if (!userCredential) {
        throw new Error("Invalid credentials. Access is restricted to authorized admin users.");
      }
      return userCredential;
    },
    onSuccess: () => {
      toast.success("Welcome back! Redirecting to CMS dashboard...");
      router.push("/cms/dashboard");
    },
    onError: (error: Error) => {
      console.error(error);
      const msg = error.message || "Failed to authenticate. Please check your credentials.";
      setAuthError(msg);
      toast.error(msg);
    },
    retry: false,
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    loginMutation.mutate(data);
  };

  return (
    <LayoutV2>
      <div className="min-h-[85vh] flex flex-col items-center justify-center py-16 px-4 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/12 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[250px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="w-full max-w-md mx-auto relative z-10 animate-fade-in">
          {/* Card Frame */}
          <Card className="rounded-3xl border border-white/[0.09] bg-[#0C0E18]/90 shadow-2xl shadow-black/80 backdrop-blur-2xl overflow-hidden">
            {/* Top Accent Gradient Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />

            <CardHeader className="space-y-3 p-6 sm:p-8 text-center pb-4">
              {/* Security Shield Monogram */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/30 shadow-lg shadow-primary/20 text-primary">
                <Lock className="h-6 w-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest mb-1">
                  <ShieldCheck size={11} />
                  <span>ADMINISTRATIVE ACCESS</span>
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
                  CMS Authentication
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                  Authenticate your credentials to access the engineering command center.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 pt-2">
              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3.5 rounded-2xl mb-5 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  {/* Email Field */}
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-gray-300">
                          Account Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              className="pl-10 h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-gray-600 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-xs sm:text-sm font-mono"
                              placeholder="admin@wismannur.pro"
                              autoComplete="email"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold text-gray-300">
                            Security Key / Password
                          </FormLabel>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              className="pl-10 pr-10 h-11 rounded-xl border-white/[0.08] bg-white/[0.03] text-white placeholder:text-gray-600 focus-visible:ring-primary/40 focus-visible:border-primary transition-all text-xs sm:text-sm font-mono"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••••••"
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-rose-400" />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl mt-2 bg-primary text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all group"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Authenticate to Dashboard</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Security Guard Notice */}
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[10px] text-gray-400 text-center font-mono">
                <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                <span>End-to-End Encrypted Session • Neon Auth Guard</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutV2>
  );
};

export default function AuthPage() {
  return <AuthForm />;
}
