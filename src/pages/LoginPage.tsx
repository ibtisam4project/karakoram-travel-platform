import React, { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Compass, Mail, Lock, Loader2, ArrowRight, AlertCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Determine return-to path (from state or default to /dashboard)
  const from = (location.state as any)?.from?.pathname || "/dashboard"

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const fillDemo = (role: "admin" | "traveler") => {
    if (role === "admin") {
      setValue("email", "admin@karakoram.co")
      setValue("password", "Karakoram2026!")
    } else {
      setValue("email", "traveler@karakoram.co")
      setValue("password", "Traveler2026!")
    }
    toast.info(`Filled ${role === "admin" ? "Staff Admin" : "Traveler"} credentials`)
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const { error } = await signIn(data.email, data.password)

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Incorrect email or password. Please check your credentials.")
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Your email has not been verified yet. Please check your inbox.")
        } else {
          setErrorMessage(error.message)
        }
        return
      }

      toast.success("Welcome back!", {
        description: "You have signed in to your Karakoram & Co. account.",
      })

      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred."
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container min-h-[80vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-md shadow-card border-border/80 rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-editorial-sand/40 dark:bg-muted/30 pb-8 pt-8 border-b border-border/60 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-editorial-navy text-white mx-auto flex items-center justify-center shadow-subtle mb-1">
            <Compass className="w-6 h-6 text-editorial-gold" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-foreground">
            Welcome to Karakoram &amp; Co.
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans max-w-xs mx-auto">
            Access your saved expeditions, confirmed booking manifests, and traveler profile.
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
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="bilal@example.com"
                  {...register("email")}
                  className="pl-10 rounded-xl h-11"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-editorial-terracotta hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
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

            <Button
              type="submit"
              variant="editorial"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl font-semibold gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* One-Click Evaluation Credentials */}
          <div className="pt-4 border-t border-border/80 space-y-3">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-2">
                Demo Credentials (One-Click Auto-Fill)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemo("admin")}
                  className="rounded-xl text-[11px] h-8 border-editorial-navy/30 dark:border-editorial-sand/30"
                >
                  👑 Fill Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemo("traveler")}
                  className="rounded-xl text-[11px] h-8 border-editorial-terracotta/40 text-editorial-terracotta"
                >
                  🧳 Fill Traveler
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-editorial-terracotta hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
