"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  HelpCircle, 
  Map, 
  BarChart3, 
  Filter, 
  Download, 
  Globe, 
  Palette,
  Users,
  Package,
  TrendingUp,
  Settings,
  FileText,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Clock,
  Target
} from "lucide-react"
import { useTranslation } from "../lib/simple-i18n"

interface HelpModalProps {
  className?: string
}

export function HelpModal({ className }: HelpModalProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const helpSteps = [
    {
      id: "getting-started",
      title: t("gettingStarted"),
      icon: <Target className="h-5 w-5" />,
      steps: [
        {
          title: t("step1SelectExpeditor"),
          description: t("step1SelectExpeditorDesc"),
          icon: <Users className="h-4 w-4" />
        },
        {
          title: t("step2ViewMap"),
          description: t("step2ViewMapDesc"),
          icon: <Map className="h-4 w-4" />
        },
        {
          title: t("step3CheckDetails"),
          description: t("step3CheckDetailsDesc"),
          icon: <Package className="h-4 w-4" />
        },
        {
          title: t("step4ViewStats"),
          description: t("step4ViewStatsDesc"),
          icon: <BarChart3 className="h-4 w-4" />
        }
      ]
    },
    {
      id: "filtering",
      title: t("filteringData"),
      icon: <Filter className="h-5 w-5" />,
      steps: [
        {
          title: t("filterByDate"),
          description: t("filterByDateDesc"),
          icon: <Clock className="h-4 w-4" />
        },
        {
          title: t("filterByProject"),
          description: t("filterByProjectDesc"),
          icon: <Package className="h-4 w-4" />
        },
        {
          title: t("filterByLocation"),
          description: t("filterByLocationDesc"),
          icon: <Map className="h-4 w-4" />
        },
        {
          title: t("combineFilters"),
          description: t("combineFiltersDesc"),
          icon: <Filter className="h-4 w-4" />
        }
      ]
    },
    {
      id: "analytics",
      title: t("analyticsAndReports"),
      icon: <TrendingUp className="h-5 w-5" />,
      steps: [
        {
          title: t("viewAnalytics"),
          description: t("viewAnalyticsDesc"),
          icon: <BarChart3 className="h-4 w-4" />
        },
        {
          title: t("exportData"),
          description: t("exportDataDesc"),
          icon: <Download className="h-4 w-4" />
        },
        {
          title: t("performanceMetrics"),
          description: t("performanceMetricsDesc"),
          icon: <TrendingUp className="h-4 w-4" />
        }
      ]
    },
    {
      id: "customization",
      title: t("customization"),
      icon: <Settings className="h-5 w-5" />,
      steps: [
        {
          title: t("changeLanguage"),
          description: t("changeLanguageDesc"),
          icon: <Globe className="h-4 w-4" />
        },
        {
          title: t("changeTheme"),
          description: t("changeThemeDesc"),
          icon: <Palette className="h-4 w-4" />
        },
        {
          title: t("panelSettings"),
          description: t("panelSettingsDesc"),
          icon: <Settings className="h-4 w-4" />
        }
      ]
    }
  ]

  const features = [
    {
      title: t("realTimeTracking"),
      description: t("realTimeTrackingDesc"),
      icon: <Map className="h-6 w-6" />
    },
    {
      title: t("comprehensiveAnalytics"),
      description: t("comprehensiveAnalyticsDesc"),
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: t("multiLanguageSupport"),
      description: t("multiLanguageSupportDesc"),
      icon: <Globe className="h-6 w-6" />
    },
    {
      title: t("exportCapabilities"),
      description: t("exportCapabilitiesDesc"),
      icon: <Download className="h-6 w-6" />
    }
  ]

  const keyboardShortcuts = [
    { keys: "Ctrl + F", action: t("openFilters") },
    { keys: "Ctrl + S", action: t("openSettings") },
    { keys: "Ctrl + H", action: t("openHelp") },
    { keys: "Ctrl + A", action: t("openAnalytics") },
    { keys: "Esc", action: t("closeModal") }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <HelpCircle className="h-4 w-4 mr-2" />
          {t("help")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <HelpCircle className="h-6 w-6" />
            {t("userGuide")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("overview")}
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {t("stepByStepGuide")}
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              {t("features")}
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("shortcuts")}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t("welcomeToExpeditorTracker")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {t("welcomeDescription")}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {t("quickStart")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">1</Badge>
                    <span>{t("selectExpeditorFromList")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">2</Badge>
                    <span>{t("viewDeliveryLocations")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">3</Badge>
                    <span>{t("checkPerformanceStats")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">4</Badge>
                    <span>{t("exportDataForReports")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step-by-Step Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            {helpSteps.map((section, sectionIndex) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3 p-4 border rounded-lg">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          {step.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{step.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {step.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    {t("mapFeatures")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("realTimeLocationTracking")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("deliveryStatusIndicators")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("routeVisualization")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("interactiveMarkers")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t("analyticsFeatures")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("performanceMetrics")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("trendAnalysis")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("paymentBreakdowns")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("comparativeReports")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {t("filteringFeatures")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("dateRangeFiltering")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("multiCriteriaFiltering")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("realTimeFiltering")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("filterPresets")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    {t("exportFeatures")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("csvExport")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("excelExport")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("pdfReports")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{t("customFormats")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Keyboard Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("keyboardShortcuts")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{shortcut.action}</span>
                      <Badge variant="outline" className="font-mono">
                        {shortcut.keys}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  {t("tipsAndTricks")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium">{t("tip1Title")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tip1Description")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium">{t("tip2Title")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tip2Description")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium">{t("tip3Title")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tip3Description")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
