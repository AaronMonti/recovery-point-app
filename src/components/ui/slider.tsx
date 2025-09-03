"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, min = 0, max = 10, step = 1, className, disabled = false }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const sliderRef = React.useRef<HTMLDivElement>(null)

    const percentage = ((value - min) / (max - min)) * 100

    const updateValue = React.useCallback((clientX: number) => {
      if (!sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const newValue = Math.round((percentage * (max - min) + min) / step) * step
      onValueChange(Math.max(min, Math.min(max, newValue)))
    }, [max, min, step, onValueChange])

    const handlePointerDown = (e: React.PointerEvent) => {
      if (disabled) return
      setIsDragging(true)
      updateValue(e.clientX)
      e.preventDefault()
    }

    const handlePointerMove = React.useCallback((e: PointerEvent) => {
      if (isDragging && !disabled) {
        updateValue(e.clientX)
        e.preventDefault()
      }
    }, [isDragging, disabled, updateValue])

    const handlePointerUp = React.useCallback(() => {
      setIsDragging(false)
    }, [])

    const handleClick = (e: React.MouseEvent) => {
      if (disabled || isDragging) return
      updateValue(e.clientX)
    }

    React.useEffect(() => {
      if (isDragging) {
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
        document.addEventListener('pointercancel', handlePointerUp)
        return () => {
          document.removeEventListener('pointermove', handlePointerMove)
          document.removeEventListener('pointerup', handlePointerUp)
          document.removeEventListener('pointercancel', handlePointerUp)
        }
      }
    }, [isDragging, handlePointerMove, handlePointerUp])

    return (
      <div ref={ref} className={cn("relative", className)}>
        <div
          ref={sliderRef}
          className={cn(
            "relative w-full h-8 bg-muted rounded-full cursor-pointer touch-none select-none md:h-6",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-muted rounded-full" />
          
          {/* Fill */}
          <div
            className="absolute h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
          
          {/* Thumb */}
          <div
            className={cn(
              "absolute top-1/2 w-8 h-8 bg-primary border-4 border-background rounded-full transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 shadow-lg md:w-6 md:h-6",
              isDragging && "scale-110",
              !disabled && "hover:scale-105 active:scale-110"
            )}
            style={{ left: `${percentage}%` }}
          />
          
          {/* Scale markers */}
          <div className="absolute -bottom-6 w-full flex justify-between">
            {Array.from({ length: max - min + 1 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "text-xs text-muted-foreground transition-colors",
                  value === i + min && "text-primary font-semibold"
                )}
              >
                {i + min}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }
