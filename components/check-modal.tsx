"use client"

import { useState } from "react"
import { MapPin, Calendar, CreditCard, ExternalLink, Copy, CheckIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import type { Check } from "../lib/types"

interface CheckModalProps {
  check: Check | null
  isOpen: boolean
  onClose: () => void
}

export function CheckModal({ check, isOpen, onClose }: CheckModalProps) {
  const [copied, setCopied] = useState(false)

  if (!check) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const openCheckURL = () => {
    if (check.check_detail?.checkURL) {
      window.open(check.check_detail.checkURL, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Check Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check ID and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Check ID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{check.check_id}</code>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(check.check_id)} className="h-6 w-6 p-0">
                {copied ? <CheckIcon className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>

          <Separator />

          {/* Check Details */}
          {check.check_detail && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </h3>

                {/* Total Amount */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-lg font-bold text-green-700">
                      {formatCurrency(check.check_detail.total_sum || 0)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {check.check_detail.nalichniy > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Cash</div>
                      <div className="font-semibold">{formatCurrency(check.check_detail.nalichniy)}</div>
                    </div>
                  )}
                  {check.check_detail.uzcard > 0 && (
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-xs text-gray-600">UzCard</div>
                      <div className="font-semibold text-blue-700">{formatCurrency(check.check_detail.uzcard)}</div>
                    </div>
                  )}
                  {check.check_detail.humo > 0 && (
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Humo</div>
                      <div className="font-semibold text-purple-700">{formatCurrency(check.check_detail.humo)}</div>
                    </div>
                  )}
                  {check.check_detail.click > 0 && (
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Click</div>
                      <div className="font-semibold text-orange-700">{formatCurrency(check.check_detail.click)}</div>
                    </div>
                  )}
                </div>

                {/* Date and Time */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Check Date:</span>
                  <span className="text-sm font-medium">{formatDateTime(check.check_detail.check_date)}</span>
                </div>

                {/* Location */}
                {check.check_detail.check_lat && check.check_detail.check_lon && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-mono">
                      {check.check_detail.check_lat.toFixed(6)}, {check.check_detail.check_lon.toFixed(6)}
                    </span>
                  </div>
                )}

                {/* QR Code Link */}
                {check.check_detail.checkURL && (
                  <div className="pt-2">
                    <Button onClick={openCheckURL} className="w-full flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Check on soliq.uz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Business Information */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Business Information</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Project:</span>
                  <div className="font-medium">{check.project || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Warehouse:</span>
                  <div className="font-medium">{check.sklad || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">City:</span>
                  <div className="font-medium">{check.city || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Expeditor:</span>
                  <div className="font-medium">{check.ekispiditor || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Agent:</span>
                  <div className="font-medium">{check.agent || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Collector:</span>
                  <div className="font-medium">{check.sborshik || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">Transport:</span>
                  <div className="font-medium">{check.transport_number || "N/A"}</div>
                </div>
                <div>
                  <span className="text-gray-600">KKM Number:</span>
                  <div className="font-medium font-mono">{check.kkm_number || "N/A"}</div>
                </div>
              </div>

              {check.yetkazilgan_vaqti && (
                <div className="pt-2 border-t">
                  <span className="text-gray-600 text-sm">Delivery Time:</span>
                  <div className="font-medium">{formatDateTime(check.yetkazilgan_vaqti)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
