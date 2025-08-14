'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Search, Globe, Server, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QueryResult {
  success: boolean
  data?: any
  error?: string
  type: 'rdap' | 'whois'
  errorCode?: number
}

interface RateLimitInfo {
  count: number
  resetTime: number
  isAdmin: boolean
}

export default function Home() {
  const [queryType, setQueryType] = useState<'rdap' | 'whois'>('rdap')
  const [objectType, setObjectType] = useState<string>('domain')
  const [queryInput, setQueryInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [requestCount, setRequestCount] = useState<number>(0)
  const [resetTime, setResetTime] = useState<number>(0)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<string>('')
  const [rdapError, setRdapError] = useState<{message: string, code?: number} | null>(null)
  const { toast } = useToast()

  // 倒计时效果
  useEffect(() => {
    if (resetTime === 0) return

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = Math.max(0, resetTime - now)
      
      if (remaining === 0) {
        setCountdown('')
        setRequestCount(0)
        return
      }

      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [resetTime])

  // RDAP错误自动消失
  useEffect(() => {
    if (rdapError) {
      const timer = setTimeout(() => {
        setRdapError(null)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [rdapError])

  const handleQuery = async () => {
    if (!queryInput.trim()) {
      toast({
        title: "输入错误",
        description: "请输入查询对象",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResult(null)
    setRdapError(null)

    try {
      // 构建查询URL，包含管理员密码参数
      const url = new URL('/api/domain-query', window.location.origin)
      const adminPassword = localStorage.getItem('adminPassword')
      if (adminPassword) {
        url.searchParams.set('password', adminPassword)
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: queryType,
          objectType: objectType,
          query: queryInput.trim()
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setResult({
          success: true,
          data: data.data,
          type: queryType
        })
        setRequestCount(data.requestCount || 0)
        setResetTime(data.resetTime || 0)
        setIsAdmin(data.isAdmin || false)
        toast({
          title: "查询成功",
          description: `成功获取${queryInput}的${queryType.toUpperCase()}信息`
        })
      } else {
        if (data.type === 'rdap' && data.errorCode) {
          // RDAP特定错误
          setRdapError({
            message: data.error,
            code: data.errorCode
          })
        }
        setResult({
          success: false,
          error: data.error || '查询失败',
          type: queryType,
          errorCode: data.errorCode
        })
        // 确保即使查询失败也更新倒计时信息
        setRequestCount(data.requestCount || 0)
        setResetTime(data.resetTime || 0)
        setIsAdmin(data.isAdmin || false)
        toast({
          title: "查询失败",
          description: data.error || '查询失败，请稍后重试',
          variant: "destructive"
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: '网络错误，请稍后重试',
        type: queryType
      })
      toast({
        title: "网络错误",
        description: "无法连接到服务器，请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatRDAPData = (data: any) => {
    if (!data) return null
    
    const formatted = []
    
    // 域名
    if (data.ldhName) {
      formatted.push({ key: '域名', value: data.ldhName })
    }
    
    // 状态
    if (data.status && data.status.length > 0) {
      formatted.push({ key: '状态', value: data.status.join(', ') })
    }
    
    // 句柄
    if (data.handle) {
      formatted.push({ key: '句柄', value: data.handle })
    }
    
    // WHOIS服务器
    if (data.port43) {
      formatted.push({ key: 'WHOIS服务器', value: data.port43 })
    }
    
    // 事件时间（注册时间、过期时间、更新时间）
    if (data.events && data.events.length > 0) {
      data.events.forEach((event: any) => {
        let eventName = ''
        switch (event.eventAction) {
          case 'registration':
            eventName = '注册时间'
            break
          case 'expiration':
            eventName = '过期日期'
            break
          case 'last changed':
          case 'last update':
            eventName = '更新时间'
            break
          default:
            eventName = `事件 (${event.eventAction})`
        }
        formatted.push({ 
          key: eventName, 
          value: new Date(event.eventDate).toLocaleString('zh-CN') 
        })
      })
    }
    
    // 注册商信息
    if (data.entities && data.entities.length > 0) {
      data.entities.forEach((entity: any, index: number) => {
        if (entity.roles && entity.roles.includes('registrar')) {
          if (entity.vcardArray && entity.vcardArray[1]) {
            const vcard = entity.vcardArray[1]
            const org = vcard.find((item: any) => item[0] === 'org')
            const email = vcard.find((item: any) => item[0] === 'email')
            
            if (org) {
              formatted.push({ key: '注册商', value: org[3] })
            }
            if (email) {
              formatted.push({ key: '注册商邮箱', value: email[3] })
            }
          }
          if (entity.handle) {
            formatted.push({ key: '注册商 ID', value: entity.handle })
          }
        }
        
        // 注册员信息
        if (entity.roles && entity.roles.includes('registrant')) {
          if (entity.vcardArray && entity.vcardArray[1]) {
            const vcard = entity.vcardArray[1]
            const org = vcard.find((item: any) => item[0] === 'org')
            const email = vcard.find((item: any) => item[0] === 'email')
            
            if (org) {
              formatted.push({ key: '登记员', value: org[3] })
            }
            if (email) {
              formatted.push({ key: '登记员邮箱', value: email[3] })
            }
          }
        }
      })
    }
    
    // 名称服务器
    if (data.nameservers && data.nameservers.length > 0) {
      formatted.push({ 
        key: '名称服务器', 
        value: data.nameservers.map((ns: any) => ns.ldhName).join(', ') 
      })
    }
    
    // DNSSEC
    if (data.secureDNS && data.secureDNS.delegationSigned) {
      formatted.push({ key: 'DNSSEC', value: data.secureDNS.delegationSigned ? '已启用' : '未启用' })
    }
    
    return formatted
  }

  const formatWHOISData = (data: any) => {
    if (!data) return null
    
    const formatted = []
    
    // 处理whoiscx.com的API响应格式
    // 根据文档，数据在data.info字段中
    const whoisData = data.data?.info || data.info || data
    
    // 域名
    if (whoisData.domain || whoisData.domain_name) {
      formatted.push({ 
        key: '域名', 
        value: whoisData.domain || whoisData.domain_name 
      })
    }
    
    // 注册商
    if (whoisData.registrar_name || whoisData.registrar) {
      formatted.push({ 
        key: '注册商', 
        value: whoisData.registrar_name || whoisData.registrar 
      })
    }
    
    // 注册商ID
    if (whoisData.registrar_id || whoisData.iana_id) {
      formatted.push({ 
        key: '注册商 ID', 
        value: whoisData.registrar_id || whoisData.iana_id 
      })
    }
    
    // 登记员
    if (whoisData.registrant_name || whoisData.registrant) {
      formatted.push({ 
        key: '登记员', 
        value: whoisData.registrant_name || whoisData.registrant 
      })
    }
    
    // 登记员邮箱
    if (whoisData.registrant_email) {
      formatted.push({ 
        key: '登记员邮箱', 
        value: whoisData.registrant_email 
      })
    }
    
    // 注册时间
    if (whoisData.creation_time || whoisData.creation_date || whoisData.created) {
      const date = whoisData.creation_time || whoisData.creation_date || whoisData.created
      formatted.push({ 
        key: '注册时间', 
        value: new Date(date).toLocaleString('zh-CN') 
      })
    }
    
    // 过期日期
    if (whoisData.expiration_time || whoisData.expiration_date || whoisData.expires) {
      const date = whoisData.expiration_time || whoisData.expiration_date || whoisData.expires
      formatted.push({ 
        key: '过期日期', 
        value: new Date(date).toLocaleString('zh-CN') 
      })
    }
    
    // 更新时间
    if (whoisData.updated_time || whoisData.updated_date || whoisData.changed) {
      const date = whoisData.updated_time || whoisData.updated_date || whoisData.changed
      formatted.push({ 
        key: '更新时间', 
        value: new Date(date).toLocaleString('zh-CN') 
      })
    }
    
    // 注册天数
    if (whoisData.creation_days) {
      formatted.push({ 
        key: '注册天数', 
        value: `${whoisData.creation_days} 天` 
      })
    }
    
    // 有效天数
    if (whoisData.valid_days) {
      formatted.push({ 
        key: '剩余天数', 
        value: `${whoisData.valid_days} 天` 
      })
    }
    
    // 是否过期
    if (typeof whoisData.is_expire === 'number') {
      formatted.push({ 
        key: '是否过期', 
        value: whoisData.is_expire === 1 ? '已过期' : '未过期' 
      })
    }
    
    // 名称服务器
    if (whoisData.name_server || whoisData.name_servers) {
      let nameservers = whoisData.name_server || whoisData.name_servers
      if (Array.isArray(nameservers)) {
        nameservers = nameservers.join(', ')
      }
      formatted.push({ key: '名称服务器', value: nameservers })
    }
    
    // 状态
    if (whoisData.domain_status || whoisData.status) {
      let status = whoisData.domain_status || whoisData.status
      if (Array.isArray(status)) {
        status = status.join(', ')
      }
      formatted.push({ key: '状态', value: status })
    }
    
    // WHOIS服务器
    if (whoisData.whois_server) {
      formatted.push({ key: 'WHOIS服务器', value: whoisData.whois_server })
    }
    
    // DNSSEC
    if (whoisData.dnssec) {
      formatted.push({ key: 'DNSSEC', value: whoisData.dnssec })
    }
    
    // 查询时间
    if (whoisData.query_time) {
      formatted.push({ 
        key: '查询时间', 
        value: new Date(whoisData.query_time).toLocaleString('zh-CN') 
      })
    }
    
    return formatted
  }

  const renderResult = () => {
    if (!result) return null
    
    if (!result.success) {
      return (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {result.error}
          </AlertDescription>
        </Alert>
      )
    }

    const formattedData = result.type === 'rdap' 
      ? formatRDAPData(result.data) 
      : formatWHOISData(result.data)

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            查询结果 - {result.type.toUpperCase()}
          </CardTitle>
          <CardDescription>
            {queryInput} 的详细信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formattedData && formattedData.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formattedData.map((item, index) => (
                <div key={index} className="flex justify-between items-start py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0">
                    {item.key}:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 break-all flex-1 ml-4 font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">没有找到相关信息</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderRdapError = () => {
    if (!rdapError) return null

    return (
      <Alert className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="space-y-2">
            <p className="font-medium">RDAP查询错误 (状态码: {rdapError.code})</p>
            <p>{rdapError.message}</p>
            <p className="text-xs opacity-75">
              此消息将在10秒后自动消失。更多RDAP错误信息请参考 about.rdap.org
            </p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  const handleAdminLogin = () => {
    const password = prompt('请输入管理员密码:')
    if (password) {
      localStorage.setItem('adminPassword', password)
      setIsAdmin(true)
      toast({
        title: "管理员模式",
        description: "已启用管理员模式，请求次数无限制"
      })
    }
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminPassword')
    setIsAdmin(false)
    toast({
      title: "退出管理员模式",
      description: "已退出管理员模式"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16 md:w-20 md:h-20">
                <img
                  src="/logo.svg"
                  alt="Z.ai Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              域名信息查询工具
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              支持RDAP和WHOIS两种查询方式，快速获取域名详细信息
            </p>
          </div>

          {/* Query Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                查询设置
              </CardTitle>
              <CardDescription>
                选择查询类型并输入要查询的域名、IP地址或其他对象
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={queryType} onValueChange={(value) => setQueryType(value as 'rdap' | 'whois')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="rdap" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    RDAP查询
                  </TabsTrigger>
                  <TabsTrigger value="whois" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    WHOIS查询
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="rdap" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="object-type">对象类型</Label>
                      <Select value={objectType} onValueChange={setObjectType}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择对象类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="domain">域名 (domain)</SelectItem>
                          <SelectItem value="ip">IP地址 (ip)</SelectItem>
                          <SelectItem value="autnum">自治系统号 (autnum)</SelectItem>
                          <SelectItem value="entity">实体 (entity)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="query-input">查询对象</Label>
                      <Input
                        id="query-input"
                        placeholder={objectType === 'domain' ? 'example.com' : 
                                  objectType === 'ip' ? '192.168.1.1' :
                                  objectType === 'autnum' ? '64496' : 'entity-handle'}
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                      />
                      <p className="text-xs text-gray-500">
                        示例: {objectType === 'domain' ? 'google.com, baidu.com' : 
                               objectType === 'ip' ? '8.8.8.8, 1.1.1.1' :
                               objectType === 'autnum' ? '15169, 16509' : 'EXAMPLE-ENTITY'}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="whois" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whois-query">域名或IP地址</Label>
                    <Input
                      id="whois-query"
                      placeholder="example.com 或 192.168.1.1"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                    />
                    <p className="text-xs text-gray-500">
                      示例: google.com, baidu.com, 8.8.8.8, 1.1.1.1
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      管理员模式 - 无限制
                    </Badge>
                  ) : (
                    <>
                      <Badge variant="outline">
                        请求限制: {requestCount}/12 (每分钟)
                      </Badge>
                      {countdown && (
                        <Badge variant="secondary">
                          重置倒计时: {countdown}
                        </Badge>
                      )}
                      {requestCount >= 10 && (
                        <Badge variant="destructive">
                          接近限制
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {isAdmin ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAdminLogout}
                    >
                      退出管理员
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAdminLogin}
                    >
                      管理员登录
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setQueryInput('google.com')
                      setQueryType('rdap')
                      setObjectType('domain')
                    }}
                  >
                    示例域名
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setQueryInput('8.8.8.8')
                      setQueryType('rdap')
                      setObjectType('ip')
                    }}
                  >
                    示例IP
                  </Button>
                  <Button 
                    onClick={handleQuery} 
                    disabled={loading || (!isAdmin && requestCount >= 12)}
                    className="min-w-32"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        查询中...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        开始查询
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Display */}
          {renderRdapError()}
          {renderResult()}

          {/* Info Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    RDAP查询
                  </h4>
                  <p className="text-sm text-gray-600">
                    RDAP (Registration Data Access Protocol) 是新一代的注册数据访问协议，
                    提供结构化的域名注册信息查询。支持域名、IP地址、自治系统号等多种对象类型。
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    WHOIS查询
                  </h4>
                  <p className="text-sm text-gray-600">
                    WHOIS是传统的域名信息查询协议，提供域名的注册商、注册日期、到期日期等详细信息。
                    查询结果为文本格式，信息较为全面。
                  </p>
                </div>
              </div>
              {/* RDAP和WHOIS区别说明 */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">
                  RDAP 和 WHOIS 有什么区别？
                </h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>
                    RDAP 是 WHOIS 的 JSON 格式替代品。自 2025 年 1 月 28 日起，ICANN 正式取消了 WHOIS 要求，
                    使 RDAP 成为 gTLD 注册数据访问的权威协议。
                  </p>
                  <p>
                    但是，国家/地区代码顶级域 （ccTLD） 不受 ICANN 管辖，并且具有不同的 RDAP 采用率。
                    虽然一些 ccTLD 已开始支持 RDAP，但许多 ccTLD 仍然依赖 WHOIS。
                  </p>
                  <a 
                    href="https://www.icann.org/en/announcements/details/icann-update-launching-rdap-sunsetting-whois-27-01-2025-en" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    了解更多：ICANN 官方公告
                  </a>
                </div>
              </div>
              {/* 隐私和条款说明 */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  隐私和条款
                </h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>
                    此工具收集您的 IP 地址仅用于防止滥用，但不会存储、共享或出售它。
                    此工具可免费使用，但请将您的请求限制为每分钟12次，并且不要使用自动请求。
                  </p>
                  <p>
                    过多的请求可能会导致 429 错误或被丢弃。使用此工具，即表示您同意这些条款。
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {isAdmin ? (
                    <span className="text-green-600 font-medium">
                      管理员模式已启用 - 无请求次数限制
                    </span>
                  ) : (
                    <span>
                      注意：为防止滥用，系统限制每IP地址每分钟最多12次查询请求。
                      请合理使用，避免频繁查询。
                    </span>
                  )}
                </p>
                {isAdmin && (
                  <p className="text-sm text-gray-500 mt-2">
                    管理员密码通过环境变量 ADMIN_PASSWORD 配置
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}