import { NextRequest, NextResponse } from 'next/server'

interface RDAPSupportedDomain {
  tld: string
  rdap_servers: string[]
  whois_server?: string
  status: 'active' | 'retired' | 'reserved'
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

// 检查认证密码和模式
function checkAuthPassword(request: NextRequest): { isAuth: boolean; mode: 'admin' | 'personal' | null } {
  const adminPassword = process.env.ADMIN_PASSWORD || '123456' // 默认密码
  if (!adminPassword) return { isAuth: false, mode: null }
  
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  if (password === adminPassword) {
    const currentMode = process.env.ADMIN_MODE === 'false' ? 'personal' : 'admin'
    return { isAuth: true, mode: currentMode }
  }
  
  return { isAuth: false, mode: null }
}

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = request.headers.get('cf-connecting-ip') // Cloudflare
  
  return ip || realIP || forwarded?.split(',')[0] || 'unknown'
}

// 检查频率限制
function checkRateLimit(ip: string, authResult: { isAuth: boolean; mode: 'admin' | 'personal' | null }): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredLimits()
  
  const now = Date.now()
  const windowMs = 60 * 1000 // 1分钟
  const maxRequests = 30 // RDAP域名查询可以有更高的限制
  
  // 如果是自用模式，设置请求限制为0（无限制）
  if (authResult.isAuth && authResult.mode === 'personal') {
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs }
  }
  
  // 管理员模式或其他认证用户也无限制
  if (authResult.isAuth) {
    return { allowed: true, remaining: maxRequests, resetTime: now + windowMs }
  }
  
  let record = rateLimitStore.get(ip)
  
  if (!record || now > record.resetTime) {
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

// 从deployment.rdap.org获取支持的域名列表
async function fetchRDAPSupportedDomains(): Promise<RDAPSupportedDomain[]> {
  try {
    // IANA Root Zone Database - 获取所有TLD
    const ianaResponse = await fetch('https://data.iana.org/TLD/tlds-alpha-by-domain.txt', {
      headers: {
        'User-Agent': 'Domain-Query-Tool/1.0'
      },
      timeout: 10000
    })

    if (!ianaResponse.ok) {
      throw new Error(`Failed to fetch IANA TLD list: ${ianaResponse.status}`)
    }

    const ianaText = await ianaResponse.text()
    const lines = ianaText.split('\n')
    
    // 跳过注释行和空行，提取TLD
    const tlds = lines
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.trim().toLowerCase())
      .filter(tld => tld.length > 0)

    // 为每个TLD创建RDAP支持信息
    const supportedDomains: RDAPSupportedDomain[] = tlds.map(tld => ({
      tld,
      rdap_servers: [`https://rdap.org/${tld}/`],
      status: 'active' as const
    }))

    return supportedDomains.slice(0, 100) // 限制返回前100个TLD以避免响应过大
    
  } catch (error) {
    console.error('Failed to fetch RDAP supported domains:', error)
    
    // 如果获取失败，返回一些常见的TLD作为备用
    return [
      { tld: 'com', rdap_servers: ['https://rdap.org/com/'], status: 'active' },
      { tld: 'net', rdap_servers: ['https://rdap.org/net/'], status: 'active' },
      { tld: 'org', rdap_servers: ['https://rdap.org/org/'], status: 'active' },
      { tld: 'edu', rdap_servers: ['https://rdap.org/edu/'], status: 'active' },
      { tld: 'gov', rdap_servers: ['https://rdap.org/gov/'], status: 'active' },
      { tld: 'io', rdap_servers: ['https://rdap.org/io/'], status: 'active' },
      { tld: 'ai', rdap_servers: ['https://rdap.org/ai/'], status: 'active' },
      { tld: 'co', rdap_servers: ['https://rdap.org/co/'], status: 'active' },
      { tld: 'xyz', rdap_servers: ['https://rdap.org/xyz/'], status: 'active' },
      { tld: 'dev', rdap_servers: ['https://rdap.org/dev/'], status: 'active' },
      { tld: 'app', rdap_servers: ['https://rdap.org/app/'], status: 'active' },
      { tld: 'cn', rdap_servers: ['https://rdap.org/cn/'], status: 'active' },
      { tld: 'uk', rdap_servers: ['https://rdap.org/uk/'], status: 'active' },
      { tld: 'de', rdap_servers: ['https://rdap.org/de/'], status: 'active' },
      { tld: 'fr', rdap_servers: ['https://rdap.org/fr/'], status: 'active' },
      { tld: 'jp', rdap_servers: ['https://rdap.org/jp/'], status: 'active' },
      { tld: 'au', rdap_servers: ['https://rdap.org/au/'], status: 'active' },
      { tld: 'ca', rdap_servers: ['https://rdap.org/ca/'], status: 'active' },
      { tld: 'br', rdap_servers: ['https://rdap.org/br/'], status: 'active' },
      { tld: 'ru', rdap_servers: ['https://rdap.org/ru/'], status: 'active' }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    
    // 获取客户端IP并检查认证状态
    const clientIP = getClientIP(request)
    const authResult = checkAuthPassword(request)
    
    // 频率限制检查
    const rateLimit = checkRateLimit(clientIP, authResult)
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
    
    // 获取RDAP支持的域名列表
    const supportedDomains = await fetchRDAPSupportedDomains()
    
    // 添加缓存控制头
    const headers = {
      'Cache-Control': 'public, max-age=3600', // 缓存1小时
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: {
        domains: supportedDomains,
        total: supportedDomains.length,
        last_updated: new Date().toISOString(),
        source: 'IANA Root Zone Database via data.iana.org'
      },
      timestamp: new Date().toISOString()
    }, { headers })
    
  } catch (error) {
    console.error('RDAP domains query error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch RDAP supported domains',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// 设置运行时环境
export const runtime = 'nodejs'