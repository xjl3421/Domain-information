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
import { Loader2, Search, Globe, Server, AlertCircle, CheckCircle, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'

interface QueryResult {
  success: boolean
  data?: any
  error?: string
  type: 'rdap' | 'whois'
  errorCode?: number
  isDomainNotSupported?: boolean
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
  const [showAuth, setShowAuth] = useState<boolean>(false)
  const [authPassword, setAuthPassword] = useState<string>('')
  const [authMode, setAuthMode] = useState<'admin' | 'personal'>('admin')
  const [includePrice, setIncludePrice] = useState<boolean>(false)
  const [priceInfo, setPriceInfo] = useState<any>(null)
  const [priceLoading, setPriceLoading] = useState<boolean>(false)
  const [priceSortBy, setPriceSortBy] = useState<'registration' | 'renewal' | 'transfer'>('registration')
  const [rdapDomains, setRdapDomains] = useState<any>(null)
  const [rdapDomainsLoading, setRdapDomainsLoading] = useState<boolean>(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // 主题切换函数
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
    toast({
      title: "主题切换",
      description: `已切换到${theme === 'light' ? '深色' : '浅色'}模式`
    })
  }

  // 获取RDAP支持的域名列表
  const fetchRDAPDomains = async () => {
    setRdapDomainsLoading(true)
    try {
      const url = new URL('/api/rdap-domains', window.location.origin)
      const authPassword = localStorage.getItem('authPassword')
      if (authPassword) {
        url.searchParams.set('password', authPassword)
      }

      const response = await fetch(url.toString())
      const data = await response.json()

      if (response.ok && data.success) {
        setRdapDomains(data.data)
        toast({
          title: "RDAP域名列表",
          description: `成功获取${data.data.total}个支持的域名后缀`
        })
      } else {
        console.error('RDAP域名列表获取失败:', data.error)
        toast({
          title: "获取失败",
          description: "无法获取RDAP支持的域名列表",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('RDAP域名列表获取错误:', error)
      toast({
        title: "网络错误",
        description: "无法连接到服务器",
        variant: "destructive"
      })
    } finally {
      setRdapDomainsLoading(false)
    }
  }

  // 当对象类型改变时，如果不是域名，则禁用价格查询
  useEffect(() => {
    if (objectType !== 'domain') {
      setIncludePrice(false)
    }
  }, [objectType])

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
      }, 60000) // 60秒后自动消失
      
      return () => clearTimeout(timer)
    }
  }, [rdapError])

  // 检查URL参数中的密码和本地存储的认证信息
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const password = urlParams.get('password')
    
    // 检查本地存储的认证信息
    const storedPassword = localStorage.getItem('authPassword')
    const storedMode = localStorage.getItem('authMode') as 'admin' | 'personal' | null
    
    if (password) {
      // URL参数中的密码优先
      handleAdminAuth(password, 'admin')
    } else if (storedPassword && storedMode) {
      // 使用本地存储的认证信息
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '123456'
      if (storedPassword === adminPassword) {
        setIsAdmin(true)
        setAuthMode(storedMode)
      }
    }
  }, [])

  const handleAdminAuth = (password: string, mode: 'admin' | 'personal' = 'admin') => {
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '123456'
    
    // 检查当前是否已经是管理员模式
    const currentMode = localStorage.getItem('authMode') as 'admin' | 'personal' | null
    const currentPassword = localStorage.getItem('authPassword')
    
    // 如果已经是管理员模式，不允许切换到自用模式
    if (currentMode === 'admin' && currentPassword === adminPassword && mode === 'personal') {
      toast({
        title: "模式切换失败",
        description: "管理员模式下无法切换到自用模式",
        variant: "destructive"
      })
      return
    }
    
    // 如果已经是自用模式，不允许切换到管理员模式
    if (currentMode === 'personal' && currentPassword === adminPassword && mode === 'admin') {
      toast({
        title: "模式切换失败",
        description: "自用模式下无法切换到管理员模式",
        variant: "destructive"
      })
      return
    }
    
    const isCorrectPassword = password === adminPassword
    
    if (isCorrectPassword) {
      localStorage.setItem('authPassword', password)
      localStorage.setItem('authMode', mode)
      setIsAdmin(true)
      setShowAuth(false)
      setAuthPassword('')
      const modeText = mode === 'admin' ? '管理员模式' : '自用模式'
      const description = mode === 'personal' 
        ? `已启用${modeText}，请求次数无限制` 
        : `已启用${modeText}，请求次数无限制`
      toast({
        title: modeText,
        description
      })
    } else {
      toast({
        title: "密码错误",
        description: "请输入正确的密码",
        variant: "destructive"
      })
    }
  }

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
    setPriceInfo(null)

    try {
      // 构建查询URL，包含认证密码参数
      const url = new URL('/api/domain-query', window.location.origin)
      const authPassword = localStorage.getItem('authPassword')
      if (authPassword) {
        url.searchParams.set('password', authPassword)
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
        setIsAdmin(data.isAuth || false)
        
        // 如果启用了价格查询且是域名查询，则查询价格
        if (includePrice && objectType === 'domain') {
          await queryDomainPrice(queryInput.trim())
        }
        
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
        
        // 检查是否是域名后缀不支持，如果是则自动切换到WHOIS查询
        if (data.type === 'rdap' && data.isDomainNotSupported && objectType === 'domain') {
          toast({
            title: "自动切换查询方式",
            description: "该域名后缀不支持RDAP查询，已自动切换到WHOIS查询",
          })
          
          // 自动切换到WHOIS查询
          setQueryType('whois')
          
          // 延迟执行WHOIS查询
          setTimeout(async () => {
            try {
              const whoisUrl = new URL('/api/domain-query', window.location.origin)
              const authPassword = localStorage.getItem('authPassword')
              if (authPassword) {
                whoisUrl.searchParams.set('password', authPassword)
              }

              const whoisResponse = await fetch(whoisUrl.toString(), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'whois',
                  objectType: 'domain',
                  query: queryInput.trim()
                }),
              })

              const whoisData = await whoisResponse.json()
              
              if (whoisData.success) {
                setResult({
                  success: true,
                  data: whoisData.data,
                  type: 'whois'
                })
                setRequestCount(whoisData.requestCount || 0)
                setResetTime(whoisData.resetTime || 0)
                setIsAdmin(whoisData.isAuth || false)
                
                // 如果启用了价格查询，则查询价格
                if (includePrice && objectType === 'domain') {
                  await queryDomainPrice(queryInput.trim())
                }
                
                toast({
                  title: "WHOIS查询成功",
                  description: `成功获取${queryInput}的WHOIS信息`
                })
              } else {
                setResult({
                  success: false,
                  error: whoisData.error || 'WHOIS查询失败',
                  type: 'whois'
                })
                // 确保即使查询失败也更新倒计时信息
                setRequestCount(whoisData.requestCount || 0)
                setResetTime(whoisData.resetTime || 0)
                setIsAdmin(whoisData.isAuth || false)
                toast({
                  title: "WHOIS查询失败",
                  description: whoisData.error || 'WHOIS查询失败，请稍后重试',
                  variant: "destructive"
                })
              }
            } catch (error) {
              setResult({
                success: false,
                error: 'WHOIS查询网络错误，请稍后重试',
                type: 'whois'
              })
              toast({
                title: "WHOIS网络错误",
                description: "无法连接到服务器，请稍后重试",
                variant: "destructive"
              })
            }
          }, 500) // 延迟500ms执行，让用户看到切换提示
        } else {
          setResult({
            success: false,
            error: data.error || '查询失败',
            type: queryType,
            errorCode: data.errorCode
          })
          // 确保即使查询失败也更新倒计时信息
          setRequestCount(data.requestCount || 0)
          setResetTime(data.resetTime || 0)
          setIsAdmin(data.isAuth || false)
          toast({
            title: "查询失败",
            description: data.error || '查询失败，请稍后重试',
            variant: "destructive"
          })
        }
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

  const queryDomainPrice = async (domain: string) => {
    setPriceLoading(true)
    try {
      const url = new URL('/api/price', window.location.origin)
      const authPassword = localStorage.getItem('authPassword')
      if (authPassword) {
        url.searchParams.set('password', authPassword)
      }
      url.searchParams.set('domain', domain)
      url.searchParams.set('sortBy', priceSortBy)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (response.ok) {
        setPriceInfo(data)
      } else {
        console.error('价格查询失败:', data.error)
      }
    } catch (error) {
      console.error('价格查询错误:', error)
    } finally {
      setPriceLoading(false)
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
      <div className="space-y-4">
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
                  <div key={index} className="flex justify-between items-start py-3 px-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-sm text-muted-foreground min-w-0 flex-shrink-0">
                      {item.key}:
                    </span>
                    <span className="text-sm text-foreground break-all flex-1 ml-4 font-mono">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">没有找到相关信息</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 价格信息显示 */}
        {priceInfo && (
          <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                💰 价格信息
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                {queryInput} (.{priceInfo.suffix}) 的{priceInfo.sortedBy === 'registration' ? '注册' : priceInfo.sortedBy === 'renewal' ? '续费' : '转入'}价格参考 - 前3最便宜
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priceInfo.prices && priceInfo.prices.length > 0 ? (
                  priceInfo.prices.map((price: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white dark:bg-green-900/20 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">排名</p>
                        <Badge variant={index === 0 ? "default" : "secondary"} className="mt-1">
                          #{index + 1}
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">注册商</p>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mt-1">
                          {price.registrar}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">价格</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
                          {price.currency === 'CNY' ? '¥' : '$'}{price.price}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">周期</p>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mt-1">
                          {price.period}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">暂无价格信息</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-3 text-center">
                * 价格仅供参考，实际价格请以注册商官网为准
              </p>
            </CardContent>
          </Card>
        )}

        {/* 价格加载状态 */}
        {priceLoading && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">正在查询价格信息...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderRdapError = () => {
    if (!rdapError) return null

    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950 shadow-lg">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="space-y-2">
              <p className="font-medium">RDAP查询错误 (状态码: {rdapError.code})</p>
              <p>{rdapError.message}</p>
              <p className="text-xs opacity-75">
                此消息将在60秒后自动消失。更多RDAP错误信息请参考 about.rdap.org
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleAdminLogin = () => {
    setShowAuth(true)
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('authPassword')
    localStorage.removeItem('authMode')
    setIsAdmin(false)
    setAuthMode('admin')
    toast({
      title: "退出认证模式",
      description: "已退出认证模式"
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* 背景装饰元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* 错误提示 - 固定在右上角 */}
      {renderRdapError()}
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <div className="flex justify-center mb-4">
                <div className="relative w-16 h-16 md:w-20 md:h-20">
                  <img
                    src="/logo.png"
                    alt="剑之魂域名查询 Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-center">
                剑之魂域名查询
              </h1>
              <p className="text-muted-foreground text-center">
                免费的一站式域名信息查询
              </p>
            </div>
            
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="ml-4"
              title="切换主题"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">切换主题</span>
            </Button>
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
                      <p className="text-xs text-muted-foreground">
                        示例: {objectType === 'domain' ? 'google.com, baidu.com' : 
                               objectType === 'ip' ? '8.8.8.8, 1.1.1.1' :
                               objectType === 'autnum' ? '15169, 16509' : 'EXAMPLE-ENTITY'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 价格查询选项 */}
                  {objectType === 'domain' && (
                    <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-price"
                          checked={includePrice}
                          onChange={(e) => setIncludePrice(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="include-price" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          同时查询域名注册价格
                        </Label>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          (仅限域名查询)
                        </span>
                      </div>
                      
                      {/* 价格排序选项 */}
                      {includePrice && (
                        <div className="flex items-center space-x-2 pl-6">
                          <Label htmlFor="price-sort" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            排序方式:
                          </Label>
                          <Select value={priceSortBy} onValueChange={(value: 'registration' | 'renewal' | 'transfer') => setPriceSortBy(value)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registration">注册价格</SelectItem>
                              <SelectItem value="renewal">续费价格</SelectItem>
                              <SelectItem value="transfer">转入价格</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            (显示前3最便宜)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
                    <p className="text-xs text-muted-foreground">
                      示例: google.com, baidu.com, 8.8.8.8, 1.1.1.1
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 认证对话框 */}
              {showAuth && (
                <Card className="border-primary/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="auth-mode">认证模式</Label>
                        <div className="flex gap-2">
                          <Button
                            variant={authMode === 'admin' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMode('admin')}
                          >
                            管理员模式
                          </Button>
                          <Button
                            variant={authMode === 'personal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAuthMode('personal')}
                          >
                            自用模式
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {authMode === 'admin' 
                            ? '管理员模式：完全无限制访问' 
                            : '自用模式：个人使用无限制'
                          }
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auth-password">密码</Label>
                        <Input
                          id="auth-password"
                          type="password"
                          placeholder="请输入密码"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAdminAuth(authPassword, authMode)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleAdminAuth(authPassword, authMode)}>
                          确认登录
                        </Button>
                        <Button variant="outline" onClick={() => setShowAuth(false)}>
                          取消
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        提示：默认密码为 123456，或通过环境变量 ADMIN_PASSWORD 配置
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      {authMode === 'admin' ? '管理员模式' : '自用模式'} - 无限制
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
                
                <div className="flex gap-2">
                  {isAdmin ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAdminLogout}
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      退出认证
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAdminLogin}
                    >
                      <Settings className="mr-1 h-4 w-4" />
                      认证登录
                    </Button>
                  )}
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
          {renderResult()}

          {/* Info Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* RDAP查询详细说明 */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Globe className="h-5 w-5" />
                  RDAP查询说明
                </h4>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>Registration Data Access Protocol</strong> - 域名注册数据访问协议
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>支持查询对象：</strong>域名、IP地址、自治系统号(ASN)、实体句柄
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>数据来源：</strong>直接从注册商的官方数据库获取，信息准确且实时
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>返回信息：</strong>注册时间、过期时间、注册商、DNS服务器、状态等详细信息
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>使用示例：</strong>example.com, 192.168.1.1, AS15169, EXAMPLE-ENTITY
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* WHOIS查询详细说明 */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Server className="h-5 w-5" />
                  WHOIS查询说明
                </h4>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    <strong>传统域名信息查询协议</strong> - 广泛使用的域名信息查询标准
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-green-800 dark:text-green-200">
                        <strong>支持查询对象：</strong>域名、IP地址
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-green-800 dark:text-green-200">
                        <strong>数据来源：</strong>WHOIS服务器，包含注册商、注册人、联系方式等信息
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-green-800 dark:text-green-200">
                        <strong>返回信息：</strong>注册信息、管理联系人、技术联系人、域名状态等
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-green-800 dark:text-green-200">
                        <strong>使用示例：</strong>example.com, 192.168.1.1
                      </p>
                    </div>
                  </div>
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
              
              {/* 支持RDAP查询的域名 */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Globe className="h-5 w-5" />
                  支持RDAP查询的域名
                </h4>
                <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                    完整的RDAP支持情况请访问 <a href="https://deployment.rdap.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">deployment.rdap.org</a>，
                    查看表格中RDAP列为"Yes"的域名，按Domain数量从多到少排序。
                  </p>
              </div>
              
              {/* 隐私和条款说明 */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 text-foreground">
                  隐私和条款
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? (
                    <span className="text-green-600 font-medium">
                      {authMode === 'admin' ? '管理员模式' : '自用模式'}已启用 - 无请求次数限制
                    </span>
                  ) : (
                    <span>
                      注意：为防止滥用，系统限制每IP地址每分钟最多12次查询请求。
                      请合理使用，避免频繁查询。
                    </span>
                  )}
                </p>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground mt-2">
                    认证密码通过环境变量 ADMIN_PASSWORD 配置（默认：123456）
                  </p>
                )}
                
                {/* 开源仓库链接 */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    <a 
                      href="https://github.com/xjl3421/domain-information" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      开源仓库：domain-information
                    </a>
                  </p>
                  
                  {/* 维护信息 */}
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    本项目由
                    <a 
                      href="https://jhkj.netlify.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 dark:text-green-400 hover:underline mx-1"
                    >
                      "剑之魂科技"
                    </a>
                    维护
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}