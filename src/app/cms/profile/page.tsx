"use client";

import type React from "react";

import ImageCropper from "@/components/profile/image-cropper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Camera, Info, Key, Loader2, Save, Shield, User } from "lucide-react";
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
  const displayName = profile?.displayName || user?.displayName || "User";
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
      toast.success("Profile updated");
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="general" className="data-[state=active]:bg-background">
              <User className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-background">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Update your profile picture. This will be displayed on your profile and in
                  comments.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={photoPreview || ""} alt={displayName} />
                    <AvatarFallback className="text-2xl">
                      {displayName?.[0] || displayEmail?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <Camera className="h-4 w-4" />
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-medium">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{displayEmail}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={triggerFileInput}>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information. This information will be displayed publicly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your email"
                              type="email"
                              disabled
                              className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Admin login email is configured via the ADMIN_EMAIL environment
                            variable.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us a little about yourself"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description for your profile. URLs are hyperlinked.
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
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
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
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Author social links — shown in the AuthorBio block on blog and
										    project detail pages. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/…" {...field} />
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
                            <FormLabel>Twitter / X</FormLabel>
                            <FormControl>
                              <Input placeholder="https://x.com/…" {...field} />
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
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/…" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <Alert variant="default" className="bg-muted/50">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Password requirements</AlertTitle>
                      <AlertDescription>
                        Your password must be at least 6 characters long.
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
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
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
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
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
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
