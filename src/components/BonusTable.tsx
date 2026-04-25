import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/kpiUtils'
import type { BonusLineItem } from '@/lib/utils/bonusUtils'

interface BonusTableProps {
  items: BonusLineItem[]
  total: number
  footnote?: string
  className?: string
}

export function BonusTable({ items, total, footnote, className }: BonusTableProps) {
  if (items.length === 0) {
    return (
      <div className={cn('text-center py-8 text-[#9B9B9B] text-sm', className)}>
        No bonus items yet. Update your numbers below.
      </div>
    )
  }

  return (
    <div className={className}>
      <table className="w-full">
        <colgroup>
          <col className="w-auto" />
          <col className="w-[80px]" />
          <col className="w-[110px]" />
          <col className="w-[100px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#E8E8E8]">
            <th className="text-left text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide pb-2.5"></th>
            <th className="text-right text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide pb-2.5">Count</th>
            <th className="text-right text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide pb-2.5">Rate</th>
            <th className="text-right text-[11px] font-medium text-[#9B9B9B] uppercase tracking-wide pb-2.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.key}>
              <td className="py-2.5 text-[14px] text-[#0E0E0E]">{item.label}</td>
              <td className="py-2.5 text-right text-[14px] tabular-nums text-[#0E0E0E]">
                {item.count}
              </td>
              <td className="py-2.5 text-right text-[13px] tabular-nums text-[#6B6B6B]">
                {item.rateDisplay}
              </td>
              <td className="py-2.5 text-right text-[14px] tabular-nums font-medium text-[#0E0E0E]">
                {formatCurrency(item.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#E8E8E8]">
            <td colSpan={3} className="pt-3 pb-1 text-[14px] font-semibold text-[#0E0E0E] text-right pr-4">
              Total
            </td>
            <td className="pt-3 pb-1 text-right text-[18px] tabular-nums font-semibold text-[#0E0E0E]">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {footnote && (
        <p className="mt-3 text-[12px] text-[#9B9B9B]">{footnote}</p>
      )}
    </div>
  )
}
