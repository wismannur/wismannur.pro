"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { userService } from "@/services";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bell,
  Globe,
  Info,
  Laptop,
  Loader2,
  Moon,
  Palette,
  Save,
  Settings,
  Sparkles,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Appearance form schema
const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme",
  }),
  colorScheme: z.enum(["blue", "green", "purple", "orange", "red"], {
    required_error: "Please select a color scheme",
  }),
});

// Notification form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  newCommentNotifications: z.boolean().default(true),
  mentionNotifications: z.boolean().default(true),
});

// Site settings form schema
const siteSettingsFormSchema = z.object({
  language: z.string({
    required_error: "Please select a language",
  }),
  timezone: z.string({
    required_error: "Please select a timezone",
  }),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"], {
    required_error: "Please select a date format",
  }),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;

const CmsSettings = () => {
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Appearance form — defaults from the live theme context until the saved
  // settings load from the database.
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme ?? "system",
      colorScheme: colorScheme ?? "blue",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      marketingEmails: false,
      newCommentNotifications: true,
      mentionNotifications: true,
    },
  });

  const siteSettingsForm = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: {
      language: "en",
      timezone: "Asia/Jakarta",
      dateFormat: "DD/MM/YYYY",
    },
  });

  // Seed all three forms from the saved settings row.
  useEffect(() => {
    userService
      .getSettings()
      .then((settings) => {
        if (!settings) return;
        appearanceForm.reset({ theme: settings.theme, colorScheme: settings.colorScheme });
        notificationForm.reset({
          emailNotifications: settings.emailNotifications,
          marketingEmails: settings.marketingEmails,
          newCommentNotifications: settings.newCommentNotifications,
          mentionNotifications: settings.mentionNotifications,
        });
        siteSettingsForm.reset({
          language: settings.language,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat as SiteSettingsFormValues["dateFormat"],
        });
      })
      .catch((error) => console.error("Error loading settings:", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    setIsLoading(true);
    try {
      setTheme(data.theme);
      setColorScheme(data.colorScheme);
      await userService.updateSettings(data);
      toast.success("Appearance settings updated successfully");
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast.error("Failed to save appearance settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onNotificationSubmit = async (data: NotificationFormValues) => {
    setIsLoading(true);
    try {
      await userService.updateSettings(data);
      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  const onSiteSettingsSubmit = async (data: SiteSettingsFormValues) => {
    setIsLoading(true);
    try {
      await userService.updateSettings(data);
      toast.success("Site settings updated successfully");
    } catch (error) {
      console.error("Error saving site settings:", error);
      toast.error("Failed to save site settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Manage system configuration, theme appearance, and notification alerts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="bg-[#0C0E18]/80 backdrop-blur-md border border-white/[0.08] p-1.5 rounded-2xl h-auto gap-1">
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-400 hover:text-slate-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all gap-2"
          >
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-400 hover:text-slate-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="site"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20 text-slate-400 hover:text-slate-200 rounded-xl px-4 py-2 text-xs font-semibold transition-all gap-2"
          >
            <Globe className="h-4 w-4" />
            Site Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
              <div className="flex items-center gap-2.5">
                <Palette className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Theme & Visual Appearance
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                Customize the visual interface of the dashboard. Choose your preferred color mode
                and accent color scheme.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...appearanceForm}>
                <form
                  onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Color Theme
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-400">
                            Select the background theme for your CMS workspace
                          </FormDescription>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              setTheme(value as AppearanceFormValues["theme"]);
                            }}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                          >
                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="light"
                                  className="sr-only"
                                  id="theme-light"
                                />
                              </FormControl>
                              <label
                                htmlFor="theme-light"
                                className={`w-full flex flex-col items-center justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                                  field.value === "light"
                                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 text-white"
                                    : "border-white/[0.08] bg-[#131726]/60 hover:bg-[#131726] hover:border-white/20 text-slate-300"
                                }`}
                              >
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-3">
                                  <Sun className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-semibold">Light Mode</span>
                                <span className="text-[11px] text-slate-400 mt-1">Clean & bright</span>
                              </label>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem value="dark" className="sr-only" id="theme-dark" />
                              </FormControl>
                              <label
                                htmlFor="theme-dark"
                                className={`w-full flex flex-col items-center justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                                  field.value === "dark"
                                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 text-white"
                                    : "border-white/[0.08] bg-[#131726]/60 hover:bg-[#131726] hover:border-white/20 text-slate-300"
                                }`}
                              >
                                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
                                  <Moon className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-semibold">Dark Obsidian</span>
                                <span className="text-[11px] text-slate-400 mt-1">Deep dark tones</span>
                              </label>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-2">
                              <FormControl>
                                <RadioGroupItem
                                  value="system"
                                  className="sr-only"
                                  id="theme-system"
                                />
                              </FormControl>
                              <label
                                htmlFor="theme-system"
                                className={`w-full flex flex-col items-center justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 ${
                                  field.value === "system"
                                    ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 text-white"
                                    : "border-white/[0.08] bg-[#131726]/60 hover:bg-[#131726] hover:border-white/20 text-slate-300"
                                }`}
                              >
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
                                  <Laptop className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-semibold">System Default</span>
                                <span className="text-[11px] text-slate-400 mt-1">Auto OS sync</span>
                              </label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="colorScheme"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Accent Color Scheme
                        </FormLabel>
                        <FormDescription className="text-xs text-slate-400">
                          Select the primary accent highlight color for buttons and indicators
                        </FormDescription>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setColorScheme(value as AppearanceFormValues["colorScheme"]);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40 h-11">
                              <SelectValue placeholder="Select a color scheme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200 rounded-xl">
                            <SelectItem value="blue" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                <span>Electric Blue</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="green" className="hover:bg-emerald-600/20 focus:bg-emerald-600/20 text-slate-300 focus:text-white">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span>Emerald Green</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="purple" className="hover:bg-purple-600/20 focus:bg-purple-600/20 text-slate-300 focus:text-white">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                <span>Neon Purple</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="orange" className="hover:bg-orange-600/20 focus:bg-orange-600/20 text-slate-300 focus:text-white">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                                <span>Vibrant Orange</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="red" className="hover:bg-rose-600/20 focus:bg-rose-600/20 text-slate-300 focus:text-white">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                <span>Crimson Red</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl px-5 h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Appearance
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
              <div className="flex items-center gap-2.5">
                <Bell className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Notification Settings
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                Configure how and when you receive real-time notifications from the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                  className="space-y-8"
                >
                  <Alert className="bg-[#131726]/60 border border-white/[0.08] text-slate-300 rounded-xl p-4">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <AlertTitle className="text-slate-200 font-semibold text-sm">
                      Email Notification Delivery
                    </AlertTitle>
                    <AlertDescription className="text-xs text-slate-400 mt-1">
                      Configure your email dispatch preferences. You can update these parameters anytime.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 transition-colors hover:border-white/10 hover:bg-[#131726]/80">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">
                              Direct Email Notifications
                            </FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Receive immediate email alerts for important platform activities and leads.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 transition-colors hover:border-white/10 hover:bg-[#131726]/80">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">
                              Marketing & Product Digest
                            </FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Receive periodic newsletters about new features and ecosystem updates.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="bg-white/[0.08]" />

                  <Alert className="bg-[#131726]/60 border border-white/[0.08] text-slate-300 rounded-xl p-4">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    <AlertTitle className="text-slate-200 font-semibold text-sm">
                      In-App Real-time Alerts
                    </AlertTitle>
                    <AlertDescription className="text-xs text-slate-400 mt-1">
                      Configure badge alerts and push notifications while browsing the CMS.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="newCommentNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 transition-colors hover:border-white/10 hover:bg-[#131726]/80">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">
                              New Blog Comments
                            </FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Receive notifications when readers submit comments on published posts.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="mentionNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 transition-colors hover:border-white/10 hover:bg-[#131726]/80">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-semibold text-slate-200">
                              Team Mentions & Activity
                            </FormLabel>
                            <FormDescription className="text-xs text-slate-400">
                              Receive alert triggers when someone mentions your handle in notes or logs.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl px-5 h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Notification Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Site Settings */}
        <TabsContent value="site" className="space-y-6">
          <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
              <div className="flex items-center gap-2.5">
                <Globe className="h-5 w-5 text-indigo-400" />
                <CardTitle className="text-lg font-bold text-white tracking-tight">
                  Global Site & Localization Settings
                </CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                Configure internationalization, timezone offsets, and date format representations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...siteSettingsForm}>
                <form
                  onSubmit={siteSettingsForm.handleSubmit(onSiteSettingsSubmit)}
                  className="space-y-8"
                >
                  <FormField
                    control={siteSettingsForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          Dashboard Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40 h-11">
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200 rounded-xl">
                            <SelectItem value="en" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              English (US)
                            </SelectItem>
                            <SelectItem value="id" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Bahasa Indonesia
                            </SelectItem>
                            <SelectItem value="es" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Spanish (Español)
                            </SelectItem>
                            <SelectItem value="fr" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              French (Français)
                            </SelectItem>
                            <SelectItem value="de" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              German (Deutsch)
                            </SelectItem>
                            <SelectItem value="ja" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Japanese (日本語)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-slate-400">
                          Select the primary language displayed in your administration dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={siteSettingsForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-slate-200">
                          System Timezone
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-[#131726]/80 border-white/[0.08] text-slate-200 rounded-xl focus:ring-indigo-500/40 h-11">
                              <SelectValue placeholder="Select a timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0C0E18]/95 backdrop-blur-xl border-white/[0.08] text-slate-200 rounded-xl max-h-60">
                            <SelectItem value="Asia/Jakarta" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Asia/Jakarta (WIB, UTC+7)
                            </SelectItem>
                            <SelectItem value="Asia/Makassar" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Asia/Makassar (WITA, UTC+8)
                            </SelectItem>
                            <SelectItem value="Asia/Jayapura" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Asia/Jayapura (WIT, UTC+9)
                            </SelectItem>
                            <SelectItem value="Asia/Singapore" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Asia/Singapore (SGT, UTC+8)
                            </SelectItem>
                            <SelectItem value="Asia/Tokyo" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Asia/Tokyo (JST, UTC+9)
                            </SelectItem>
                            <SelectItem value="UTC" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              UTC (Coordinated Universal Time)
                            </SelectItem>
                            <SelectItem value="Europe/London" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Europe/London (GMT/BST)
                            </SelectItem>
                            <SelectItem value="Europe/Paris" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              Europe/Paris (CET/CEST)
                            </SelectItem>
                            <SelectItem value="America/New_York" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              America/New_York (Eastern Time)
                            </SelectItem>
                            <SelectItem value="America/Chicago" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              America/Chicago (Central Time)
                            </SelectItem>
                            <SelectItem value="America/Denver" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              America/Denver (Mountain Time)
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles" className="hover:bg-indigo-600/20 focus:bg-indigo-600/20 text-slate-300 focus:text-white">
                              America/Los_Angeles (Pacific Time)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-slate-400">
                          Timestamp offset used for job tracking, audit logs, and lead timestamps.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={siteSettingsForm.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div>
                          <FormLabel className="text-sm font-semibold text-slate-200">
                            Date Display Format
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-400">
                            Choose how dates are rendered throughout table columns and metadata
                          </FormDescription>
                        </div>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 hover:bg-[#131726]/80 hover:border-white/10 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="DD/MM/YYYY" id="df-ddmmyyyy" />
                              </FormControl>
                              <FormLabel htmlFor="df-ddmmyyyy" className="font-normal text-slate-200 cursor-pointer">
                                <span className="font-semibold block text-sm">DD/MM/YYYY</span>
                                <span className="text-xs text-slate-400 block mt-0.5">31/12/2026 (Intl)</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 hover:bg-[#131726]/80 hover:border-white/10 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="MM/DD/YYYY" id="df-mmddyyyy" />
                              </FormControl>
                              <FormLabel htmlFor="df-mmddyyyy" className="font-normal text-slate-200 cursor-pointer">
                                <span className="font-semibold block text-sm">MM/DD/YYYY</span>
                                <span className="text-xs text-slate-400 block mt-0.5">12/31/2026 (US)</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0 rounded-xl border border-white/[0.08] bg-[#131726]/60 p-4 hover:bg-[#131726]/80 hover:border-white/10 cursor-pointer">
                              <FormControl>
                                <RadioGroupItem value="YYYY-MM-DD" id="df-yyyymmdd" />
                              </FormControl>
                              <FormLabel htmlFor="df-yyyymmdd" className="font-normal text-slate-200 cursor-pointer">
                                <span className="font-semibold block text-sm">YYYY-MM-DD</span>
                                <span className="text-xs text-slate-400 block mt-0.5">2026-12-31 (ISO)</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl px-5 h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Site Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CmsSettings;
