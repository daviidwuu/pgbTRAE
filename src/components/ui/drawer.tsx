
"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { useIOSKeyboard } from "@/lib/ios-keyboard-handler"

import { cn } from "@/shared/utils";

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const keyboardState = useIOSKeyboard();
  
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        data-vaul-drawer
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[var(--radius)] bg-background",
          // Fix for mobile keyboard: use viewport units and safe area insets
          "max-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top))]",
          "transform-none transition-transform duration-300 ease-out",
          className
        )}
        style={{
          // iOS PWA keyboard handling
          position: 'fixed',
          bottom: keyboardState.isVisible ? keyboardState.offset : 0,
          transform: 'none',
          // Smooth transition for keyboard appearance
          transition: 'transform 0.3s ease-out, bottom 0.3s ease-out',
          // Ensure content doesn't exceed viewport
          maxHeight: keyboardState.isVisible 
            ? `calc(100dvh - ${keyboardState.offset}px - env(safe-area-inset-top) - env(safe-area-inset-bottom))`
            : 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        }}
        {...props}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />

        <div 
          data-vaul-drawer-wrapper 
          className="flex-1 min-h-0"
          style={{
            // Ensure content area respects keyboard
            maxHeight: keyboardState.isVisible 
              ? `calc(100dvh - ${keyboardState.offset}px - 8rem)` // Account for header/footer space
              : 'calc(100dvh - 8rem)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 pt-[calc(env(safe-area-inset-top))] text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const keyboardState = useIOSKeyboard();
  
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]", className)}
      style={{
        // Ensure footer stays above keyboard and home indicator
        paddingBottom: keyboardState.isVisible 
          ? `calc(${keyboardState.offset}px + env(safe-area-inset-bottom) + 1rem)`
          : 'calc(env(safe-area-inset-bottom) + 1rem)',
        transition: 'padding-bottom 0.3s ease-out',
      }}
      {...props}
    />
  );
};
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

    