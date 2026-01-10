"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { 
  Key, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Ban, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Home,
  ArrowLeft,
  RefreshCw,
  User,
  LogOut,
  MessageSquare
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"

interface YandexToken {
  id: number
  name: string
  keyword: string
  api_key: string
  api_key_preview: string
  status: 'active' | 'inactive' | 'blocked'
  description: string
  created_at: string
  updated_at: string
}

interface SmsConfig {
  id: number
  name: string
  provider: 'eskiz' | 'sms_uz' | 'custom'
  api_key: string
  api_key_preview: string
  api_secret?: string
  sender: string
  api_url?: string
  status: 'active' | 'inactive'
  description: string
  created_at: string
  updated_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://178.218.200.120:7896/api"

export default function YandexTokenManagement() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [tokens, setTokens] = useState<YandexToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingToken, setEditingToken] = useState<YandexToken | null>(null)
  const [showApiKey, setShowApiKey] = useState<number | null>(null)
  
  // SMS Config states
  const [smsConfigs, setSmsConfigs] = useState<SmsConfig[]>([])
  const [showSmsAddDialog, setShowSmsAddDialog] = useState(false)
  const [showSmsEditDialog, setShowSmsEditDialog] = useState(false)
  const [editingSmsConfig, setEditingSmsConfig] = useState<SmsConfig | null>(null)
  const [showSmsApiKey, setShowSmsApiKey] = useState<number | null>(null)
  const [smsFormData, setSmsFormData] = useState({
    name: '',
    provider: 'eskiz' as 'eskiz' | 'sms_uz' | 'custom',
    api_key: '',
    api_secret: '',
    sender: '',
    api_url: '',
    description: ''
  })

  // Permission check - only superuser can access
  useEffect(() => {
    if (user && !user.is_superuser) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    keyword: 'YANDEX_MAPS_API_KEY',
    api_key: '',
    description: ''
  })

  useEffect(() => {
    loadTokens()
    loadSmsConfigs()
  }, [])

  const loadTokens = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/yandex-tokens/`)
      if (response.ok) {
        const data = await response.json()
        setTokens(data.results || data)
      } else {
        console.error('Failed to load tokens:', response.statusText)
        toast({
          title: "Error",
          description: "Failed to load tokens",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to load tokens:', error)
      toast({
        title: "Error",
        description: "Failed to load tokens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingToken 
        ? `${API_BASE_URL}/yandex-tokens/${editingToken.id}/`
        : `${API_BASE_URL}/yandex-tokens/`
      
      const method = editingToken ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Token ${editingToken ? 'updated' : 'created'} successfully`,
          variant: "success",
        })
        loadTokens()
        resetForm()
        setShowAddDialog(false)
        setShowEditDialog(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || `Failed to ${editingToken ? 'update' : 'create'} token`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingToken ? 'update' : 'create'} token`,
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (tokenId: number, action: 'activate' | 'deactivate' | 'block') => {
    try {
      const response = await fetch(`${API_BASE_URL}/yandex-tokens/${tokenId}/${action}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
          variant: "success",
        })
        loadTokens()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || `Failed to ${action} token`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} token`,
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (tokenId: number) => {
    const token = tokens.find(t => t.id === tokenId)
    const tokenName = token?.name || 'this token'
    
    if (!confirm(`Are you sure you want to delete "${tokenName}"?\n\nThis action cannot be undone and will permanently remove the token from the system.`)) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/yandex-tokens/${tokenId}/`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Token "${tokenName}" deleted successfully`,
          variant: "success",
        })
        loadTokens()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete token",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete token",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      keyword: 'YANDEX_MAPS_API_KEY',
      api_key: '',
      description: ''
    })
    setEditingToken(null)
  }

  const openEditDialog = (token: YandexToken) => {
    setEditingToken(token)
    setFormData({
      name: token.name,
      keyword: token.keyword,
      api_key: token.api_key,
      description: token.description
    })
    setShowEditDialog(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'blocked':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'blocked':
        return <Ban className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // SMS Config functions
  const loadSmsConfigs = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/sms-configs/`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSmsConfigs(data.results || data)
      } else {
        console.error('Failed to load SMS configs:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to load SMS configs:', error)
    }
  }

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const url = editingSmsConfig 
        ? `${API_BASE_URL}/sms-configs/${editingSmsConfig.id}/`
        : `${API_BASE_URL}/sms-configs/`
      
      const method = editingSmsConfig ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(smsFormData),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `SMS Config ${editingSmsConfig ? 'updated' : 'created'} successfully`,
          variant: "success",
        })
        loadSmsConfigs()
        resetSmsForm()
        setShowSmsAddDialog(false)
        setShowSmsEditDialog(false)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || `Failed to ${editingSmsConfig ? 'update' : 'create'} SMS config`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingSmsConfig ? 'update' : 'create'} SMS config`,
        variant: "destructive",
      })
    }
  }

  const handleSmsStatusChange = async (configId: number, action: 'activate' | 'deactivate') => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/sms-configs/${configId}/${action}/`, {
        method: 'POST',
        headers,
      })
      
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message,
          variant: "success",
        })
        loadSmsConfigs()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || `Failed to ${action} SMS config`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} SMS config`,
        variant: "destructive",
      })
    }
  }

  const handleSmsDelete = async (configId: number) => {
    const config = smsConfigs.find(c => c.id === configId)
    const configName = config?.name || 'this SMS config'
    
    if (!confirm(`Are you sure you want to delete "${configName}"?`)) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers.Authorization = `Token ${token}`
      }
      
      const response = await fetch(`${API_BASE_URL}/sms-configs/${configId}/`, {
        method: 'DELETE',
        headers,
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `SMS Config "${configName}" deleted successfully`,
          variant: "success",
        })
        loadSmsConfigs()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete SMS config",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete SMS config",
        variant: "destructive",
      })
    }
  }

  const resetSmsForm = () => {
    setSmsFormData({
      name: '',
      provider: 'eskiz',
      api_key: '',
      api_secret: '',
      sender: '',
      api_url: '',
      description: ''
    })
    setEditingSmsConfig(null)
  }

  const openSmsEditDialog = (config: SmsConfig) => {
    setEditingSmsConfig(config)
    setSmsFormData({
      name: config.name,
      provider: config.provider,
      api_key: config.api_key,
      api_secret: config.api_secret || '',
      sender: config.sender || '',
      api_url: config.api_url || '',
      description: config.description || ''
    })
    setShowSmsEditDialog(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Key className="h-8 w-8 text-blue-600" />
            Settings Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage Yandex Maps API tokens and SMS configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user.first_name} {user.last_name}
              </span>
            </div>
          )}
          
          <Button onClick={loadTokens} variant="outline" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/">
            <Button variant="outline" title="Home">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs for Yandex Tokens and SMS Config */}
      <Tabs defaultValue="yandex" className="w-full">
        <TabsList>
          <TabsTrigger value="yandex" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Yandex Tokens
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yandex" className="space-y-6">
          {/* Add Token Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add New Token
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Yandex Token</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Token Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter token name"
                required
              />
            </div>
            <div>
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="YANDEX_MAPS_API_KEY"
                required
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Enter Yandex Maps API key"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter token description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Token</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Token Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Token</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Token Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter token name"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_keyword">Keyword</Label>
              <Input
                id="edit_keyword"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="YANDEX_MAPS_API_KEY"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="edit_api_key"
                  type={showApiKey === editingToken?.id ? "text" : "password"}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Enter Yandex Maps API key"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(showApiKey === editingToken?.id ? null : editingToken?.id || null)}
                >
                  {showApiKey === editingToken?.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter token description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Token</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tokens List */}
      <div className="grid gap-4">
        {tokens.map((token) => (
          <Card key={token.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(token.status)}
                    <h3 className="text-lg font-semibold">{token.name}</h3>
                    <Badge variant={getStatusBadgeVariant(token.status)}>
                      {token.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    <div>Keyword: {token.keyword}</div>
                    <div className="flex items-center gap-2">
                      API Key: {token.api_key_preview}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowApiKey(showApiKey === token.id ? null : token.id)}
                        title={showApiKey === token.id ? "Hide API Key" : "Show API Key"}
                      >
                        {showApiKey === token.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {showApiKey === token.id && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                        {token.api_key}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {token.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(token.id, 'deactivate')}
                      title="Deactivate"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  ) : token.status === 'inactive' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(token.id, 'activate')}
                      title="Activate"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(token.id, 'activate')}
                      title="Activate"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {token.status !== 'blocked' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(token.id, 'block')}
                      title="Block"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(token)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(token.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {token.description && (
                <p className="text-sm text-gray-600 mt-2">{token.description}</p>
              )}
              
              <div className="text-xs text-gray-400 mt-2">
                Created: {formatDateTime(token.created_at)} | 
                Updated: {formatDateTime(token.updated_at)}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {tokens.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No tokens found</h3>
              <p className="text-gray-500 mb-4">Add your first Yandex Maps API token to get started.</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Token
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          {/* Add SMS Config Dialog */}
          <Dialog open={showSmsAddDialog} onOpenChange={setShowSmsAddDialog}>
            <DialogTrigger asChild>
              <Button className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New SMS Config
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New SMS Config</DialogTitle>
                <DialogDescription>
                  Configure SMS provider settings for sending notifications
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSmsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="sms_name">Config Name</Label>
                  <Input
                    id="sms_name"
                    value={smsFormData.name}
                    onChange={(e) => setSmsFormData({ ...smsFormData, name: e.target.value })}
                    placeholder="Enter config name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sms_provider">Provider</Label>
                  <Select
                    value={smsFormData.provider}
                    onValueChange={(value) => setSmsFormData({ ...smsFormData, provider: value as 'eskiz' | 'sms_uz' | 'custom' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eskiz">Eskiz.uz</SelectItem>
                      <SelectItem value="sms_uz">SMS.uz</SelectItem>
                      <SelectItem value="custom">Custom Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sms_api_key">API Key</Label>
                  <Input
                    id="sms_api_key"
                    type="password"
                    value={smsFormData.api_key}
                    onChange={(e) => setSmsFormData({ ...smsFormData, api_key: e.target.value })}
                    placeholder="Enter API key"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sms_api_secret">API Secret</Label>
                  <Input
                    id="sms_api_secret"
                    type="password"
                    value={smsFormData.api_secret}
                    onChange={(e) => setSmsFormData({ ...smsFormData, api_secret: e.target.value })}
                    placeholder="Enter API secret"
                  />
                </div>
                <div>
                  <Label htmlFor="sms_sender">Sender</Label>
                  <Input
                    id="sms_sender"
                    value={smsFormData.sender}
                    onChange={(e) => setSmsFormData({ ...smsFormData, sender: e.target.value })}
                    placeholder="Sender name or number"
                  />
                </div>
                {smsFormData.provider === 'custom' && (
                  <div>
                    <Label htmlFor="sms_api_url">API URL</Label>
                    <Input
                      id="sms_api_url"
                      type="url"
                      value={smsFormData.api_url}
                      onChange={(e) => setSmsFormData({ ...smsFormData, api_url: e.target.value })}
                      placeholder="https://api.example.com"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="sms_description">Description</Label>
                  <Textarea
                    id="sms_description"
                    value={smsFormData.description}
                    onChange={(e) => setSmsFormData({ ...smsFormData, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowSmsAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Config</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit SMS Config Dialog */}
          <Dialog open={showSmsEditDialog} onOpenChange={setShowSmsEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit SMS Config</DialogTitle>
                <DialogDescription>
                  Update SMS provider configuration
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSmsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit_sms_name">Config Name</Label>
                  <Input
                    id="edit_sms_name"
                    value={smsFormData.name}
                    onChange={(e) => setSmsFormData({ ...smsFormData, name: e.target.value })}
                    placeholder="Enter config name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_sms_provider">Provider</Label>
                  <Select
                    value={smsFormData.provider}
                    onValueChange={(value) => setSmsFormData({ ...smsFormData, provider: value as 'eskiz' | 'sms_uz' | 'custom' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eskiz">Eskiz.uz</SelectItem>
                      <SelectItem value="sms_uz">SMS.uz</SelectItem>
                      <SelectItem value="custom">Custom Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_sms_api_key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="edit_sms_api_key"
                      type={showSmsApiKey === editingSmsConfig?.id ? "text" : "password"}
                      value={smsFormData.api_key}
                      onChange={(e) => setSmsFormData({ ...smsFormData, api_key: e.target.value })}
                      placeholder="Enter API key"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSmsApiKey(showSmsApiKey === editingSmsConfig?.id ? null : editingSmsConfig?.id || null)}
                    >
                      {showSmsApiKey === editingSmsConfig?.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_sms_api_secret">API Secret</Label>
                  <Input
                    id="edit_sms_api_secret"
                    type="password"
                    value={smsFormData.api_secret}
                    onChange={(e) => setSmsFormData({ ...smsFormData, api_secret: e.target.value })}
                    placeholder="Enter API secret"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_sms_sender">Sender</Label>
                  <Input
                    id="edit_sms_sender"
                    value={smsFormData.sender}
                    onChange={(e) => setSmsFormData({ ...smsFormData, sender: e.target.value })}
                    placeholder="Sender name or number"
                  />
                </div>
                {smsFormData.provider === 'custom' && (
                  <div>
                    <Label htmlFor="edit_sms_api_url">API URL</Label>
                    <Input
                      id="edit_sms_api_url"
                      type="url"
                      value={smsFormData.api_url}
                      onChange={(e) => setSmsFormData({ ...smsFormData, api_url: e.target.value })}
                      placeholder="https://api.example.com"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit_sms_description">Description</Label>
                  <Textarea
                    id="edit_sms_description"
                    value={smsFormData.description}
                    onChange={(e) => setSmsFormData({ ...smsFormData, description: e.target.value })}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowSmsEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Config</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* SMS Configs List */}
          <div className="grid gap-4">
            {smsConfigs.map((config) => (
              <Card key={config.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(config.status === 'active' ? 'active' : 'inactive')}
                        <h3 className="text-lg font-semibold">{config.name}</h3>
                        <Badge variant={getStatusBadgeVariant(config.status === 'active' ? 'active' : 'inactive')}>
                          {config.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>Provider: {config.provider}</div>
                        <div className="flex items-center gap-2">
                          API Key: {config.api_key_preview}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSmsApiKey(showSmsApiKey === config.id ? null : config.id)}
                            title={showSmsApiKey === config.id ? "Hide API Key" : "Show API Key"}
                          >
                            {showSmsApiKey === config.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {showSmsApiKey === config.id && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                            {config.api_key}
                          </div>
                        )}
                        {config.sender && <div>Sender: {config.sender}</div>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {config.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSmsStatusChange(config.id, 'deactivate')}
                          title="Deactivate"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSmsStatusChange(config.id, 'activate')}
                          title="Activate"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSmsEditDialog(config)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSmsDelete(config.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {config.description && (
                    <p className="text-sm text-gray-600 mt-2">{config.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-2">
                    Created: {formatDateTime(config.created_at)} | 
                    Updated: {formatDateTime(config.updated_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {smsConfigs.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No SMS configs found</h3>
                  <p className="text-gray-500 mb-4">Add your first SMS configuration to get started.</p>
                  <Button onClick={() => setShowSmsAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add SMS Config
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </AuthGuard>
  )
}
