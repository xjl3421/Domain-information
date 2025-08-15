import { NextRequest, NextResponse } from 'next/server'

interface PriceResponse {
  registrar: string
  price: number
  currency: string
  period: string
  type: 'registration' | 'renewal' | 'transfer'
}

interface PriceInfo {
  suffix: string
  prices: PriceResponse[]
  sortedBy: 'registration' | 'renewal' | 'transfer'
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
    // 简化处理：如果密码正确，认为是管理员模式
    // 在实际应用中，这里应该检查环境变量来决定当前是管理员模式还是自用模式
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
  const maxRequests = 12
  
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

// 解析域名后缀
function getDomainSuffix(domain: string): string {
  const parts = domain.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : domain
}

// 模拟从nazhumi.com获取价格信息
async function fetchPriceFromNazhumi(domain: string, sortBy: 'registration' | 'renewal' | 'transfer' = 'registration'): Promise<PriceInfo> {
  const suffix = getDomainSuffix(domain)
  
  try {
    // 这里应该调用nazhumi.com的API，但由于没有具体的API文档，
    // 我们先模拟一些常见的域名价格，包含注册、续费、转入价格
    const priceMap: Record<string, PriceResponse[]> = {
      'com': [
        { registrar: 'NameSilo', price: 8.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameSilo', price: 10.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameSilo', price: 8.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'GoDaddy', price: 12.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'GoDaddy', price: 17.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'GoDaddy', price: 12.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'NameCheap', price: 9.98, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 13.98, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 9.98, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'net': [
        { registrar: 'GoDaddy', price: 12.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'GoDaddy', price: 17.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'GoDaddy', price: 12.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'NameCheap', price: 11.98, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 14.98, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 11.98, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'org': [
        { registrar: 'NameCheap', price: 9.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 12.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 9.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'Porkbun', price: 8.97, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Porkbun', price: 11.97, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Porkbun', price: 8.97, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'cn': [
        { registrar: '阿里云', price: 28.00, currency: 'CNY', period: '1年', type: 'registration' },
        { registrar: '阿里云', price: 35.00, currency: 'CNY', period: '1年', type: 'renewal' },
        { registrar: '阿里云', price: 28.00, currency: 'CNY', period: '1年', type: 'transfer' },
        { registrar: '腾讯云', price: 25.00, currency: 'CNY', period: '1年', type: 'registration' },
        { registrar: '腾讯云', price: 32.00, currency: 'CNY', period: '1年', type: 'renewal' },
        { registrar: '腾讯云', price: 25.00, currency: 'CNY', period: '1年', type: 'transfer' }
      ],
      'io': [
        { registrar: 'Porkbun', price: 64.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Porkbun', price: 69.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Porkbun', price: 64.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'NameSilo', price: 68.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameSilo', price: 73.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameSilo', price: 68.99, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'ai': [
        { registrar: 'NameSilo', price: 89.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameSilo', price: 94.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameSilo', price: 89.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'Porkbun', price: 85.97, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Porkbun', price: 90.97, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Porkbun', price: 85.97, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'co': [
        { registrar: 'GoDaddy', price: 29.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'GoDaddy', price: 34.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'GoDaddy', price: 29.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'NameCheap', price: 26.98, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 31.98, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 26.98, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'xyz': [
        { registrar: 'NameCheap', price: 2.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 14.98, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 2.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'Porkbun', price: 3.97, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Porkbun', price: 13.97, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Porkbun', price: 3.97, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'dev': [
        { registrar: 'Google Domains', price: 12.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Google Domains', price: 12.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Google Domains', price: 12.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'NameCheap', price: 11.98, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'NameCheap', price: 14.98, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'NameCheap', price: 11.98, currency: 'USD', period: '1年', type: 'transfer' }
      ],
      'app': [
        { registrar: 'Google Domains', price: 19.99, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Google Domains', price: 19.99, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Google Domains', price: 19.99, currency: 'USD', period: '1年', type: 'transfer' },
        { registrar: 'Porkbun', price: 17.97, currency: 'USD', period: '1年', type: 'registration' },
        { registrar: 'Porkbun', price: 17.97, currency: 'USD', period: '1年', type: 'renewal' },
        { registrar: 'Porkbun', price: 17.97, currency: 'USD', period: '1年', type: 'transfer' }
      ]
    }
    
    const defaultPrices: PriceResponse[] = [
      { registrar: 'Unknown', price: 15.99, currency: 'USD', period: '1年', type: 'registration' },
      { registrar: 'Unknown', price: 18.99, currency: 'USD', period: '1年', type: 'renewal' },
      { registrar: 'Unknown', price: 15.99, currency: 'USD', period: '1年', type: 'transfer' }
    ]
    
    let prices = priceMap[suffix.toLowerCase()] || defaultPrices
    
    // 按指定类型排序并取前3个最便宜的
    prices = prices
      .filter(price => price.type === sortBy)
      .sort((a, b) => a.price - b.price)
      .slice(0, 3)
    
    return {
      suffix,
      prices,
      sortedBy: sortBy
    }
    
  } catch (error) {
    console.error('Failed to fetch price from nazhumi:', error)
    throw new Error('Failed to fetch domain price')
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const sortBy = searchParams.get('sortBy') as 'registration' | 'renewal' | 'transfer' || 'registration'
    
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
    
    // 获取客户端IP并检查认证状态
    const clientIP = getClientIP(request)
    const authResult = checkAuthPassword(request)
    
    // 频率限制检查（认证用户不受限制）
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
    
    // 获取域名价格信息
    const priceInfo = await fetchPriceFromNazhumi(domain, sortBy)
    
    return NextResponse.json(priceInfo)
    
  } catch (error) {
    console.error('Price query error:', error)
    return NextResponse.json(
      { error: 'Failed to query domain price' },
      { status: 500 }
    )
  }
}