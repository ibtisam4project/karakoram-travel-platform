import React from "react"
import { Shield, Building2, Globe, Phone, Mail, MapPin, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-terracotta">
          Platform Configuration
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Platform &amp; Brand Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Review business operational parameters, localization rules, and company defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand & Organization */}
        <Card className="rounded-3xl border-border">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center gap-2 text-editorial-navy dark:text-editorial-sand">
              <Building2 className="w-5 h-5 text-editorial-terracotta" />
              <CardTitle className="font-serif text-lg font-bold">Organization Dossier</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Brand identity and legal operator credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Operator Name:</span>
              <span className="font-serif font-bold text-foreground">Karakoram &amp; Co.</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Urdu Title:</span>
              <span className="font-serif font-bold text-foreground">کاراکورم اینڈ کو</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Headquarters:</span>
              <span className="font-medium text-foreground">F-7 Markaz, Islamabad, Pakistan</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">DTS License:</span>
              <span className="font-mono text-foreground font-bold">DTS-PK-10882</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Currency Standards */}
        <Card className="rounded-3xl border-border">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center gap-2 text-editorial-navy dark:text-editorial-sand">
              <DollarSign className="w-5 h-5 text-editorial-terracotta" />
              <CardTitle className="font-serif text-lg font-bold">Financial Standards</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Monetary conventions locked across all platform layers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Settlement Currency:</span>
              <Badge variant="sand" className="text-xs font-mono font-bold">
                PKR (Pakistani Rupee)
              </Badge>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Payment Gateways:</span>
              <span className="font-medium text-foreground">Kuickpay, 1Link, Raast, Bank Wire</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">GST &amp; Tourism Levy:</span>
              <span className="font-medium text-foreground">Inclusive in displayed expedition rates</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/60">
              <span className="text-muted-foreground">Deposit Requirement:</span>
              <span className="font-medium text-foreground">30% advance on confirmation</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
