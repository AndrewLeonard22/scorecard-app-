'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getCurrentMonth,
  getMonthLabel,
  prevMonth,
  nextMonth,
  isFutureMonth,
} from '@/lib/utils/monthUtils'

interface MonthPickerProps {
  selected: string // 'YYYY-MM'
  monthsWithData?: string[] // list of months that have data
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MonthPicker({ selected, monthsWithData = [] }: MonthPickerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => parseInt(selected.split('-')[0]))
  const ref = useRef<HTMLDivElement>(null)
  const currentMonth = getCurrentMonth()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function navigate(month: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', month)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSelect(month: string) {
    if (isFutureMonth(month)) return
    navigate(month)
    setOpen(false)
  }

  function handlePrev() {
    navigate(prevMonth(selected))
  }

  function handleNext() {
    if (!isFutureMonth(nextMonth(selected))) {
      navigate(nextMonth(selected))
    }
  }

  const [selYear] = selected.split('-').map(Number)
  const isNextFuture = isFutureMonth(nextMonth(selected))

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-0.5">
        <button
          onClick={handlePrev}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#F1F1F1] transition-colors text-[#6B6B6B] hover:text-[#0E0E0E]"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => { setOpen(!open); setCalYear(selYear) }}
          className="h-8 px-3 rounded-md hover:bg-[#F1F1F1] transition-colors text-sm font-medium text-[#0E0E0E] min-w-[120px] text-center"
        >
          {getMonthLabel(selected)}
        </button>

        <button
          onClick={handleNext}
          disabled={isNextFuture}
          className={cn(
            'h-8 w-8 flex items-center justify-center rounded-md transition-colors',
            isNextFuture
              ? 'text-[#E8E8E8] cursor-not-allowed'
              : 'hover:bg-[#F1F1F1] text-[#6B6B6B] hover:text-[#0E0E0E]'
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-[#E8E8E8] rounded-xl shadow-lg p-3 w-56">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalYear(y => y - 1)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F1F1] text-[#6B6B6B]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold text-[#0E0E0E]">{calYear}</span>
            <button
              onClick={() => setCalYear(y => y + 1)}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F1F1] text-[#6B6B6B]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Month grid: 3 cols × 4 rows */}
          <div className="grid grid-cols-3 gap-1">
            {MONTH_NAMES.map((name, i) => {
              const monthStr = `${calYear}-${String(i + 1).padStart(2, '0')}`
              const isCurrent = monthStr === currentMonth
              const isSelected = monthStr === selected
              const isFuture = isFutureMonth(monthStr)
              const hasData = monthsWithData.includes(monthStr)

              return (
                <button
                  key={name}
                  onClick={() => handleSelect(monthStr)}
                  disabled={isFuture}
                  className={cn(
                    'h-8 rounded-lg text-xs font-medium transition-colors',
                    isCurrent && !isSelected
                      ? 'border border-[#1FA6F5] text-[#1FA6F5]'
                      : '',
                    isSelected
                      ? 'bg-[#1FA6F5] text-white'
                      : isFuture
                        ? 'text-[#E8E8E8] cursor-not-allowed'
                        : hasData
                          ? 'text-[#0E0E0E] hover:bg-[#F1F1F1]'
                          : 'text-[#9B9B9B] hover:bg-[#F1F1F1]'
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>

          {/* Jump to current */}
          {selected !== currentMonth && (
            <button
              onClick={() => handleSelect(currentMonth)}
              className="mt-3 w-full text-xs text-[#1FA6F5] hover:underline text-center"
            >
              Jump to current month
            </button>
          )}
        </div>
      )}
    </div>
  )
}
