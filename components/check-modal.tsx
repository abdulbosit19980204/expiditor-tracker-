"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, MapPin, Calendar, CreditCard, User, Building } from "lucide-react"
import type { Check } from "@/lib/types"
import { format } from "date-fns"
import { uz } from "date-fns/locale"

interface CheckModalProps {
  check: Check | null
  isOpen: boolean
  onClose: () => void
  onShowOnMap: (lat: number, lng: number) => void
}

export function CheckModal({ check, isOpen, onClose, onShowOnMap }: CheckModalProps) {
  const [copied, setCopied] = useState(false)

  if (!check) return null

  const copyCheckId = async () => {
    await navigator.clipboard.writeText(check.check_id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openSoliqLink = () => {
    if (check.checkURL) {
      window.open(check.checkURL, "_blank")
    }
  }

  const showOnMap = () => {
    if (check.check_lat && check.check_lon) {
      onShowOnMap(check.check_lat, check.check_lon)
      onClose()
    }
  }

  const getPaymentMethods = () => {
    const methods = []
    if (check.nalichniy && check.nalichniy > 0) {
      methods.push({ name: "Naqd", amount: check.nalichniy, color: "bg-green-500" })
    }
    if (check.uzcard && check.uzcard > 0) {
      methods.push({ name: "UzCard", amount: check.uzcard, color: "bg-blue-500" })
    }
    if (check.humo && check.humo > 0) {
      methods.push({ name: "Humo", amount: check.humo, color: "bg-purple-500" })
    }
    if (check.click && check.click > 0) {
      methods.push({ name: "Click", amount: check.click, color: "bg-yellow-500" })
    }
    return methods
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Check Tafsilotlari</span>
            <Badge variant="outline">{check.check_id}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Check ID and Actions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Check ID:</span>
              <code className="px-2 py-1 bg-white rounded text-sm">{check.check_id}</code>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyCheckId}>
                <Copy className="h-4 w-4 mr-1" />
                {copied ? "Nusxalandi!" : "Nusxalash"}
              </Button>
              {check.checkURL && (
                <Button size="sm" variant="outline" onClick={openSoliqLink}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  soliq.uz
                </Button>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Sana:</span>
                <span className="font-medium">
                  {format(new Date(check.check_date), "dd MMM yyyy, HH:mm", { locale: uz })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Expeditor:</span>
                <span className="font-medium">{check.ekispiditor || "Noma'lum"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Loyiha:</span>
                <span className="font-medium">{check.project || "Noma'lum"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Shahar:</span>
                <span className="font-medium">{check.city || "Noma'lum"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sklad:</span>
                <span className="font-medium">{check.sklad || "Noma'lum"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">KKM:</span>
                <span className="font-medium">{check.kkm_number || "Noma'lum"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-semibold">To'lov Ma'lumotlari</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{check.total_sum?.toLocaleString() || "0"} so'm</div>
                <div className="text-sm text-blue-600">Umumiy summa</div>
              </div>

              <div className="space-y-2">
                {getPaymentMethods().map((method, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                      <span className="text-sm">{method.name}</span>
                    </div>
                    <span className="font-medium">{method.amount.toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          {check.check_lat && check.check_lon && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Lokatsiya</h3>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Latitude:</span>
                    <div className="font-mono text-sm">{check.check_lat}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Longitude:</span>
                    <div className="font-mono text-sm">{check.check_lon}</div>
                  </div>
                </div>
                <Button onClick={showOnMap} className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Xaritada Ko'rsatish
                </Button>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(check.agent || check.sborshik || check.transport_number) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Qo'shimcha Ma'lumotlar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {check.agent && (
                    <div>
                      <span className="text-sm text-gray-600">Agent:</span>
                      <div className="font-medium">{check.agent}</div>
                    </div>
                  )}
                  {check.sborshik && (
                    <div>
                      <span className="text-sm text-gray-600">Sborshik:</span>
                      <div className="font-medium">{check.sborshik}</div>
                    </div>
                  )}
                  {check.transport_number && (
                    <div>
                      <span className="text-sm text-gray-600">Transport:</span>
                      <div className="font-medium">{check.transport_number}</div>
                    </div>
                  )}
                  {check.yetkazilgan_vaqti && (
                    <div>
                      <span className="text-sm text-gray-600">Yetkazilgan vaqti:</span>
                      <div className="font-medium">
                        {format(new Date(check.yetkazilgan_vaqti), "dd MMM yyyy, HH:mm", { locale: uz })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
