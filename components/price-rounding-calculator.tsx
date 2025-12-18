"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { HelpCircle, Store, Users, AlertCircle } from "lucide-react"
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

export default function PriceRoundingCalculator() {
  const [price, setPrice] = useState("")
  const [taxRate, setTaxRate] = useState("")

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

  return (
    <TooltipProvider>
      <div className="relative flex h-full w-full max-w-[480px] mx-auto flex-col bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl sm:my-4 sm:rounded-3xl border border-zinc-100 dark:border-zinc-800">
        {/* Header */}
        <div className="flex bg-white dark:bg-zinc-900 p-4 z-10 border-zinc-100 dark:border-zinc-800 pt-4 pb-2 items-center justify-center border-b opacity-100">
          <h2 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-tight text-center">
            Penny Rounding Calculator
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto">
          {/* Tax Rate Input */}
          <div className="mb-4">
            <label className="text-xs font-bold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-2 block">
              Tax Rate
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="20"
                placeholder="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="h-14 text-xl pr-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-zinc-400">%</span>
            </div>
          </div>

          {/* Pre-Tax Price - Large Display Style */}
          <style jsx>{`
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
          `}</style>

          <div className="flex flex-col items-center justify-center py-8 mb-6">
            <label className="text-xs font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-4">
              Pre-Tax Amount
            </label>
            <div className="relative w-full">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-semibold text-zinc-400 dark:text-zinc-500 self-start mt-5">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-6xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight border-0 bg-transparent p-0 h-auto text-center focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Tax ({(Number.parseFloat(taxRate) || 0).toFixed(2)}%)
                </span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  +${calculations.taxAmount.toFixed(2)}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-700 cursor-help"></div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] bg-zinc-900 text-white border-zinc-700 p-4">
                  <p className="font-bold mb-3 text-sm">Swedish Rounding Rules</p>
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-red-400 font-semibold">Round Down:</span> ends in 1, 2, 6, 7
                    </p>
                    <p>
                      <span className="text-green-400 font-semibold">Round Up:</span> ends in 3, 4, 8, 9
                    </p>
                    <p className="text-zinc-400 pt-2 border-t border-zinc-700">Ends in 0 or 5 stay exact</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Subtotal
                </span>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  ${calculations.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 opacity-60 mb-6">
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
            <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              Rounded Prices
            </span>
            <div className="flex size-12 items-center justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    <HelpCircle className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px] bg-zinc-900 text-white border-zinc-700 p-4">
                  <p className="font-bold mb-3 text-sm">Swedish Rounding Rules</p>
                  <div className="space-y-2 text-xs">
                    <p>
                      <span className="text-red-400 font-semibold">Round Down:</span> ends in 1, 2, 6, 7
                    </p>
                    <p>
                      <span className="text-green-400 font-semibold">Round Up:</span> ends in 3, 4, 8, 9
                    </p>
                    <p className="text-zinc-400 pt-2 border-t border-zinc-700">Ends in 0 or 5 stay exact</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
          </div>

          {/* Success Message */}
          {calculations.subtotal > 0 && calculations.direction === "none" && (
            <div className="mb-6 p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Perfect!</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">No rounding needed</p>
            </div>
          )}

          {/* Suggestion Cards */}
          <div className="grid grid-cols-2 gap-3 flex-1 content-start">
            {/* Seller Card - Left Side, Green */}
            <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 transition-all group-hover:w-1.5"></div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Seller
                  </span>
                </div>
                {calculations.sellerSuggestion?.skipped && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-colors">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-700">
                      <p className="text-xs font-semibold">Next reachable nickel</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="mt-auto space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Set pre-tax to</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-base text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                    <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      {calculations.sellerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                    </h3>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">After-tax total</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500 mt-0.5">
                    ${calculations.sellerSuggestion?.total.toFixed(2) ?? "0.00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Card - Right Side, Blue */}
            <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-700 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 transition-all group-hover:w-1.5"></div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Customer
                  </span>
                </div>
                {calculations.customerSuggestion?.skipped && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-colors">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-700">
                      <p className="text-xs font-semibold">Previous reachable nickel</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="mt-auto space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Set pre-tax to</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-base text-blue-600 dark:text-blue-400 font-bold">$</span>
                    <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      {calculations.customerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                    </h3>
                  </div>
                </div>
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">After-tax total</span>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-500 mt-0.5">
                    ${calculations.customerSuggestion?.total.toFixed(2) ?? "0.00"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
