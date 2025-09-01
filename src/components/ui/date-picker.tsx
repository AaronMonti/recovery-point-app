"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDownIcon, Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  label,
  placeholder = "Seleccionar fecha",
  className,
  disabled = false,
  required = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(date)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    if (selectedDate) {
      setOpen(false)
    }
  }

  const handleMonthChange = (newMonth: Date | undefined) => {
    setMonth(newMonth)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label htmlFor="date-picker" className="px-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker"
            disabled={disabled}
            data-empty={!date}
            className={cn(
              "w-full justify-between font-normal",
              "data-[empty=true]:text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {date ? (
                format(date, "dd/MM/yyyy", { locale: es })
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            captionLayout="dropdown"
            month={month}
            onMonthChange={handleMonthChange}
            locale={es}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
