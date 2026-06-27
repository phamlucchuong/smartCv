import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@smart-cv/ui'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Brain,
  Key,
  Plus,
  Coins,
  Activity,
  CreditCard,
  Cpu,
  Trash2,
  TrendingUp,
  Globe,
  Settings,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

export const Route = createFileRoute('/admin/ai-config')({ component: AIConfigPage })

interface AIModel {
  id: string
  name: string
  provider: string
  apiKey?: string
  oauthToken?: string
  endpoint?: string
  deploymentName?: string
  apiVersion?: string
}

const initialModels: AIModel[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', apiKey: 'sk-proj-••••••••••••••••3aB8', provider: 'OpenAI' },
  {
    id: 'azure-gpt-4',
    name: 'Azure GPT-4',
    apiKey: '••••••••••••••••9zKs',
    provider: 'Azure OpenAI',
    endpoint: 'https://smartcv-openai.azure.com/',
    deploymentName: 'gpt-4-deployment',
    apiVersion: '2024-02-15-preview',
  },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', apiKey: 'AIzaSy••••••••••••••••Lq2p', provider: 'Gemini' },
  { id: 'llama-3-local', name: 'Llama 3 Local', apiKey: 'local-no-key', provider: 'Llama 3', endpoint: 'http://localhost:11434/v1' },
  { id: 'claude-agent-sdk', name: 'Claude Agent SDK', oauthToken: 'oauth-token-••••••••••••••••x92a', provider: 'Claude Agent SDK' },
]

// Mock data sets for different time ranges
const mockUsageData = {
  day: [
    { date: '08:00', promptTokens: 12000, completionTokens: 4000, cost: 0.18 },
    { date: '10:00', promptTokens: 25000, completionTokens: 9000, cost: 0.38 },
    { date: '12:00', promptTokens: 45000, completionTokens: 15000, cost: 0.68 },
    { date: '14:00', promptTokens: 38000, completionTokens: 12000, cost: 0.56 },
    { date: '16:00', promptTokens: 60000, completionTokens: 22000, cost: 0.92 },
    { date: '18:00', promptTokens: 30000, completionTokens: 11000, cost: 0.46 },
    { date: '20:00', promptTokens: 15000, completionTokens: 5000, cost: 0.22 },
  ],
  week: [
    { date: '13/06', promptTokens: 142000, completionTokens: 48000, cost: 2.15 },
    { date: '14/06', promptTokens: 185000, completionTokens: 62000, cost: 2.80 },
    { date: '15/06', promptTokens: 210000, completionTokens: 78000, cost: 3.25 },
    { date: '16/06', promptTokens: 165000, completionTokens: 55000, cost: 2.48 },
    { date: '17/06', promptTokens: 295000, completionTokens: 110000, cost: 4.60 },
    { date: '18/06', promptTokens: 320000, completionTokens: 125000, cost: 5.02 },
    { date: '19/06', promptTokens: 280000, completionTokens: 98000, cost: 4.22 },
  ],
  month: [
    { date: 'Tuần 1', promptTokens: 850000, completionTokens: 290000, cost: 12.80 },
    { date: 'Tuần 2', promptTokens: 920000, completionTokens: 310000, cost: 13.90 },
    { date: 'Tuần 3', promptTokens: 1050000, completionTokens: 380000, cost: 16.20 },
    { date: 'Tuần 4', promptTokens: 1200000, completionTokens: 420000, cost: 18.15 },
  ],
  year: [
    { date: 'T1', promptTokens: 3200000, completionTokens: 1100000, cost: 48.20 },
    { date: 'T2', promptTokens: 3500000, completionTokens: 1250000, cost: 53.50 },
    { date: 'T3', promptTokens: 4100000, completionTokens: 1480000, cost: 62.70 },
    { date: 'T4', promptTokens: 3900000, completionTokens: 1390000, cost: 59.80 },
    { date: 'T5', promptTokens: 4500000, completionTokens: 1600000, cost: 68.90 },
    { date: 'T6', promptTokens: 4800000, completionTokens: 1750000, cost: 73.60 },
  ],
}

type TimeRange = 'day' | 'week' | 'month' | 'year'

function AIConfigPage() {
  const [models, setModels] = useState<AIModel[]>(initialModels)
  const [selectedModelId, setSelectedModelId] = useState<string>('gpt-4o-mini')
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  
  // Form state for new model
  const [newModelName, setNewModelName] = useState('')
  const [newModelProvider, setNewModelProvider] = useState('OpenAI')
  const [apiKey, setApiKey] = useState('')
  const [oauthToken, setOauthToken] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [deploymentName, setDeploymentName] = useState('')
  const [apiVersion, setApiVersion] = useState('')

  const handleProviderChange = (provider: string) => {
    setNewModelProvider(provider)
    // Reset specific credential fields to avoid mixups
    setApiKey('')
    setOauthToken('')
    setEndpoint('')
    setDeploymentName('')
    setApiVersion('')
  }

  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newModelName.trim()) {
      toast.error('Vui lòng nhập tên model')
      return
    }

    // Validate fields based on Provider
    if (newModelProvider === 'Claude Agent SDK') {
      if (!oauthToken.trim()) {
        toast.error('Vui lòng cung cấp OAuth Token')
        return
      }
    } else {
      // OpenAI, Azure, Gemini, Llama 3 require API Key (Llama 3 API Key can be empty if self-hosted but let's check)
      if (newModelProvider !== 'Llama 3' && !apiKey.trim()) {
        toast.error('Vui lòng cung cấp API Key')
        return
      }
    }

    if (newModelProvider === 'Azure OpenAI') {
      if (!endpoint.trim()) {
        toast.error('Vui lòng cung cấp Endpoint')
        return
      }
      if (!deploymentName.trim()) {
        toast.error('Vui lòng cung cấp Deployment Name')
        return
      }
      if (!apiVersion.trim()) {
        toast.error('Vui lòng cung cấp API Version')
        return
      }
    }

    const newId = newModelName.toLowerCase().replace(/\s+/g, '-')
    if (models.some((m) => m.id === newId)) {
      toast.error('Model với mã/tên này đã tồn tại')
      return
    }

    const newModel: AIModel = {
      id: newId,
      name: newModelName,
      provider: newModelProvider,
      ...(newModelProvider === 'Claude Agent SDK' ? { oauthToken } : { apiKey }),
      ...(endpoint ? { endpoint } : {}),
      ...(deploymentName ? { deploymentName } : {}),
      ...(apiVersion ? { apiVersion } : {}),
    }

    setModels([...models, newModel])
    setSelectedModelId(newId)
    
    // Clear inputs
    setNewModelName('')
    setApiKey('')
    setOauthToken('')
    setEndpoint('')
    setDeploymentName('')
    setApiVersion('')
    toast.success('Thêm model mới thành công!')
  }

  const handleDeleteModel = (id: string) => {
    if (models.length <= 1) {
      toast.error('Phải giữ lại ít nhất một model hoạt động')
      return
    }
    if (!confirm('Bạn có chắc chắn muốn xóa model này không?')) return

    const updated = models.filter((m) => m.id !== id)
    setModels(updated)
    if (selectedModelId === id) {
      setSelectedModelId(updated[0].id)
    }
    toast.success('Xóa model thành công')
  }

  const activeModel = models.find((m) => m.id === selectedModelId) || models[0]

  // Get active dataset based on selected time range
  const currentChartData = useMemo(() => {
    return mockUsageData[timeRange]
  }, [timeRange])

  // Calculate summary stats dynamically from active dataset
  const totalPromptTokens = useMemo(() => currentChartData.reduce((sum, item) => sum + item.promptTokens, 0), [currentChartData])
  const totalCompletionTokens = useMemo(() => currentChartData.reduce((sum, item) => sum + item.completionTokens, 0), [currentChartData])
  const totalTokens = totalPromptTokens + totalCompletionTokens
  const totalCost = useMemo(() => currentChartData.reduce((sum, item) => sum + item.cost, 0), [currentChartData])

  return (
    <div className="space-y-6 w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="size-6 text-primary" /> Cấu hình AI
        </h1>
        <p className="text-sm text-muted-foreground">Quản lý tích hợp đa nhà cung cấp AI và thống kê sử dụng tài nguyên API</p>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Add Model Form */}
        <div className="card-surface p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus className="size-5 text-primary" /> Thêm mới Model
          </h2>
          <form onSubmit={handleAddModel} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tên Model <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="gpt-4o, llama-3, gemini..."
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nhà cung cấp <span className="text-danger">*</span></label>
                <select
                  value={newModelProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background font-medium"
                >
                  <option value="OpenAI">OpenAI</option>
                  <option value="Azure OpenAI">Azure OpenAI</option>
                  <option value="Gemini">Google Gemini</option>
                  <option value="Llama 3">Llama 3 (Self-hosted/API)</option>
                  <option value="Claude Agent SDK">Claude Agent SDK (OAuth)</option>
                </select>
              </div>
            </div>

            {/* Conditional input fields based on provider */}
            {newModelProvider === 'Claude Agent SDK' ? (
              <div>
                <label className="text-sm font-medium flex items-center gap-1.5">
                  OAuth Token <span className="text-danger">*</span>
                  <span className="text-xs text-muted-foreground">(Từ Claude Plan)</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Nhập Claude OAuth Token..."
                    value={oauthToken}
                    onChange={(e) => setOauthToken(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-input pl-10 pr-3 text-sm bg-background"
                    required
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">
                  API Key {newModelProvider !== 'Llama 3' && <span className="text-danger">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={newModelProvider === 'Llama 3' ? 'API Key (Không bắt buộc với Ollama/v1)...' : 'Nhập API Key...'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-input pl-10 pr-3 text-sm bg-background"
                    required={newModelProvider !== 'Llama 3'}
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Azure Specific Fields */}
            {newModelProvider === 'Azure OpenAI' && (
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                  <Settings className="size-3.5" /> Azure OpenAI Settings
                </div>
                <div>
                  <label className="text-sm font-medium">Endpoint <span className="text-danger">*</span></label>
                  <input
                    type="url"
                    placeholder="https://your-resource.openai.azure.com/"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Deployment Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      placeholder="gpt-4-deploy"
                      value={deploymentName}
                      onChange={(e) => setDeploymentName(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">API Version <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      placeholder="2024-02-15-preview"
                      value={apiVersion}
                      onChange={(e) => setApiVersion(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Llama 3 Specific Fields (API Base URL / Endpoint) */}
            {newModelProvider === 'Llama 3' && (
              <div>
                <label className="text-sm font-medium">
                  Base URL / Endpoint <span className="text-xs text-muted-foreground">(Không bắt buộc, mặc định: http://localhost:11434/v1)</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="http://localhost:11434/v1"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-md border border-input pl-10 pr-3 text-sm bg-background"
                  />
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full">
              Thêm Model
            </Button>
          </form>
        </div>

        {/* Model Selection and Active Settings */}
        <div className="card-surface p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu className="size-5 text-primary" /> Model đang hoạt động
              </span>
              {activeModel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger hover:bg-danger/10"
                  onClick={() => handleDeleteModel(activeModel.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </h2>

            <div>
              <label className="text-sm font-medium">Chọn Model từ danh sách đã tạo</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-input px-3 text-sm bg-background font-semibold"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))}
              </select>
            </div>

            {activeModel && (
              <div className="rounded-lg bg-muted/40 p-4 space-y-3 text-sm border border-border">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Tên Model:</span>
                  <span className="font-semibold">{activeModel.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">Nhà cung cấp:</span>
                  <span className="font-semibold">{activeModel.provider}</span>
                </div>

                {activeModel.oauthToken ? (
                  <div className="flex justify-between items-center border-b border-border/60 pb-2">
                    <span className="text-muted-foreground">OAuth Token:</span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                      {activeModel.oauthToken.slice(0, 15)}••••••••
                    </span>
                  </div>
                ) : (
                  activeModel.apiKey && (
                    <div className="flex justify-between items-center border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">API Key:</span>
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded border border-border">
                        {activeModel.apiKey.slice(0, 12)}••••••••
                      </span>
                    </div>
                  )
                )}

                {/* Azure Display details */}
                {activeModel.provider === 'Azure OpenAI' && (
                  <>
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Endpoint:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]" title={activeModel.endpoint}>
                        {activeModel.endpoint}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/60 pb-2">
                      <span className="text-muted-foreground">Deployment:</span>
                      <span className="font-semibold">{activeModel.deploymentName}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">API Version:</span>
                      <span className="font-semibold">{activeModel.apiVersion}</span>
                    </div>
                  </>
                )}

                {/* Llama 3 display details */}
                {activeModel.provider === 'Llama 3' && activeModel.endpoint && (
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Base URL:</span>
                    <span className="font-mono text-xs">{activeModel.endpoint}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => toast.success(`Đã lưu cấu hình sử dụng model: ${activeModel?.name}`)}
            >
              Lưu cấu hình hoạt động
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Tokens and Cost Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Activity className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng Token Đã Dùng</p>
            <h3 className="text-2xl font-bold mt-1">{totalTokens.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prompt: {totalPromptTokens.toLocaleString()} • Completion: {totalCompletionTokens.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="card-surface p-5 flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <CreditCard className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng chi phí</p>
            <h3 className="text-2xl font-bold mt-1 text-success">${totalCost.toFixed(2)} USD</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ước lượng theo thời gian đã chọn</p>
          </div>
        </div>

        <div className="card-surface p-5 flex items-center gap-4">
          <div className="p-3 bg-warning/10 rounded-lg text-warning">
            <Coins className="size-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Chi phí trung bình</p>
            <h3 className="text-2xl font-bold mt-1">${(totalCost / currentChartData.length).toFixed(2)} / kỳ</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Tính toán theo khoảng thời gian lọc</p>
          </div>
        </div>
      </div>

      {/* Token Usage Chart with Select Filters */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" /> Biểu đồ mức sử dụng Token
            </h2>
            <p className="text-xs text-muted-foreground">Theo dõi lượng prompt và completion token tiêu thụ</p>
          </div>
          
          {/* Time range selection controls */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border self-start sm:self-auto">
            <button
              onClick={() => setTimeRange('day')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'day'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === 'year'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Năm
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="promptColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completionColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Area
                name="Prompt Tokens"
                type="monotone"
                dataKey="promptTokens"
                stroke="#4f46e5"
                fillOpacity={1}
                fill="url(#promptColor)"
              />
              <Area
                name="Completion Tokens"
                type="monotone"
                dataKey="completionTokens"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#completionColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
