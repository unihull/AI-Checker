// File utility functions
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('File reading timeout'))
    }, 30000) // 30 second timeout
    
    const reader = new FileReader()
    reader.onload = () => {
      clearTimeout(timeout)
      const result = reader.result as string
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Failed to read file'))
    }
    reader.readAsDataURL(file)
  })
}

export const calculateFileHash = async (file: File): Promise<string> => {
  try {
    // Add size limit for hash calculation
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      console.warn('File too large for hash calculation, using fallback')
      return `large_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    console.error('File hash calculation failed:', error)
    return `fallback_${Date.now()}_${Math.random()}`
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getFileTypeFromMime = (mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'unknown' => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document'
  return 'unknown'
}

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const extractDomainFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}