import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Lock, Loader2, CheckCircle2, AlertCircle, Compass } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetFormData = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) throw error

      setIsSuccess(true)
      toast.success("Password Updated!", {
        description: "You may now sign in with your new password.",
      })
      setTimeout(() => {
        navigate("/login")
      }, 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to update password."
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
            Set New Password
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-sans max-w-xs mx-auto">
            Choose a strong password to secure your expedition account.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-lg text-foreground">Password Reset Complete</h4>
              <p className="text-xs text-muted-foreground">Redirecting to login in a moment...</p>
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
                  <Label htmlFor="password" className="text-xs font-semibold">
                    New Password
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
                    Confirm New Password
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

                <Button
                  type="submit"
                  variant="editorial"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl font-semibold gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
