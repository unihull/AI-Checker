import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { Analyze } from '@/pages/Analyze'
import { FactCheck } from '@/pages/FactCheck'
import { Reports } from '@/pages/Reports'
import { Dashboard } from '@/pages/Dashboard'
import { Pricing } from '@/pages/Pricing'
import { Settings } from '@/pages/Settings'
import { Admin } from '@/pages/Admin'
import { ApiDocs } from '@/pages/ApiDocs'
import { LegalPrivacy } from '@/pages/LegalPrivacy'
import { LegalTerms } from '@/pages/LegalTerms'
import { ReportDetail } from '@/pages/ReportDetail'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuthStore()
  
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/analyze" element={<Analyze />} />
      <Route path="/fact-check" element={<FactCheck />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/api" element={<ApiDocs />} />
      <Route path="/legal/privacy" element={<LegalPrivacy />} />
      <Route path="/legal/terms" element={<LegalTerms />} />
      
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      
      <Route path="/reports/:id" element={
        <ProtectedRoute>
          <ReportDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminRoute>
            <Admin />
          </AdminRoute>
        </ProtectedRoute>
      } />
    </Routes>
  )
}