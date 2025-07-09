"use client"

import { useState } from "react"
import { X, ExternalLink, MapPin, Calendar, CreditCard, Building, Warehouse } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "./loading-spinner"
import type { Check } from "../lib/types"

interface CheckModalProps {
  check: Check | null
  isOpen: boolean
  onClose: () => void
}

export function CheckModal({ check, isOpen, onClose }: CheckModalProps) {
  const [qrLoading, setQrLoading] = useState(false)

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
    })
  }

  const handleQRCodeClick = async () => {
    if (!check.check_detail?.checkURL) return

    setQrLoading(true)
    try {
      // Simulate loading delay for QR code
      await new Promise((resolve) => setTimeout(resolve, 1000))
      window.open(check.check_detail.checkURL, "_blank")
    } catch (error) {
      console.error("Error opening QR code:", error)
    } finally {
      setQrLoading(false)
    }
  }

  const showOnMap = () => {
    if (check.check_detail?.check_lat && check.check_detail?.check_lon) {
      // This would trigger showing the location on the map
      console.log("Show location on map:", {
        lat: check.check_detail.check_lat,
        lng: check.check_detail.check_lon,
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Check Details
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check ID and Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold font-mono">{check.check_id}</h3>
              <p className="text-sm text-gray-500">Check ID</p>
            </div>
            <Badge variant={check.yetkazilgan_vaqti ? "default" : "secondary"}>
              {check.yetkazilgan_vaqti ? "Delivered" : "Pending"}
            </Badge>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Project</span>
                </div>
                <p className="text-sm text-gray-700">{check.project || "N/A"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Warehouse className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Warehouse</span>
                </div>
                <p className="text-sm text-gray-700">{check.sklad || "N/A"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">City</span>
                </div>
                <p className="text-sm text-gray-700">{check.city || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium">Expeditor</span>
                <p className="text-sm text-gray-700">{check.ekispiditor || "N/A"}</p>
              </div>

              <div>
                <span className="text-sm font-medium">Transport</span>
                <p className="text-sm text-gray-700 font-mono">{check.transport_number || "N/A"}</p>
              </div>

              <div>
                <span className="text-sm font-medium">KKM Number</span>
                <p className="text-sm text-gray-700 font-mono">{check.kkm_number || "N/A"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Information */}
          {check.yetkazilgan_vaqti && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Delivery Time</span>
              </div>
              <p className="text-sm text-gray-700">{formatDateTime(check.yetkazilgan_vaqti)}</p>
            </div>
          )}

          {/* Check Details */}
          {check.check_detail && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-semibold">Payment Details</h4>

                {/* Total Amount */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(check.check_detail.total_sum || 0)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {check.check_detail.nalichniy > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Cash</div>
                      <div className="font-semibold">{formatCurrency(check.check_detail.nalichniy)}</div>
                    </div>
                  )}

                  {check.check_detail.uzcard > 0 && (
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-sm text-gray-600">UzCard</div>
                      <div className="font-semibold">{formatCurrency(check.check_detail.uzcard)}</div>
                    </div>
                  )}

                  {check.check_detail.humo > 0 && (
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Humo</div>
                      <div className="font-semibold">{formatCurrency(check.check_detail.humo)}</div>
                    </div>
                  )}

                  {check.check_detail.click > 0 && (
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-sm text-gray-600">Click</div>
                      <div className="font-semibold">{formatCurrency(check.check_detail.click)}</div>
                    </div>
                  )}
                </div>

                {/* Check Date and Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Check Date</span>
                    <p className="text-sm text-gray-700">{formatDateTime(check.check_detail.check_date)}</p>
                  </div>

                  {check.check_detail.check_lat && check.check_detail.check_lon && (
                    <div>
                      <span className="text-sm font-medium">Location</span>
                      <p className="text-sm text-gray-700 font-mono">
                        {check.check_detail.check_lat.toFixed(6)}, {check.check_detail.check_lon.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {check.check_detail?.checkURL && (
              <Button onClick={handleQRCodeClick} disabled={qrLoading} className="flex-1">
                {qrLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View QR Code
                  </>
                )}
              </Button>
            )}

            {check.check_detail?.check_lat && check.check_detail?.check_lon && (
              <Button variant="outline" onClick={showOnMap} className="flex-1 bg-transparent">
                <MapPin className="h-4 w-4 mr-2" />
                Show on Map
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
