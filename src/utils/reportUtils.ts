// Utility functions for report handling and export
import jsPDF from 'jspdf'
import { NotificationService } from '@/lib/notifications'

export interface ReportData {
  id: string
  title: string
  content: string
  metadata: any
  created_at: string
}

export class ReportUtils {
  static async exportToPDF(
    elementRef: React.RefObject<HTMLElement>, 
    reportData: ReportData,
    options: {
      quality?: number
      maxPages?: number
      includeMetadata?: boolean
    } = {}
  ): Promise<boolean> {
    const { quality = 0.8, maxPages = 10, includeMetadata = true } = options

    try {
      if (!elementRef.current) {
        throw new Error('Report element not found')
      }

      // Use dynamic import for better performance
      const html2canvas = (await import('html2canvas')).default
      
      const element = elementRef.current
      
      // Optimize canvas settings for performance
      const canvas = await html2canvas(element, {
        scale: Math.min(2, window.devicePixelRatio),
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        height: Math.min(element.scrollHeight, 5000), // Limit height
        logging: false,
        removeContainer: true,
        imageTimeout: 0
      })

      const imgData = canvas.toDataURL('image/jpeg', quality)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0
      let pageCount = 0
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      pageCount++
      
      // Add additional pages if needed (with limit)
      while (heightLeft >= 0 && pageCount < maxPages) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        pageCount++
      }
      
      // Add metadata if requested
      if (includeMetadata) {
        pdf.setProperties({
          title: reportData.title,
          subject: 'ProofLens Analysis Report',
          author: 'ProofLens AI Platform',
          creator: 'ProofLens',
          producer: 'ProofLens PDF Generator',
          keywords: 'forensics, fact-check, analysis, verification'
        })
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `prooflens-${reportData.id.slice(0, 8)}-${timestamp}.pdf`
      
      // Download the PDF
      pdf.save(filename)
      
      return true
      
    } catch (error) {
      console.error('PDF export failed:', error)
      return false
    }
  }

  static generateShareableLink(reportId: string, includeAuth: boolean = false): string {
    const baseUrl = window.location.origin
    const reportUrl = `${baseUrl}/reports/${reportId}`
    
    if (includeAuth) {
      // Add authentication token for secure sharing
      const token = btoa(JSON.stringify({
        reportId,
        timestamp: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      }))
      return `${reportUrl}?token=${token}`
    }
    
    return reportUrl
  }

  static async exportToJSON(reportData: any): Promise<void> {
    try {
      const jsonData = {
        report_id: reportData.id,
        analysis_type: reportData.input_type,
        confidence: reportData.confidence,
        created_at: reportData.created_at,
        detection_summary: reportData.detection_summary,
        factcheck_summary: reportData.factcheck_summary,
        algorithms: reportData.algorithm_results || [],
        metadata: {
          export_timestamp: new Date().toISOString(),
          export_version: '1.0',
          platform: 'ProofLens'
        }
      }
      
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prooflens-data-${reportData.id.slice(0, 8)}.json`
      a.click()
      
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('JSON export failed:', error)
      throw error
    }
  }

  static async exportToCSV(reports: any[]): Promise<void> {
    try {
      const headers = [
        'Report ID',
        'Type',
        'Source URL',
        'Confidence',
        'Status',
        'Created Date',
        'Processing Time (ms)',
        'Algorithms Used'
      ]
      
      const csvRows = reports.map(report => [
        report.id,
        report.input_type,
        report.source_url || 'N/A',
        report.confidence,
        report.confidence >= 80 ? 'High Confidence' : 
        report.confidence >= 60 ? 'Medium Confidence' : 'Low Confidence',
        new Date(report.created_at).toLocaleDateString(),
        report.processing_ms,
        report.algorithm_results?.length || 0
      ])
      
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prooflens-reports-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('CSV export failed:', error)
      throw error
    }
  }
}