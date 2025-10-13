"use client"

import * as React from "react"
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from "./drawer"
import { cn } from "@/shared/utils"
import { hapticFeedback } from "@/lib/haptic-feedback"

// Centralized drawer types and configurations
export type DrawerType = 'form' | 'list' | 'details'

export interface DrawerConfig {
  type: DrawerType
  title?: string
  description?: string
  showCloseButton?: boolean
  preventAutoClose?: boolean
  hapticFeedback?: boolean
  className?: string
}

export interface ManagedDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: DrawerConfig
  trigger?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Centralized drawer state management
interface DrawerState {
  activeDrawers: Set<string>
  drawerConfigs: Map<string, DrawerConfig>
}

const DrawerContext = React.createContext<{
  state: DrawerState
  registerDrawer: (id: string, config: DrawerConfig) => void
  unregisterDrawer: (id: string) => void
  openDrawer: (id: string) => void
  closeDrawer: (id: string) => void
  closeAllDrawers: () => void
} | null>(null)

// Centralized drawer provider
export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DrawerState>({
    activeDrawers: new Set(),
    drawerConfigs: new Map()
  })

  const registerDrawer = React.useCallback((id: string, config: DrawerConfig) => {
    setState(prev => ({
      ...prev,
      drawerConfigs: new Map(prev.drawerConfigs).set(id, config)
    }))
  }, [])

  const unregisterDrawer = React.useCallback((id: string) => {
    setState(prev => {
      const newConfigs = new Map(prev.drawerConfigs)
      newConfigs.delete(id)
      const newActive = new Set(prev.activeDrawers)
      newActive.delete(id)
      return {
        drawerConfigs: newConfigs,
        activeDrawers: newActive
      }
    })
  }, [])

  const openDrawer = React.useCallback((id: string) => {
    const config = state.drawerConfigs.get(id)
    if (config?.hapticFeedback !== false) {
      hapticFeedback.drawerOpen()
    }
    setState(prev => ({
      ...prev,
      activeDrawers: new Set(prev.activeDrawers).add(id)
    }))
  }, [state.drawerConfigs])

  const closeDrawer = React.useCallback((id: string) => {
    const config = state.drawerConfigs.get(id)
    if (config?.hapticFeedback !== false) {
      hapticFeedback.drawerClose()
    }
    setState(prev => {
      const newActive = new Set(prev.activeDrawers)
      newActive.delete(id)
      return {
        ...prev,
        activeDrawers: newActive
      }
    })
  }, [state.drawerConfigs])

  const closeAllDrawers = React.useCallback(() => {
    hapticFeedback.drawerClose()
    setState(prev => ({
      ...prev,
      activeDrawers: new Set()
    }))
  }, [])

  const contextValue = React.useMemo(() => ({
    state,
    registerDrawer,
    unregisterDrawer,
    openDrawer,
    closeDrawer,
    closeAllDrawers
  }), [state, registerDrawer, unregisterDrawer, openDrawer, closeDrawer, closeAllDrawers])

  return (
    <DrawerContext.Provider value={contextValue}>
      {children}
    </DrawerContext.Provider>
  )
}

// Hook to use drawer context
export function useDrawerManager() {
  const context = React.useContext(DrawerContext)
  if (!context) {
    throw new Error('useDrawerManager must be used within a DrawerProvider')
  }
  return context
}

// Enhanced managed drawer component
export function ManagedDrawer({ 
  open, 
  onOpenChange, 
  config, 
  trigger, 
  children, 
  className 
}: ManagedDrawerProps) {
  const drawerId = React.useId()
  const { registerDrawer, unregisterDrawer } = useDrawerManager()

  // Register drawer on mount
  React.useEffect(() => {
    registerDrawer(drawerId, config)
    return () => unregisterDrawer(drawerId)
  }, [drawerId, config, registerDrawer, unregisterDrawer])

  // Handle open change with haptic feedback
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (config.hapticFeedback !== false) {
      if (newOpen) {
        hapticFeedback.drawerOpen()
      } else {
        hapticFeedback.drawerClose()
      }
    }
    onOpenChange(newOpen)
  }, [config.hapticFeedback, onOpenChange])

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
      )}
      <DrawerContent 
        className={cn(className, config.className)}
        data-drawer-type={config.type}
      >
        {(config.title || config.description) && (
          <DrawerHeader>
            {config.title && <DrawerTitle>{config.title}</DrawerTitle>}
            {config.description && <DrawerDescription>{config.description}</DrawerDescription>}
          </DrawerHeader>
        )}
        {children}
        {config.showCloseButton && (
          <DrawerClose className="absolute right-4 top-4" />
        )}
      </DrawerContent>
    </Drawer>
  )
}

// Predefined drawer configurations
export const DRAWER_CONFIGS = {
  addTransaction: {
    type: 'form' as DrawerType,
    title: 'Add New Transaction',
    hapticFeedback: true,
    preventAutoClose: true
  },
  editTransaction: {
    type: 'form' as DrawerType,
    title: 'Edit Transaction',
    hapticFeedback: true,
    preventAutoClose: true
  },
  wallet: {
    type: 'list' as DrawerType,
    title: 'Wallet',
    hapticFeedback: true
  },
  settings: {
    type: 'list' as DrawerType,
    title: 'Settings',
    hapticFeedback: true
  },
  reports: {
    type: 'details' as DrawerType,
    title: 'Reports',
    hapticFeedback: true
  },
  recurring: {
    type: 'list' as DrawerType,
    title: 'Recurring Transactions',
    hapticFeedback: true
  }
} as const

// Utility hooks for common drawer patterns
export function useDrawerState(initialOpen = false) {
  const [open, setOpen] = React.useState(initialOpen)
  
  const openDrawer = React.useCallback(() => {
    hapticFeedback.drawerOpen()
    setOpen(true)
  }, [])
  
  const closeDrawer = React.useCallback(() => {
    hapticFeedback.drawerClose()
    setOpen(false)
  }, [])
  
  const toggleDrawer = React.useCallback(() => {
    setOpen(prev => {
      if (!prev) {
        hapticFeedback.drawerOpen()
      } else {
        hapticFeedback.drawerClose()
      }
      return !prev
    })
  }, [])
  
  return {
    open,
    setOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer
  }
}

// Performance optimized drawer wrapper
export const OptimizedDrawer = React.memo(ManagedDrawer)

// Export all drawer components for consistency
export {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
}