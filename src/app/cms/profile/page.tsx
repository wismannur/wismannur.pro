"use client";

import type React from "react";

import ImageCropper from "@/components/profile/image-cropper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { userService } from "@/services";
import type { UserProfile } from "@/services";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Camera,
  Globe,
  Info,
  Key,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Save,
  Shield,
  Sparkles,
  Twitter,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Profile form schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Please enter a valid URL").or(z.literal("")).optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  github: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
});

// Password form schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const CmsProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Local preview for the avatar — seeded from the saved profile once loaded.
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display values from the saved profile, with the session as fallback.
  const displayName = profile?.displayName || user?.displayName || "Admin User";
  const displayEmail = profile?.email || user?.email || "";

  // Profile form — seeded from the session, then reset from the database.
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
      bio: "",
      website: "",
      location: "",
      github: "",
      twitter: "",
      linkedin: "",
    },
  });

  useEffect(() => {
    userService
      .getProfile()
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setPhotoPreview(data.photoURL);
        profileForm.reset({
          displayName: data.displayName,
          email: data.email,
          bio: data.bio || "",
          website: data.website || "",
          location: data.location || "",
          github: data.social?.github || "",
          twitter: data.social?.twitter || "",
          linkedin: data.social?.linkedin || "",
        });
      })
      .catch((error) => console.error("Error loading profile:", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const social = {
        github: data.github?.trim() || "",
        twitter: data.twitter?.trim() || "",
        linkedin: data.linkedin?.trim() || "",
      };
      await userService.updateProfile({
        displayName: data.displayName,
        bio: data.bio || "",
        website: data.website || "",
        location: data.location || "",
        social,
      });
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              displayName: data.displayName,
              bio: data.bio || "",
              website: data.website || "",
              location: data.location || "",
              social,
            }
          : prev
      );
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input change with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG or PNG)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size should not exceed 5MB");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedImageFile(file);
    setIsCropperOpen(true);
  };

  // Upload the cropped avatar to Vercel Blob (via the user service) and
  // persist the resulting URL on the profile row.
  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsCropperOpen(false);
    setSelectedImageFile(null);

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", new File([croppedBlob], "avatar.jpg", { type: croppedBlob.type }));
      const url = await userService.updateAvatar(formData);
      setPhotoPreview(url);
      setProfile((prev) => (prev ? { ...prev, photoURL: url } : prev));
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Admin Profile
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Manage your account credentials, public author info, and platform security
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-[#0C0E18]/80 border border-white/[0.08] p-1 rounded-xl">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 text-xs font-medium text-slate-400"
            >
              <User className="h-4 w-4 mr-2" />
              General Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg px-4 text-xs font-medium text-slate-400"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security & Credentials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Profile Picture Card */}
            <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
                <CardTitle className="text-lg text-slate-100 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-indigo-400" />
                  Profile Avatar
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Update your public profile photo. This appears on author bios, project attribution, and CMS header.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#131726]/60 border border-white/[0.06]">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/10">
                      <AvatarImage src={photoPreview || ""} alt={displayName} className="object-cover" />
                      <AvatarFallback className="text-2xl bg-[#131726] text-indigo-400 font-bold">
                        {displayName?.[0] || displayEmail?.[0] || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      aria-label="Change photo"
                      className="absolute -bottom-1 -right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer transition-transform group-hover:scale-110"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg, image/png"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-semibold text-base text-slate-100">{displayName}</h3>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        Owner / Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      {displayEmail}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 bg-[#131726]/80 border-white/[0.08] text-slate-300 hover:text-slate-100 hover:bg-white/[0.06] rounded-xl text-xs"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-3.5 w-3.5 mr-2 text-indigo-400" />
                      Upload New Photo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
                <CardTitle className="text-lg text-slate-100 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-indigo-400" />
                  Public Author Information
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Update public profile metadata displayed across your portfolio and blog posts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                              Full Name / Display Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Wisman Nur"
                                className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                              Account Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="admin@wismannur.pro"
                                type="email"
                                disabled
                                className="bg-[#131726]/40 border-white/[0.04] text-slate-400 cursor-not-allowed rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-[11px] text-slate-500">
                              Configured via the <code className="font-mono text-slate-400">ADMIN_EMAIL</code> environment variable.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Author Bio
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full-Stack Engineer & Designer building modern web and mobile experiences..."
                              className="min-h-24 bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-[11px] text-slate-500">
                            Brief introduction rendered in the AuthorBio block at the end of blog articles.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center">
                              <Globe className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                              Personal Website
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://wismannur.pro"
                                className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                              Location
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jakarta, Indonesia"
                                className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Social Handles */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                        Social & Developer Profiles
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="github"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-400">GitHub Username/URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://github.com/wismannur"
                                  className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-400 flex items-center">
                                <Twitter className="h-3.5 w-3.5 mr-1 text-sky-400" />
                                Twitter / X
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://x.com/wismannur"
                                  className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={profileForm.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-400 flex items-center">
                                <Linkedin className="h-3.5 w-3.5 mr-1 text-blue-400" />
                                LinkedIn
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://linkedin.com/in/wismannur"
                                  className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Profile...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Profile Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Change Password Card */}
            <Card className="bg-[#0C0E18]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden max-w-2xl">
              <CardHeader className="border-b border-white/[0.08] bg-[#131726]/40 p-6">
                <CardTitle className="text-lg text-slate-100 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-indigo-400" />
                  Change Administrator Password
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Update your dashboard password regularly to keep your CMS secure.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <Alert className="bg-[#131726]/60 border-white/[0.08] text-slate-300 rounded-xl">
                      <Info className="h-4 w-4 text-indigo-400" />
                      <AlertTitle className="text-xs font-semibold text-slate-200">
                        Password Requirements
                      </AlertTitle>
                      <AlertDescription className="text-xs text-slate-400">
                        Must be at least 6 characters long. Use a combination of uppercase letters, numbers, and special symbols for maximum strength.
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Current Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="••••••••"
                              type="password"
                              className="bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500/40 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        <>
                          <Key className="mr-2 h-4 w-4" />
                          Update Password
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

      {/* Image Cropper Dialog */}
      <ImageCropper
        imageFile={selectedImageFile}
        open={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onCropComplete={handleCroppedImage}
      />
    </>
  );
};

export default CmsProfile;
