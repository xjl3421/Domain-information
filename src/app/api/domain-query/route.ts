import { NextRequest, NextResponse } from 'next/server'

// 请求频率限制存储
interface RequestRecord {
  count: number
  resetTime: number
}

const requestStore = new Map<string, RequestRecord>()

// 获取客户端IP地址
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = request.headers.get('cf-connecting-ip') // Cloudflare
  
  return ip || realIP || forwarded?.split(',')[0] || 'unknown'
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

// 检查请求频率限制
function checkRateLimit(ip: string, authResult: { isAuth: boolean; mode: 'admin' | 'personal' | null }): { allowed: boolean; count: number; resetTime: number } {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1分钟
  const maxRequests = 12

  // 如果是自用模式，设置请求限制为0（无限制）
  if (authResult.isAuth && authResult.mode === 'personal') {
    return { allowed: true, count: 0, resetTime: now + windowMs }
  }

  // 管理员模式或其他认证用户也无限制
  if (authResult.isAuth) {
    return { allowed: true, count: 0, resetTime: now + windowMs }
  }

  let record = requestStore.get(ip)
  
  // 如果记录不存在或已过期，创建新记录
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    requestStore.set(ip, record)
    return { allowed: true, count: 1, resetTime: record.resetTime }
  }

  // 检查是否超过限制
  if (record.count >= maxRequests) {
    return { allowed: false, count: record.count, resetTime: record.resetTime }
  }

  // 增加计数
  record.count++
  requestStore.set(ip, record)
  return { allowed: true, count: record.count, resetTime: record.resetTime }
}

// RDAP查询函数
async function queryRDAP(objectType: string, query: string): Promise<{ success: boolean; data?: any; error?: string; errorCode?: number; isDomainNotSupported?: boolean }> {
  const baseUrl = 'https://rdap.org'
  const url = `${baseUrl}/${objectType}/${encodeURIComponent(query)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Query-Tool/1.0'
      },
      timeout: 10000 // 10秒超时
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        // 如果返回的不是JSON，使用状态文本
      }
      
      // 根据状态码返回不同的错误信息
      let errorMessage = ''
      let errorCode = response.status
      let isDomainNotSupported = false
      
      switch (response.status) {
        case 404:
          errorMessage = '未找到指定的对象。请检查输入是否正确。'
          // 如果是域名查询且404错误，可能是域名后缀不支持
          if (objectType === 'domain') {
            isDomainNotSupported = true
            errorMessage = '该域名后缀不支持RDAP查询，建议使用WHOIS查询。'
          }
          break
        case 429:
          errorMessage = '请求过于频繁，请稍后重试。'
          break
        case 400:
          errorMessage = '请求格式错误。请检查输入格式。'
          break
        case 403:
          errorMessage = '访问被拒绝。可能没有权限访问此信息。'
          break
        case 500:
          errorMessage = '服务器内部错误。请稍后重试。'
          break
        case 503:
          errorMessage = '服务暂时不可用。请稍后重试。'
          break
        default:
          errorMessage = `RDAP查询失败: ${response.status} ${response.statusText}`
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
        isDomainNotSupported: isDomainNotSupported
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('RDAP查询错误:', error)
    return {
      success: false,
      error: `RDAP查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
      errorCode: 0
    }
  }
}

// WHOIS查询函数
async function queryWHOIS(query: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // 使用whoiscx.com的WHOIS API
    const url = 'https://api.whoiscx.com/whois/'
    
    const params = new URLSearchParams({
      domain: query,
      raw: '1' // 返回原始WHOIS文本
    })
    
    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Query-Tool/1.0'
      },
      timeout: 15000 // 15秒超时
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WHOIS查询失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    // 检查API响应格式，根据文档status字段表示成功状态
    if (data.status !== 1) {
      throw new Error(data.error || 'WHOIS查询失败')
    }

    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('WHOIS查询错误:', error)
    return {
      success: false,
      error: `WHOIS查询失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, objectType, query } = body

    // 验证输入参数
    if (!type || !query) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 })
    }

    if (type !== 'rdap' && type !== 'whois') {
      return NextResponse.json({
        success: false,
        error: '无效的查询类型'
      }, { status: 400 })
    }

    if (type === 'rdap' && !objectType) {
      return NextResponse.json({
        success: false,
        error: 'RDAP查询需要指定对象类型'
      }, { status: 400 })
    }

    // 验证对象类型
    const validObjectTypes = ['domain', 'ip', 'autnum', 'entity']
    if (type === 'rdap' && !validObjectTypes.includes(objectType)) {
      return NextResponse.json({
        success: false,
        error: '无效的对象类型'
      }, { status: 400 })
    }

    // 清理查询字符串
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) {
      return NextResponse.json({
        success: false,
        error: '查询对象不能为空'
      }, { status: 400 })
    }

    // 获取客户端IP并检查频率限制
    const clientIP = getClientIP(request)
    const authResult = checkAuthPassword(request)
    const rateLimitResult = checkRateLimit(clientIP, authResult)

    if (!rateLimitResult.allowed) {
      const resetTime = new Date(rateLimitResult.resetTime).toLocaleString('zh-CN')
      return NextResponse.json({
        success: false,
        error: `请求频率超限。每分钟最多12次请求，请于 ${resetTime} 后重试`
      }, { status: 429 })
    }

    let result
    try {
      if (type === 'rdap') {
        const rdapResult = await queryRDAP(objectType, cleanQuery)
        if (!rdapResult.success) {
          return NextResponse.json({
            success: false,
            error: rdapResult.error,
            errorCode: rdapResult.errorCode,
            type: 'rdap',
            isDomainNotSupported: rdapResult.isDomainNotSupported
          }, { status: 400 })
        }
        result = rdapResult.data
      } else {
        const whoisResult = await queryWHOIS(cleanQuery)
        if (!whoisResult.success) {
          return NextResponse.json({
            success: false,
            error: whoisResult.error,
            type: 'whois'
          }, { status: 400 })
        }
        result = whoisResult.data
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : '查询失败'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      type: type,
      requestCount: rateLimitResult.count,
      resetTime: rateLimitResult.resetTime,
      isAuth: authResult.isAuth,
      authMode: authResult.mode,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API路由错误:', error)
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

// 设置运行时环境
export const runtime = 'nodejs'

// 定期清理过期的请求记录（每5分钟执行一次）
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, record] of requestStore.entries()) {
      if (now > record.resetTime) {
        requestStore.delete(ip)
      }
    }
  }, 5 * 60 * 1000)
}