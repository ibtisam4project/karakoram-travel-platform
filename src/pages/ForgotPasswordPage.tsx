import { Reveal, useMagneticButton } from "@/lib/animation"
import React, { useState, useRef } from "react"
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Compass, Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const submitBtnRef = useRef<HTMLButtonElement>(null)
  useMagneticButton(submitBtnRef, { strength: 0.25 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const redirectUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setIsSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset could not be initiated."
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
            Password Recovery
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans max-w-xs mx-auto">
            Enter your registered email address to receive secure password reset instructions.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {isSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-lg text-foreground">Check Your Email</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We've sent a password reset link to your email address. Please follow the link to establish a new password.
                </p>
              </div>
              <Link to="/login" className="block pt-2">
                <Button variant="outline" className="rounded-xl w-full text-xs">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Account Email Address
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

                <Button
                  type="submit"
                  variant="editorial"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-semibold gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Return to Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
