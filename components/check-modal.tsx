"use client"

import { ExternalLink, MapPin, Copy, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import type { Check } from "@/lib/types"

interface CheckModalProps {
  check: Check | null
  isOpen: boolean
  onClose: () => void
  onShowLocation?: (check: Check) => void
}

export function CheckModal({ check, isOpen, onClose, onShowLocation }: CheckModalProps) {
  if (!check) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: "Check ID copied to clipboard",
    })
  }

  const openCheckURL = () => {
    if (check.checkURL) {
      window.open(check.checkURL, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Check Details</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Check ID */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Check ID:</span>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{check.check_id}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(check.check_id)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Amount:</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(check.total_sum || 0)}</span>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div>
            <h4 className="font-medium mb-2">Payment Methods:</h4>
            <div className="space-y-2">
              {check.nalichniy > 0 && (
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span>{formatCurrency(check.nalichniy)}</span>
                </div>
              )}
              {check.uzcard > 0 && (
                <div className="flex justify-between">
                  <span>UzCard:</span>
                  <span>{formatCurrency(check.uzcard)}</span>
                </div>
              )}
              {check.humo > 0 && (
                <div className="flex justify-between">
                  <span>Humo:</span>
                  <span>{formatCurrency(check.humo)}</span>
                </div>
              )}
              {check.click > 0 && (
                <div className="flex justify-between">
                  <span>Click:</span>
                  <span>{formatCurrency(check.click)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Check Information */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Project:</span>
              <span>{check.project}</span>
            </div>
            <div className="flex justify-between">
              <span>Warehouse:</span>
              <span>{check.sklad}</span>
            </div>
            <div className="flex justify-between">
              <span>City:</span>
              <span>{check.city}</span>
            </div>
            <div className="flex justify-between">
              <span>Expeditor:</span>
              <span>{check.ekispiditor}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport:</span>
              <span>{check.transport_number}</span>
            </div>
            <div className="flex justify-between">
              <span>KKM:</span>
              <span>{check.kkm_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date(check.check_date).toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* View Check URL */}
            {check.checkURL && (
              <Button variant="outline" className="flex-1 bg-transparent" onClick={openCheckURL}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Check
              </Button>
            )}

            {/* Show Location */}
            {check.check_lat && check.check_lon && onShowLocation && (
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onShowLocation(check)}>
                <MapPin className="h-4 w-4 mr-2" />
                Show Location
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
