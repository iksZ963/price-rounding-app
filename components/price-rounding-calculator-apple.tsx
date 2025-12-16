"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, Store, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function roundToNickel(amount: number): { rounded: number; direction: "up" | "down" | "none" } {
  const cents = Math.round(amount * 100)
  const lastDigit = cents % 10

  let roundedCents: number
  let direction: "up" | "down" | "none"

  if (lastDigit === 0 || lastDigit === 5) {
    roundedCents = cents
    direction = "none"
  } else if (lastDigit === 1 || lastDigit === 2 || lastDigit === 6 || lastDigit === 7) {
    roundedCents = cents - lastDigit + (lastDigit > 5 ? 5 : 0)
    direction = "down"
  } else {
    roundedCents = cents - lastDigit + (lastDigit > 5 ? 10 : 5)
    direction = "up"
  }

  return { rounded: roundedCents / 100, direction }
}

function findReachableNickel(
  startNickel: number,
  taxRate: number,
  direction: "up" | "down",
): { preTax: number; total: number; skipped: boolean } | null {
  const step = direction === "up" ? 0.05 : -0.05
  const maxAttempts = 20

  for (let i = 0; i < maxAttempts; i++) {
    const targetNickel = startNickel + step * i

    if (targetNickel <= 0) return null

    const approxPreTax = targetNickel / (1 + taxRate / 100)

    for (let offset = -100; offset <= 100; offset++) {
      const candidatePreTax = Math.round(approxPreTax * 100 + offset) / 100
      if (candidatePreTax <= 0) continue

      const candidateTotal = candidatePreTax * (1 + taxRate / 100)
      const { rounded, direction: roundDirection } = roundToNickel(candidateTotal)

      if (roundDirection === "none" && Math.abs(rounded - targetNickel) < 0.001) {
        return { preTax: candidatePreTax, total: targetNickel, skipped: i > 0 }
      }
    }
  }

  return null
}

function calculateSuggestions(preTax: number, taxRate: number) {
  const total = preTax * (1 + taxRate / 100)
  const { rounded, direction } = roundToNickel(total)

  if (direction === "none") {
    return { seller: null, customer: null }
  }

  let sellerStartNickel: number
  let customerStartNickel: number

  if (direction === "down") {
    customerStartNickel = rounded
    sellerStartNickel = rounded + 0.05
  } else {
    sellerStartNickel = rounded
    customerStartNickel = rounded - 0.05
  }

  const sellerSuggestion = findReachableNickel(sellerStartNickel, taxRate, "up")
  const customerSuggestion = findReachableNickel(customerStartNickel, taxRate, "down")

  return {
    seller: sellerSuggestion,
    customer: customerSuggestion,
  }
}

export function PriceRoundingCalculatorApple() {
  const [price, setPrice] = useState("")
  const [taxRate, setTaxRate] = useState("7")

  const calculations = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0
    const taxRateNum = Number.parseFloat(taxRate) || 0
    const taxAmount = priceNum * (taxRateNum / 100)
    const total = priceNum + taxAmount
    const { rounded, direction } = roundToNickel(total)
    const difference = rounded - total

    const suggestions = priceNum > 0 ? calculateSuggestions(priceNum, taxRateNum) : { seller: null, customer: null }

    return {
      subtotal: priceNum,
      taxAmount,
      total,
      rounded,
      direction,
      difference,
      sellerSuggestion: suggestions.seller,
      customerSuggestion: suggestions.customer,
    }
  }, [price, taxRate])

  const hasValidPrice = Number.parseFloat(price) > 0

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {/* Input Section - Apple Style with subtle shadows and rounded corners */}
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-5">
          {/* Tax Rate Input */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Label htmlFor="tax-rate" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tax Rate
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                    <Info className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] bg-zinc-800 text-white border-zinc-700">
                  <p className="font-semibold mb-2">Swedish Rounding Rules</p>
                  <p className="text-xs mb-1">
                    <span className="text-red-400 font-semibold">Round Down:</span> ends in 1, 2, 6, 7
                  </p>
                  <p className="text-xs">
                    <span className="text-green-400 font-semibold">Round Up:</span> ends in 3, 4, 8, 9
                  </p>
                  <p className="text-xs mt-2 text-zinc-400">Ends in 0 or 5 stay exact</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                id="tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="20"
                placeholder="7"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="h-14 text-xl pr-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-xl font-medium focus-visible:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-zinc-400">%</span>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="price" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 block">
              Pre-Tax Price
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-12 h-16 text-2xl font-semibold bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded-xl focus-visible:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Breakdown - Apple Style */}
        {hasValidPrice && (
          <>
            <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Subtotal: <span className="font-medium">${calculations.subtotal.toFixed(2)}</span>
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Tax: <span className="font-medium">+${calculations.taxAmount.toFixed(2)}</span>
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  Total: ${calculations.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Success Message - Apple Style */}
            {calculations.direction === "none" && (
              <div className="p-6 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-900 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">Perfect!</p>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  No rounding needed ${calculations.rounded.toFixed(2)}
                </p>
              </div>
            )}
          </>
        )}

        {/* Suggestions - Apple Style */}
        {hasValidPrice && calculations.direction !== "none" && (
          <div className="grid grid-cols-2 gap-3">
            {/* Seller Suggestion */}
            {calculations.sellerSuggestion && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">SELLER</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Set pre-tax to:</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      ${calculations.sellerSuggestion.preTax.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">After-tax total:</p>
                    <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-500">
                      ${calculations.sellerSuggestion.total.toFixed(2)}
                    </p>
                  </div>
                  {calculations.sellerSuggestion.skipped && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Next reachable nickel
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Customer Suggestion */}
            {calculations.customerSuggestion && (
              <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">CUSTOMER</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Set pre-tax to:</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      ${calculations.customerSuggestion.preTax.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">After-tax total:</p>
                    <p className="text-xl font-semibold text-blue-600 dark:text-blue-500">
                      ${calculations.customerSuggestion.total.toFixed(2)}
                    </p>
                  </div>
                  {calculations.customerSuggestion.skipped && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Previous reachable nickel
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
