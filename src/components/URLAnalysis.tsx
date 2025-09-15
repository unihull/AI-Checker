import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Globe, ExternalLink, Calendar, Building } from 'lucide-react'

interface URLAnalysisProps {
  onAnalyze: (url: string) => void
  onPreviewFetch: (url: string) => Promise<{
    title: string
    description: string
    image: string
    domain: string
    publishedAt: string
  } | null>
}

interface PreviewData {
  title: string
  description: string
  image: string
  domain: string
  publishedAt: string
}

export function URLAnalysis({ onAnalyze, onPreviewFetch }: URLAnalysisProps) {
  const [url, setUrl] = useState('')
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const onSubmit = async (data: any) => {
    const inputUrl = data.url || url
    
    if (!isValidUrl(inputUrl)) {
      setError('Please enter a valid URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setPreviewData(null)

    try {
      const preview = await onPreviewFetch(inputUrl)
      
      if (preview) {
        setPreviewData(preview)
      } else {
        setError('Failed to fetch URL preview. The URL might be inaccessible or blocked by CORS policy.')
      }
    } catch (error) {
      console.error('Preview fetch failed:', error)
      setError('Failed to load URL preview. Please check the URL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeClick = () => {
    if (previewData && url) {
      onAnalyze(url)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown date'
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            {...register('url', { 
              required: 'URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL starting with http:// or https://'
              }
            })}
            placeholder="https://example.com/article"
            className="pl-10"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        {errors.url && (
          <p className="text-sm text-destructive">{errors.url.message as string}</p>
        )}
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || !url.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading Preview...
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              Load Preview
            </>
          )}
        </Button>
      </form>

      {previewData && (
        <div className="space-y-4">
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <img
                  src={previewData.image}
                  alt="Article preview"
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400'
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base line-clamp-2 mb-2">
                    {previewData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {previewData.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Building className="h-3 w-3 mr-1" />
                      {previewData.domain}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(previewData.publishedAt)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(url, '_blank')}
                  className="flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            onClick={handleAnalyzeClick}
            className="w-full"
            size="lg"
          >
            <Globe className="h-4 w-4 mr-2" />
            Analyze This URL
          </Button>
        </div>
      )}
    </div>
  )
}