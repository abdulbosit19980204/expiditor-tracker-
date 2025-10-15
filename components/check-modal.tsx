"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin, Calendar, CreditCard, Building, User, Truck, Receipt, ExternalLink } from "lucide-react"
import { useTranslation } from "../lib/simple-i18n"
import type { Check } from "@/lib/types"

interface CheckModalProps {
  check: Check | null
  isOpen: boolean
  onClose: () => void
  onShowLocation?: (check: Check) => void
}

export function CheckModal({ check, isOpen, onClose, onShowLocation }: CheckModalProps) {
  const { t } = useTranslation()
  
  if (!check) return null

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(amount) + " UZS"
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const paymentMethods = [
    { key: "nalichniy", label: t("cash"), amount: check.nalichniy || 0, icon: "💵" },
    { key: "uzcard", label: t("uzcard"), amount: check.uzcard || 0, icon: "💳" },
    { key: "humo", label: t("humo"), amount: check.humo || 0, icon: "💳" },
    { key: "click", label: t("click"), amount: check.click || 0, icon: "📱" },
  ].filter((method) => method.amount > 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Check Details: {check.check_id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{t("expeditor")}</p>
                  <p className="text-sm text-gray-600">{check.ekispiditor || t("unknown")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{t("project")}</p>
                  <p className="text-sm text-gray-600">{check.project || t("unknown")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{t("city")}</p>
                  <p className="text-sm text-gray-600">{check.city || t("unknown")}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Check Date</p>
                  <p className="text-sm text-gray-600">{formatDate(check.check_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{t("transport")}</p>
                  <p className="text-sm text-gray-600">{check.transport_number || t("unknown")}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{t("kkmNumber")}</p>
                  <p className="text-sm text-gray-600">{check.kkm_number || t("unknown")}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">{t("warehouse")}</p>
              <p className="text-sm text-gray-600">{check.sklad || t("unknown")}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t("agent")}</p>
              <p className="text-sm text-gray-600">{check.agent || t("unknown")}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t("collector")}</p>
              <p className="text-sm text-gray-600">{check.sborshik || t("unknown")}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t("deliveryTime")}</p>
              <p className="text-sm text-gray-600">
                {check.yetkazilgan_vaqti ? formatDate(check.yetkazilgan_vaqti) : t("unknown")}
              </p>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </h3>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-green-800">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(check.total_sum || 0)}</span>
              </div>
            </div>

            {paymentMethods.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Payment Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div key={method.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{method.icon}</span>
                        <span className="font-medium">{method.label}</span>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {formatCurrency(method.amount)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {check.check_lat && check.check_lon && onShowLocation && (
              <Button
                onClick={() => {
                  onShowLocation(check)
                  onClose()
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Show on Map
              </Button>
            )}

            {check.checkURL && (
              <Button
                onClick={() => window.open(check.checkURL, "_blank")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Original Check
              </Button>
            )}

            <Button onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
