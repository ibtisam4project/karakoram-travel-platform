import { Reveal, useMagneticButton } from "@/lib/animation"
import React, { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Compass, User, Mail, Lock, Phone, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { validatePakistaniPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number is too short")
      .refine((val) => validatePakistaniPhone(val), {
        message: "Please enter a valid Pakistani mobile number (e.g. +92 300 1234567 or 03001234567)",
      }),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  useMagneticButton(submitBtnRef, { strength: 0.25 })
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isConfirmationSent, setIsConfirmationSent] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const { error, user } = await signUp(data.email, data.password, data.fullName, data.phone)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      // Check if email confirmation is required by Supabase settings
      if (user && user.identities && user.identities.length === 0) {
        setErrorMessage("An account with this email already exists. Please sign in.")
        return
      }

      // If user session is created immediately (confirmation disabled or auto-confirmed)
      toast.success("Account Created!", {
        description: `Welcome to Karakoram & Co, ${data.fullName}.`,
      })

      setIsConfirmationSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration could not be completed."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isConfirmationSent) {
    return (
      <div className="container min-h-[80vh] flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-card border-border rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-foreground">Welcome to the Expedition!</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your guest account has been successfully created. If your Supabase project requires email verification, check your inbox to confirm your email address.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/dashboard">
              <Button variant="editorial" className="w-full rounded-xl">
                Go to Guest Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container min-h-[85vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-card border-border/80 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-editorial-sand/40 dark:bg-muted/30 pb-8 pt-8 border-b border-border/60 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-editorial-navy text-white mx-auto flex items-center justify-center shadow-subtle mb-1">
            <Compass className="w-6 h-6 text-editorial-gold" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-foreground">
            Begin Your Expedition
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans max-w-xs mx-auto">
            Create an account to book trips, track departure manifests, and save favorite trails.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Full Name (as per CNIC) *
              </Label>
              <div className="relative">
                <Input
                  id="fullName"
                  placeholder="e.g. Farhan Qureshi"
                  {...register("fullName")}
                  className="pl-10 rounded-xl h-11"
                />
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address *
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="farhan@example.com"
                  {...register("email")}
                  className="pl-10 rounded-xl h-11"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Pakistani Mobile Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Pakistani Mobile Phone *
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="+92 301 2345678"
                  {...register("phone")}
                  className="pl-10 rounded-xl h-11"
                />
                <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="pl-10 rounded-xl h-11"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                  Confirm *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    className="pl-10 rounded-xl h-11"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              ref={submitBtnRef}
              type="submit"
              variant="editorial"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Expedition Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border/80 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-editorial-terracotta hover:underline">
              Sign In Here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
