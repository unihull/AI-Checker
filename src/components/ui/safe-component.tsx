import React, { Component, ReactNode } from 'react'
import { ErrorFallback } from '@/components/ui/error-fallback'

interface SafeComponentProps {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface SafeComponentState {
  hasError: boolean
  error: Error | null
}

export class SafeComponent extends Component<SafeComponentProps, SafeComponentState> {
  constructor(props: SafeComponentProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SafeComponentState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`SafeComponent (${this.props.componentName || 'Unknown'}) caught error:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-800 dark:text-red-200">
            Component error: {this.props.componentName || 'Unknown component'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components safely
export function withSafeComponent<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeComponent componentName={componentName || WrappedComponent.name}>
        <WrappedComponent {...props} />
      </SafeComponent>
    )
  }
}