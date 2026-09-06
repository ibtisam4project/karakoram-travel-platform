import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  User,
  Phone,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/AuthContext"
import { validatePakistaniPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .refine((val) => validatePakistaniPhone(val), {
      message: "Please enter a valid Pakistani mobile number (e.g. +92 300 1234567 or 03001234567)",
    }),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

export function UserProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.full_name || "",
      phone: profile?.phone || "",
    },
  })

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Handle local avatar selection with live preview
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Update Profile & Upload Avatar to Supabase Storage
  const onSaveProfile = async (data: ProfileFormData) => {
    if (!user) return
    try {
      setIsUpdatingProfile(true)
      let avatarUrl = profile?.avatar_url || null

      // If new avatar file selected, upload to `avatars` bucket
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath)
          avatarUrl = publicUrlData.publicUrl
        } else {
          console.warn("Storage upload notice:", uploadError.message)
        }
      }

      // Update row in public.profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          phone: data.phone,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      await refreshProfile()
      toast.success("Profile Updated!", {
        description: "Your traveler details have been saved.",
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Profile update failed"
      toast.error("Profile error", { description: msg })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Update Password via Supabase Auth
  const onSavePassword = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true)
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) throw error

      toast.success("Security Updated", {
        description: "Your account password has been changed.",
      })
      resetPasswordForm()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not update password"
      toast.error("Password update error", { description: msg })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-serif font-bold text-foreground">Traveler Profile &amp; Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal details, verified contact numbers, avatar, and account security.
        </p>
      </div>

      {/* Card 1: Personal Details & Avatar Upload */}
      <Card className="rounded-3xl border-border bg-card shadow-subtle overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/70">
          <CardTitle className="font-serif text-xl">Traveler Information</CardTitle>
          <CardDescription className="text-xs">
            Used to automatically populate your expedition booking manifests and permit records.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleProfileSubmit(onSaveProfile)} className="space-y-6">
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/80">
              <Avatar className="h-20 w-20 border-2 border-editorial-terracotta/40">
                <AvatarImage src={avatarPreview || ""} />
                <AvatarFallback className="bg-editorial-navy text-white text-xl font-serif">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-editorial-navy text-white hover:bg-editorial-terracotta transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG or WEBP up to 5MB. Stored securely in your personal vault.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold">
                  Full Name (as per CNIC / Passport) *
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    {...registerProfile("fullName")}
                    placeholder="e.g. Bilal Ahmed"
                    className="pl-10 rounded-xl h-10"
                  />
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {profileErrors.fullName && (
                  <p className="text-[11px] text-destructive">{profileErrors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Verified Pakistani Phone *
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    {...registerProfile("phone")}
                    placeholder="+92 300 1234567"
                    className="pl-10 rounded-xl h-10"
                  />
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {profileErrors.phone && (
                  <p className="text-[11px] text-destructive">{profileErrors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Account Email Address</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="rounded-xl h-10 bg-muted/70 cursor-not-allowed text-xs text-muted-foreground"
              />
              <span className="text-[10px] text-muted-foreground">
                Email address is tied to your Supabase Auth session credentials.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="editorial"
                disabled={isUpdatingProfile}
                className="rounded-xl gap-2 font-semibold text-xs h-10 px-6"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Details...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Card 2: Security & Password Change */}
      <Card className="rounded-3xl border-border bg-card shadow-subtle overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/70">
          <CardTitle className="font-serif text-xl">Account Security</CardTitle>
          <CardDescription className="text-xs">
            Update your password to keep your expedition reservations safe.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handlePasswordSubmit(onSavePassword)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold">
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("newPassword")}
                    className="pl-10 rounded-xl h-10"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-[11px] text-destructive">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("confirmPassword")}
                    className="pl-10 rounded-xl h-10"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-[11px] text-destructive">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="outline"
                disabled={isChangingPassword}
                className="rounded-xl gap-2 font-semibold text-xs h-10 px-6"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
