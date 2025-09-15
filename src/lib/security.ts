// Comprehensive security service for enterprise-level protection
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'

export interface ClientInfo {
  ip: string
  userAgent: string
  country: string
  city: string
  deviceType: string
  browser: string
  os: string
  timezone: string
  language: string
}

export interface SecurityIncident {
  type: 'unauthorized_access' | 'data_breach' | 'api_abuse' | 'suspicious_activity' | 'fraud_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  userId?: string
  organizationId?: string
  ipAddress?: string
  detectionMethod?: string
}

export interface PasswordValidation {
  valid: boolean
  score: number
  message: string
  suggestions: string[]
}

export class SecurityService {
  private static readonly PASSWORD_MIN_LENGTH = 8
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  // Enhanced client information gathering
  static async getClientInfo(): Promise<ClientInfo> {
    const userAgent = navigator.userAgent
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const language = navigator.language

    let ip = '127.0.0.1'
    let country = 'Unknown'
    let city = 'Unknown'

    try {
      // Get IP with timeout
      const ipResponse = await Promise.race([
        fetch('https://api.ipify.org?format=json'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]) as Response

      if (ipResponse.ok) {
        const ipData = await ipResponse.json()
        ip = ipData.ip
      }

      // Get location with timeout
      const locationResponse = await Promise.race([
        fetch(`https://ipapi.co/${ip}/json/`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]) as Response

      if (locationResponse.ok) {
        const locationData = await locationResponse.json()
        country = locationData.country_name || 'Unknown'
        city = locationData.city || 'Unknown'
      }
    } catch (error) {
      console.warn('Failed to get client location:', error)
      // Return minimal info to avoid blocking operations
      return {
        ip: '127.0.0.1',
        userAgent,
        country: 'Unknown',
        city: 'Unknown',
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowserName(userAgent),
        os: this.getOSName(userAgent),
        timezone,
        language
      }
    }

    return {
      ip,
      userAgent,
      country,
      city,
      deviceType: this.getDeviceType(userAgent),
      browser: this.getBrowserName(userAgent),
      os: this.getOSName(userAgent),
      timezone,
      language
    }
  }

  // Enhanced password validation with security requirements
  static validatePassword(password: string): PasswordValidation {
    const suggestions: string[] = []
    let score = 0

    if (password.length < this.PASSWORD_MIN_LENGTH) {
      return {
        valid: false,
        score: 0,
        message: `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`,
        suggestions: [`Use at least ${this.PASSWORD_MIN_LENGTH} characters`]
      }
    }

    // Length check
    if (password.length >= 12) score += 25
    else if (password.length >= 8) score += 15
    else suggestions.push('Use at least 12 characters for better security')

    // Character variety checks
    if (/[a-z]/.test(password)) score += 15
    else suggestions.push('Include lowercase letters')

    if (/[A-Z]/.test(password)) score += 15
    else suggestions.push('Include uppercase letters')

    if (/[0-9]/.test(password)) score += 15
    else suggestions.push('Include numbers')

    if (/[^a-zA-Z0-9]/.test(password)) score += 20
    else suggestions.push('Include special characters (!@#$%^&*)')

    // Pattern checks
    if (!/(.)\1{2,}/.test(password)) score += 10
    else suggestions.push('Avoid repeating characters')

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score += 10
    } else {
      suggestions.push('Avoid common password patterns')
    }

    const isValid = score >= 70 && password.length >= this.PASSWORD_MIN_LENGTH

    return {
      valid: isValid,
      score,
      message: isValid ? 'Password strength: Strong' : 
               score >= 50 ? 'Password strength: Medium - Consider improvements' :
               'Password strength: Weak - Please strengthen',
      suggestions
    }
  }

  // Enhanced session management
  static async createUserSession(userId: string, sessionData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionData.session_token,
          ip_address: sessionData.ip,
          user_agent: sessionData.userAgent,
          country: sessionData.country,
          city: sessionData.city,
          device_type: sessionData.deviceType,
          browser: sessionData.browser,
          os: sessionData.os,
          is_active: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        })

      if (error) {
        console.error('Session creation failed:', error)
      }

      // Check for suspicious activity
      await this.checkSuspiciousActivity(userId, sessionData.ip)

    } catch (error) {
      console.error('Enhanced session creation failed:', error)
    }
  }

  // Suspicious activity detection
  static async checkSuspiciousActivity(userId: string, ipAddress: string): Promise<void> {
    try {
      // Check for multiple locations
      const { data: recentSessions } = await supabase
        .from('user_sessions')
        .select('country, city, ip_address')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (recentSessions && recentSessions.length > 1) {
        const uniqueCountries = new Set(recentSessions.map(s => s.country))
        const uniqueIPs = new Set(recentSessions.map(s => s.ip_address))

        if (uniqueCountries.size > 2 || uniqueIPs.size > 3) {
          await this.logSecurityIncident({
            type: 'suspicious_activity',
            severity: 'medium',
            userId,
            description: `Multiple locations detected: ${Array.from(uniqueCountries).join(', ')}`,
            detectionMethod: 'automated_location_check'
          })
        }
      }

      // Check for rapid requests
      const { count } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes

      if (count && count > 50) {
        await this.logSecurityIncident({
          type: 'api_abuse',
          severity: 'high',
          userId,
          description: `Rapid API requests: ${count} requests in 5 minutes`,
          detectionMethod: 'rate_limit_detection'
        })
      }

    } catch (error) {
      console.error('Suspicious activity check failed:', error)
    }
  }

  // Enhanced security incident logging
  static async logSecurityIncident(incident: SecurityIncident): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .insert({
          incident_type: incident.type,
          severity: incident.severity,
          user_id: incident.userId,
          organization_id: incident.organizationId,
          ip_address: incident.ipAddress,
          description: incident.description,
          detection_method: incident.detectionMethod || 'manual',
          investigation_status: 'open'
        })

      if (error) {
        console.error('Failed to log security incident:', error)
      }

      // Send immediate alerts for critical incidents
      if (incident.severity === 'critical') {
        await this.sendSecurityAlert(incident)
      }

    } catch (error) {
      console.error('Security incident logging failed:', error)
    }
  }

  // Send security alerts to admins
  static async sendSecurityAlert(incident: SecurityIncident): Promise<void> {
    try {
      // Get admin users for the organization
      let adminQuery = supabase
        .from('profiles')
        .select('id, email, name')
        .eq('role', 'admin')

      if (incident.organizationId) {
        adminQuery = adminQuery.eq('organization_id', incident.organizationId)
      }

      const { data: admins } = await adminQuery

      if (admins) {
        for (const admin of admins) {
          await supabase.functions.invoke('send-notification', {
            body: {
              user_id: admin.id,
              type: 'security_alert',
              title: `Security Incident: ${incident.type}`,
              body: `Severity: ${incident.severity}\n${incident.description}`
            }
          })
        }
      }
    } catch (error) {
      console.error('Security alert sending failed:', error)
    }
  }

  // Failed login tracking
  static async logFailedLogin(email: string, ipAddress: string, reason: string): Promise<void> {
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          endpoint: '/auth/login',
          method: 'POST',
          status_code: 401,
          ip_address: ipAddress,
          error_message: `Failed login for ${email}: ${reason}`,
          metadata: {
            email,
            event_type: 'failed_login',
            security_flag: true
          }
        })

      // Track failed attempts
      const { count } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('endpoint', '/auth/login')
        .eq('status_code', 401)
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour

      if (count && count >= this.MAX_LOGIN_ATTEMPTS) {
        await this.logSecurityIncident({
          type: 'unauthorized_access',
          severity: 'high',
          description: `Multiple failed login attempts from IP ${ipAddress}`,
          ipAddress,
          detectionMethod: 'failed_login_threshold'
        })
      }

    } catch (error) {
      console.error('Failed login logging error:', error)
    }
  }

  // Failed signup tracking
  static async logFailedSignup(email: string, ipAddress: string, reason: string): Promise<void> {
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          endpoint: '/auth/signup',
          method: 'POST',
          status_code: 400,
          ip_address: ipAddress,
          error_message: `Failed signup for ${email}: ${reason}`,
          metadata: {
            email,
            event_type: 'failed_signup',
            security_flag: true
          }
        })
    } catch (error) {
      console.error('Failed signup logging error:', error)
    }
  }

  // Enhanced error handling
  static handleAuthError(error: Error, context: string): void {
    const errorMessage = this.getSecureErrorMessage(error.message)
    
    console.error(`Auth error in ${context}:`, error)
    
    // Don't expose internal errors to users
    if (error.message.includes('Database error') || 
        error.message.includes('Internal server error')) {
      NotificationService.error(
        'Service temporarily unavailable. Please try again in a few moments.',
        { title: 'Authentication Error' }
      )
    } else {
      NotificationService.error(errorMessage, { title: 'Authentication Error' })
    }
  }

  // Sanitize error messages for user display
  static getSecureErrorMessage(originalMessage: string): string {
    const secureMessages: { [key: string]: string } = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please check your email and click the verification link',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 8 characters long',
      'Database error saving new user': 'Account creation failed. Please try again.',
      'Rate limit exceeded': 'Too many requests. Please wait before trying again.',
      'Account suspended': 'Your account has been suspended. Contact support for assistance.'
    }

    for (const [key, value] of Object.entries(secureMessages)) {
      if (originalMessage.includes(key)) {
        return value
      }
    }

    // Default secure message for unknown errors
    return 'An error occurred. Please try again or contact support if the problem persists.'
  }

  // Multi-factor authentication support
  static async enableMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      // Generate TOTP secret
      const secret = this.generateTOTPSecret()
      const qrCode = this.generateQRCode(secret, userId)

      // Store encrypted secret
      const { error } = await supabase
        .from('profiles')
        .update({ mfa_secret: secret })
        .eq('id', userId)

      if (error) throw error

      return { secret, qrCode }
    } catch (error) {
      console.error('MFA enable failed:', error)
      throw new Error('Failed to enable multi-factor authentication')
    }
  }

  static async verifyMFA(userId: string, token: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('mfa_secret')
        .eq('id', userId)
        .single()

      if (!profile?.mfa_secret) return false

      return this.verifyTOTPToken(profile.mfa_secret, token)
    } catch (error) {
      console.error('MFA verification failed:', error)
      return false
    }
  }

  // Input validation and sanitization
  static validateInput(input: string, type: 'text' | 'url' | 'email' | 'filename'): {
    valid: boolean
    sanitized: string
    issues: string[]
  } {
    const issues: string[] = []
    let sanitized = input.trim()

    // Basic XSS prevention
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ]

    for (const pattern of xssPatterns) {
      if (pattern.test(sanitized)) {
        issues.push('Potentially malicious content detected')
        sanitized = sanitized.replace(pattern, '')
      }
    }

    // SQL injection prevention
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
      /['";]/g
    ]

    if (type === 'text') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(sanitized)) {
          issues.push('Potentially unsafe SQL patterns detected')
          sanitized = sanitized.replace(pattern, '')
        }
      }
    }

    // URL validation
    if (type === 'url') {
      try {
        const url = new URL(sanitized)
        if (!['http:', 'https:'].includes(url.protocol)) {
          issues.push('Invalid URL protocol')
          return { valid: false, sanitized: '', issues }
        }
      } catch {
        issues.push('Invalid URL format')
        return { valid: false, sanitized: '', issues }
      }
    }

    // Email validation
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitized)) {
        issues.push('Invalid email format')
        return { valid: false, sanitized: '', issues }
      }
    }

    // Filename validation
    if (type === 'filename') {
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com']
      const extension = sanitized.split('.').pop()?.toLowerCase()
      
      if (extension && dangerousExtensions.includes(`.${extension}`)) {
        issues.push('Dangerous file type detected')
        return { valid: false, sanitized: '', issues }
      }
    }

    return {
      valid: issues.length === 0,
      sanitized,
      issues
    }
  }

  // Rate limiting
  static async checkRateLimit(
    userId: string, 
    action: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      const windowStart = new Date(Date.now() - windowMs)
      
      const { count } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('endpoint', action)
        .gte('created_at', windowStart.toISOString())

      const used = count || 0
      const remaining = Math.max(0, limit - used)
      const resetTime = new Date(Date.now() + windowMs)

      return {
        allowed: used < limit,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      return { allowed: true, remaining: limit, resetTime: new Date() }
    }
  }

  // Content validation for uploads
  static async validateFileContent(file: File): Promise<{
    valid: boolean
    issues: string[]
    metadata: any
  }> {
    const issues: string[] = []
    const metadata: any = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }

    // File size validation
    const maxSizes = {
      'image/': 100 * 1024 * 1024, // 100MB
      'video/': 1000 * 1024 * 1024, // 1GB
      'audio/': 500 * 1024 * 1024, // 500MB
      'text/': 10 * 1024 * 1024 // 10MB
    }

    const fileCategory = Object.keys(maxSizes).find(cat => file.type.startsWith(cat))
    const maxSize = fileCategory ? maxSizes[fileCategory as keyof typeof maxSizes] : 10 * 1024 * 1024

    if (file.size > maxSize) {
      issues.push(`File too large. Maximum size: ${this.formatBytes(maxSize)}`)
    }

    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
      'text/plain', 'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      issues.push(`File type not allowed: ${file.type}`)
    }

    // File name validation
    const nameValidation = this.validateInput(file.name, 'filename')
    if (!nameValidation.valid) {
      issues.push(...nameValidation.issues)
    }

    return {
      valid: issues.length === 0,
      issues,
      metadata
    }
  }

  // Helper methods
  private static getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile'
    if (/Tablet|iPad/.test(userAgent)) return 'tablet'
    return 'desktop'
  }

  private static getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  private static getOSName(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac OS')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private static generateTOTPSecret(): string {
    // Generate a 32-character base32 secret for TOTP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  private static generateQRCode(secret: string, userId: string): string {
    // Generate QR code URL for TOTP apps
    const issuer = 'ProofLens'
    const label = `${issuer}:${userId}`
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
  }

  private static verifyTOTPToken(secret: string, token: string): boolean {
    // Simplified TOTP verification - in production, use a proper TOTP library
    // This is a placeholder implementation
    const time = Math.floor(Date.now() / 30000)
    const expectedToken = this.generateTOTPToken(secret, time)
    const prevToken = this.generateTOTPToken(secret, time - 1)
    const nextToken = this.generateTOTPToken(secret, time + 1)
    
    return token === expectedToken || token === prevToken || token === nextToken
  }

  private static generateTOTPToken(secret: string, time: number): string {
    // Simplified TOTP generation - use proper crypto library in production
    const hash = Math.abs((secret + time.toString()).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0))
    
    return (hash % 1000000).toString().padStart(6, '0')
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Enhanced IP-based security
export class IPSecurityService {
  static async checkIPAccess(ipAddress: string, organizationId?: string): Promise<boolean> {
    if (!organizationId) return true // No restrictions for individual users

    try {
      const { data, error } = await supabase.rpc('check_ip_access', {
        client_ip: ipAddress,
        org_id: organizationId
      })

      if (error) {
        console.error('IP access check failed:', error)
        return false // Fail secure
      }

      return data
    } catch (error) {
      console.error('IP security check error:', error)
      return false
    }
  }

  static async addIPToWhitelist(
    ipAddress: string, 
    organizationId: string, 
    reason: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ip_access_control')
        .insert({
          organization_id: organizationId,
          ip_address: ipAddress,
          access_type: 'whitelist',
          reason,
          expires_at: expiresAt?.toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Failed to add IP to whitelist:', error)
      throw error
    }
  }
}