"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Settings,
  User,
  Palette,
  Filter,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  Monitor,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { LanguageSwitcher } from "@/components/language-switcher"

interface SettingsPanelProps {
  className?: string
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  const { t } = useTranslation()
  const { preferences, updatePreferences, updateNestedPreference, resetPreferences } = useUserPreferences()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(preferences, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `expeditor-tracker-settings-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          updatePreferences(importedSettings)
        } catch (error) {
          console.error("Error importing settings:", error)
          alert("Error importing settings. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }

  const handleResetSettings = () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      resetPreferences()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Settings className="h-4 w-4 mr-2" />
            {t("settings")}
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("settingsAndPreferences")}
          </DialogTitle>
          <DialogDescription>
            {t("customizeExperience")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("general")}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t("appearance")}
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("filters")}
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              {t("data")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t("languageAndLocalization")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("interfaceLanguage")}</Label>
                  <LanguageSwitcher />
                </div>
                
                <div className="space-y-2">
                  <Label>{t("defaultDateRange")}</Label>
                  <Select
                    value={preferences.defaultDateRange.type}
                    onValueChange={(value) => updateNestedPreference("defaultDateRange", { type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current_month">{t("currentMonth")}</SelectItem>
                      <SelectItem value="last_week">{t("lastWeek")}</SelectItem>
                      <SelectItem value="last_month">{t("lastMonth")}</SelectItem>
                      <SelectItem value="custom">{t("customRange")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("userInterface")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("collapseSidebarByDefault")}</Label>
                    <p className="text-sm text-gray-500">
                      {t("startWithSidebarCollapsed")}
                    </p>
                  </div>
                  <Switch
                    checked={preferences.ui.sidebarCollapsed}
                    onCheckedChange={(checked) => updateNestedPreference("ui", { sidebarCollapsed: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>{t("defaultPanelStates")}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t("statisticsPanel")}</Label>
                      <Switch
                        checked={preferences.ui.panelsExpanded.statistics}
                        onCheckedChange={(checked) => updateNestedPreference("ui", {
                          panelsExpanded: { ...preferences.ui.panelsExpanded, statistics: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t("expeditorsPanel")}</Label>
                      <Switch
                        checked={preferences.ui.panelsExpanded.expeditors}
                        onCheckedChange={(checked) => updateNestedPreference("ui", {
                          panelsExpanded: { ...preferences.ui.panelsExpanded, expeditors: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t("checksPanel")}</Label>
                      <Switch
                        checked={preferences.ui.panelsExpanded.checks}
                        onCheckedChange={(checked) => updateNestedPreference("ui", {
                          panelsExpanded: { ...preferences.ui.panelsExpanded, checks: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{t("mapPanel")}</Label>
                      <Switch
                        checked={preferences.ui.panelsExpanded.map}
                        onCheckedChange={(checked) => updateNestedPreference("ui", {
                          panelsExpanded: { ...preferences.ui.panelsExpanded, map: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t("themeAndDisplay")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("themePreference")}</Label>
                  <Select
                    value={preferences.ui.theme}
                    onValueChange={(value) => updateNestedPreference("ui", { theme: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          {t("light")}
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          {t("dark")}
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {t("system")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>{t("columnVisibility")}</Label>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">{t("expeditorsTable")}</Label>
                      <div className="mt-2 space-y-2">
                        {["name", "phone_number", "transport_number", "filial", "checks_count"].map((column) => (
                          <div key={column} className="flex items-center justify-between">
                            <Label className="text-sm capitalize">{column.replace("_", " ")}</Label>
                            <Switch
                              checked={preferences.columnVisibility.expeditors.includes(column)}
                              onCheckedChange={(checked) => {
                                const currentColumns = preferences.columnVisibility.expeditors
                                const newColumns = checked
                                  ? [...currentColumns, column]
                                  : currentColumns.filter(c => c !== column)
                                updateNestedPreference("columnVisibility", {
                                  expeditors: newColumns
                                })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t("checksTable")}</Label>
                      <div className="mt-2 space-y-2">
                        {["check_id", "project", "city", "total_sum", "status", "check_date"].map((column) => (
                          <div key={column} className="flex items-center justify-between">
                            <Label className="text-sm capitalize">{column.replace("_", " ")}</Label>
                            <Switch
                              checked={preferences.columnVisibility.checks.includes(column)}
                              onCheckedChange={(checked) => {
                                const currentColumns = preferences.columnVisibility.checks
                                const newColumns = checked
                                  ? [...currentColumns, column]
                                  : currentColumns.filter(c => c !== column)
                                updateNestedPreference("columnVisibility", {
                                  checks: newColumns
                                })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t("statisticsPanel2")}</Label>
                      <div className="mt-2 space-y-2">
                        {["totalChecks", "deliveredChecks", "successRate", "totalSum", "avgCheckSum"].map((column) => (
                          <div key={column} className="flex items-center justify-between">
                            <Label className="text-sm">{column}</Label>
                            <Switch
                              checked={preferences.columnVisibility.statistics.includes(column)}
                              onCheckedChange={(checked) => {
                                const currentColumns = preferences.columnVisibility.statistics
                                const newColumns = checked
                                  ? [...currentColumns, column]
                                  : currentColumns.filter(c => c !== column)
                                updateNestedPreference("columnVisibility", {
                                  statistics: newColumns
                                })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t("defaultFilters")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("defaultProjectFilter")}</Label>
                    <Input
                      placeholder={t("allProjects")}
                      value={preferences.defaultFilters.project}
                      onChange={(e) => updateNestedPreference("defaultFilters", { project: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("defaultWarehouseFilter")}</Label>
                    <Input
                      placeholder={t("allWarehouses")}
                      value={preferences.defaultFilters.sklad}
                      onChange={(e) => updateNestedPreference("defaultFilters", { sklad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("defaultCityFilter")}</Label>
                    <Input
                      placeholder={t("allCities")}
                      value={preferences.defaultFilters.city}
                      onChange={(e) => updateNestedPreference("defaultFilters", { city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("defaultFilialFilter")}</Label>
                    <Input
                      placeholder={t("allFilials")}
                      value={preferences.defaultFilters.filial}
                      onChange={(e) => updateNestedPreference("defaultFilters", { filial: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t("defaultStatusFilter")}</Label>
                  <Select
                    value={preferences.defaultFilters.status || "all"}
                    onValueChange={(value) => updateNestedPreference("defaultFilters", { status: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("allStatuses")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allStatuses")}</SelectItem>
                      <SelectItem value="delivered">{t("delivered")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                      <SelectItem value="failed">{t("failed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t("savedFilterPresets")}
                  <Badge variant="secondary">{preferences.savedFilters.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferences.savedFilters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>{t("noSavedFilterPresets")}</p>
                    <p className="text-sm">{t("createAndSaveFilterCombinations")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {preferences.savedFilters.map((savedFilter) => (
                      <div key={savedFilter.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{savedFilter.name}</p>
                          <p className="text-sm text-gray-500">
                            {t("createdOn")} {new Date(savedFilter.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            {t("load")}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  {t("importAndExport")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exportSettings")}</Label>
                    <p className="text-sm text-gray-500">
                      {t("downloadCurrentSettings")}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleExportSettings}>
                    <Download className="h-4 w-4 mr-2" />
                    {t("export")}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>{t("importSettings")}</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    {t("uploadExportedSettings")}
                  </p>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("resetToDefaults")}</Label>
                    <p className="text-sm text-gray-500">
                      {t("clearAllCustomSettings")}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={handleResetSettings}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("reset")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  {t("dataManagement")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">{t("settingsStoredLocally")}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t("languagePreferences")}</li>
                    <li>{t("uiLayoutAndPanelStates")}</li>
                    <li>{t("defaultFiltersAndDateRanges")}</li>
                    <li>{t("savedFilterPresets2")}</li>
                    <li>{t("columnVisibilitySettings")}</li>
                    <li>{t("themePreferences")}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
