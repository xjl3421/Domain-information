import { NextRequest, NextResponse } from 'next/server'

interface RdapResponse {
  domain: string
  status: string[]
  registrar: string
  registrationDate: string
  expirationDate: string
  updatedDate: string
  nameServers: string[]
  dnssec: string
  registrationDays: number
  remainingDays: number
}

// 请求频率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// 清理过期的限制记录
function cleanupExpiredLimits() {
  const now = Date.now()
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}

// 检查频率限制
function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredLimits()
  
  const now = Date.now()
  const windowMs = 60 * 1000 // 1分钟
  const maxRequests = 12
  
  let record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
    // 创建新记录或重置过期记录
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    rateLimitStore.set(ip, record)
    return { allowed: true, remaining: maxRequests - 1, resetTime: record.resetTime }
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// 解析RDAP数据
function parseRdapData(rdapData: any, domain: string): RdapResponse {
  const status: string[] = rdapData.status || []
  const registrar = rdapData.entities?.find((entity: any) => 
    entity.roles?.includes('registrar')
  )?.vcardArray?.[1]?.find((item: any) => item[0] === 'fn')?.[3] || 'Unknown'
  
  // 提取日期信息
  const events = rdapData.events || []
  const registrationEvent = events.find((event: any) => event.eventAction === 'registration')
  const expirationEvent = events.find((event: any) => event.eventAction === 'expiration')
  const lastChangedEvent = events.find((event: any) => event.eventAction === 'last changed')
  
  const registrationDate = registrationEvent?.eventDate?.split('T')[0] || 'Unknown'
  const expirationDate = expirationEvent?.eventDate?.split('T')[0] || 'Unknown'
  const updatedDate = lastChangedEvent?.eventDate?.split('T')[0] || 'Unknown'
  
  // 提取名称服务器
  const nameServers: string[] = []
  const nameservers = rdapData.nameservers || []
  nameservers.forEach((ns: any) => {
    if (ns.ldhName) {
      nameServers.push(ns.ldhName)
    }
  })
  
  // 提取DNSSEC状态
  const dnssec = rdapData.secureDNS?.delegationSigned ? 'signed' : 'unsigned'
  
  // 计算天数
  const registrationDays = registrationDate !== 'Unknown' ? 
    Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  const remainingDays = expirationDate !== 'Unknown' ? 
    Math.floor((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  
  return {
    domain,
    status,
    registrar,
    registrationDate,
    expirationDate,
    updatedDate,
    nameServers: nameServers.length > 0 ? nameServers : ['Unknown'],
    dnssec,
    registrationDays,
    remainingDays
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }
    
    // 验证域名格式
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }
    
    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // 检查是否为管理员模式或自用模式
    const adminPassword = request.headers.get('x-admin-password')
    const isAdminMode = process.env.ADMIN_MODE === 'true' && 
                       adminPassword === process.env.ADMIN_PASSWORD
    
    const selfUsePassword = request.headers.get('x-self-use-password')
    const isSelfUseMode = process.env.SELF_USE_MODE === 'true' && 
                         selfUsePassword === process.env.SELF_USE_PASSWORD
    
    // 频率限制检查（管理员和自用模式不受限制）
    if (!isAdminMode && !isSelfUseMode) {
      const rateLimit = checkRateLimit(clientIP)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            remaining: rateLimit.remaining,
            resetTime: new Date(rateLimit.resetTime).toISOString()
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
            }
          }
        )
      }
    }
    
    // 调用RDAP API
    const apiUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Domain-Query-Tool/1.0',
        'Accept': 'application/rdap+json'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Domain not found' },
          { status: 404 }
        )
      }
      throw new Error(`RDAP API request failed: ${response.status}`)
    }
    
    const rdapData = await response.json()
    
    // 解析RDAP数据
    const domainInfo = parseRdapData(rdapData, domain)
    
    return NextResponse.json(domainInfo)
    
  } catch (error) {
    console.error('RDAP query error:', error)
    return NextResponse.json(
      { error: 'Failed to query RDAP information' },
      { status: 500 }
    )
  }
}