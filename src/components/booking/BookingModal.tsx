import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Calendar,
  Users,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  Loader2,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Tour, TourAvailability } from "@/types/database"
import { formatPKR, validatePakistaniPhone } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Schema validation for Pakistani traveler contact information
const travelerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number is too short")
    .refine((val) => validatePakistaniPhone(val), {
      message: "Please enter a valid Pakistani mobile number (e.g. +92 300 1234567 or 03001234567)",
    }),
  cnic: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{5}-[0-9]{7}-[0-9]{1}$|^[0-9]{13}$/.test(val), {
      message: "CNIC must be formatted as 12345-1234567-1 or 13 digits without dashes",
    }),
  specialRequests: z.string().optional(),
})

type TravelerFormData = z.infer<typeof travelerSchema>

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  selectedAvailability: TourAvailability
  travelersCount: number
  userId: string
  onBookingComplete?: () => void
}

export function BookingModal({
  isOpen,
  onClose,
  tour,
  selectedAvailability,
  travelersCount,
  userId,
  onBookingComplete,
}: BookingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [paymentMethod, setPaymentMethod] = useState<"jazzcash" | "easypaisa" | "bank" | "card">("jazzcash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [bookingRef, setBookingRef] = useState<string>("")
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("")

  const effectivePrice = tour.discount_price ?? tour.price
  const totalPrice = effectivePrice * travelersCount

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<TravelerFormData>({
    resolver: zodResolver(travelerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      cnic: "",
      specialRequests: "",
    },
  })

  // Edge-case verification: Re-check seat capacity right before insertion
  const handleFinalBookingConfirm = async () => {
    try {
      setIsProcessing(true)

      // Step 1: Query fresh availability to avoid race conditions / double bookings
      const { data: freshAvailability, error: availError } = await supabase
        .from("tour_availability")
        .select("*")
        .eq("id", selectedAvailability.id)
        .single()

      if (availError || !freshAvailability) {
        throw new Error("Unable to confirm seat status. Please refresh departure dates.")
      }

      const remainingSeats = freshAvailability.seats_total - freshAvailability.seats_booked
      if (remainingSeats < travelersCount || freshAvailability.status !== "open") {
        throw new Error(`Only ${remainingSeats} seat(s) remaining for this departure. Please reduce travelers or pick another date.`)
      }

      // Step 2: Generate distinct Pakistani booking reference (e.g. KC-2026-94821)
      const randomSuffix = Math.floor(10000 + Math.random() * 90000)
      const generatedRef = `KC-${new Date().getFullYear()}-${randomSuffix}`

      // Step 3: Insert booking into Supabase
      const contactData = getValues()
      const { data: insertedBooking, error: insertError } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          tour_id: tour.id,
          availability_id: selectedAvailability.id,
          travelers_count: travelersCount,
          total_price: totalPrice,
          status: "confirmed",
          booking_reference: generatedRef,
          contact_info: contactData,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Step 4: Decrement seats on tour_availability (increment seats_booked)
      const newSeatsBooked = freshAvailability.seats_booked + travelersCount
      const newStatus = newSeatsBooked >= freshAvailability.seats_total ? "full" : "open"

      await supabase
        .from("tour_availability")
        .update({
          seats_booked: newSeatsBooked,
          status: newStatus,
        })
        .eq("id", selectedAvailability.id)

      // Success
      setBookingRef(generatedRef)
      if (insertedBooking) setConfirmedBookingId(insertedBooking.id)
      setStep(4)
      toast.success("Expedition Booked!", {
        description: `Booking reference: ${generatedRef}. A confirmation has been logged to your account.`,
      })
      if (onBookingComplete) onBookingComplete()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking could not be processed"
      toast.error("Booking Notice", { description: msg })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden max-h-[92vh] flex flex-col bg-background rounded-3xl">
        {/* Step Indicator Header */}
        <div className="bg-editorial-navy text-white p-6 pb-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-editorial-sand/80">
            <span className="font-mono uppercase tracking-widest text-[11px]">
              Expedition Booking &bull; Step {step} of 4
            </span>
            <span className="font-serif italic text-editorial-gold">Karakoram &amp; Co.</span>
          </div>

          <DialogTitle className="text-xl font-serif text-white leading-tight">
            {step === 1 && "Confirm Selected Itinerary & Dates"}
            {step === 2 && "Lead Traveler & Contact Details"}
            {step === 3 && "Payment Simulation & Review"}
            {step === 4 && "Expedition Confirmed!"}
          </DialogTitle>

          {/* Progress bar */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-colors ${
                  s <= step ? "bg-editorial-terracotta" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-100px)]">
          {/* STEP 1: Summary of Tour & Date Confirmation */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <h4 className="font-serif font-bold text-lg text-foreground">{tour.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Departure Date:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
                      {new Date(selectedAvailability.departure_date).toLocaleDateString("en-PK", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Travelers:</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-editorial-terracotta" />
                      {travelersCount} Person(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Rate Per Traveler:</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {formatPKR(effectivePrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Total Payable:</span>
                    <span className="font-serif font-bold text-editorial-terracotta text-sm mt-0.5 block">
                      {formatPKR(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="editorial" onClick={() => setStep(2)} className="gap-2">
                  <span>Enter Traveler Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Details Form with react-hook-form + zod */}
          {step === 2 && (
            <form onSubmit={handleSubmit(() => setStep(3))} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs">
                  Full Name (as per CNIC / Passport) *
                </Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="e.g. Bilal Ahmed Siddiqui"
                  className="rounded-xl h-10"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="bilal@example.com"
                    className="rounded-xl h-10"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">
                    Pakistani Mobile Phone *
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+92 300 1234567"
                    className="rounded-xl h-10"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cnic" className="text-xs">
                  CNIC Number (Optional, for hotel/permit manifests)
                </Label>
                <Input
                  id="cnic"
                  {...register("cnic")}
                  placeholder="35201-1234567-1"
                  className="rounded-xl h-10"
                />
                {errors.cnic && (
                  <p className="text-[11px] text-destructive">{errors.cnic.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="specialRequests" className="text-xs">
                  Dietary / Seat / Room Preferences
                </Label>
                <Input
                  id="specialRequests"
                  {...register("specialRequests")}
                  placeholder="e.g. Vegetarian meal on trek, twin bed room"
                  className="rounded-xl h-10"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button type="submit" variant="editorial" size="sm">
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Simulated Pakistani Payment Methods */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Pakistani Payment Channel
                </Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(val: any) => setPaymentMethod(val)}
                  className="grid grid-cols-2 gap-3"
                >
                  <label
                    htmlFor="pay-jazz"
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      paymentMethod === "jazzcash"
                        ? "border-editorial-terracotta bg-editorial-terracotta/5 ring-1 ring-editorial-terracotta"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="jazzcash" id="pay-jazz" />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Smartphone className="w-4 h-4 text-editorial-terracotta" />
                        <span>JazzCash Mobile</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Instant 03XX wallet</span>
                    </div>
                  </label>

                  <label
                    htmlFor="pay-easy"
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      paymentMethod === "easypaisa"
                        ? "border-editorial-terracotta bg-editorial-terracotta/5 ring-1 ring-editorial-terracotta"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="easypaisa" id="pay-easy" />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <span>EasyPaisa</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Direct wallet transfer</span>
                    </div>
                  </label>

                  <label
                    htmlFor="pay-bank"
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      paymentMethod === "bank"
                        ? "border-editorial-terracotta bg-editorial-terracotta/5 ring-1 ring-editorial-terracotta"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="bank" id="pay-bank" />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Building2 className="w-4 h-4 text-editorial-navy dark:text-editorial-sand" />
                        <span>Online Bank Transfer</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">HBL, Meezan, Alfalah</span>
                    </div>
                  </label>

                  <label
                    htmlFor="pay-card"
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-editorial-terracotta bg-editorial-terracotta/5 ring-1 ring-editorial-terracotta"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <RadioGroupItem value="card" id="pay-card" />
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <CreditCard className="w-4 h-4 text-editorial-gold" />
                        <span>Debit / Credit Card</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">Visa / PayPak / Master</span>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Payment Detail Notice */}
              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-xs space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount Due:</span>
                  <span className="font-serif font-bold text-editorial-terracotta text-sm">
                    {formatPKR(totalPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {paymentMethod === "jazzcash" && "A USSD payment prompt or OTP verification will be simulated for your JazzCash wallet."}
                  {paymentMethod === "easypaisa" && "Instant tokenized checkout via EasyPaisa merchant API."}
                  {paymentMethod === "bank" && "Official Karakoram & Co. account details will be issued upon reservation."}
                  {paymentMethod === "card" && "Protected by 3D-Secure 256-bit bank encryption."}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={isProcessing}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  variant="editorial"
                  size="sm"
                  onClick={handleFinalBookingConfirm}
                  disabled={isProcessing}
                  className="gap-2 px-6"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Seats &amp; Reserving...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Reserve ({formatPKR(totalPrice)})</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation Screen */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-serif font-bold text-foreground">Expedition Reserved!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Shukriya for choosing Karakoram &amp; Co. Your departure has been registered with our expedition dispatch desk.
                </p>
              </div>

              {/* Reference Box */}
              <div className="p-4 rounded-2xl bg-card border border-border max-w-sm mx-auto space-y-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Booking Reference Number
                </span>
                <div className="flex items-center justify-between font-mono text-base font-bold text-editorial-navy dark:text-editorial-sand">
                  <span>{bookingRef}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookingRef)
                      toast.info("Copied to clipboard!")
                    }}
                    className="p-1 hover:text-editorial-terracotta"
                    title="Copy Reference"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex justify-between">
                  <span>Departure: {new Date(selectedAvailability.departure_date).toLocaleDateString()}</span>
                  <span className="font-semibold text-foreground">{travelersCount} Traveler(s)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button variant="outline" className="w-full sm:w-auto text-xs" onClick={onClose}>
                  Continue Exploring
                </Button>
                <Button
                  variant="editorial"
                  className="w-full sm:w-auto text-xs"
                  onClick={() => {
                    onClose()
                    window.location.href = "/dashboard"
                  }}
                >
                  View in My Bookings
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
