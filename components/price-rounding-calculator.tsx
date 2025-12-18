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
  const [activeInput, setActiveInput] = useState<"price" | "tax" | null>("price")

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

  const handleKeypadInput = (value: string) => {
    if (activeInput === "price") {
      if (value === "backspace") {
        setPrice((prev) => prev.slice(0, -1))
      } else if (value === ".") {
        if (!price.includes(".")) {
          setPrice((prev) => prev + value)
        }
      } else {
        setPrice((prev) => prev + value)
      }
    } else if (activeInput === "tax") {
      if (value === "backspace") {
        setTaxRate((prev) => prev.slice(0, -1))
      } else if (value === ".") {
        if (!taxRate.includes(".")) {
          setTaxRate((prev) => prev + value)
        }
      } else {
        const newValue = taxRate + value
        if (Number.parseFloat(newValue) <= 20) {
          setTaxRate(newValue)
        }
      }
    }
  }

  return (
    <TooltipProvider>
      <div className="relative flex h-screen max-h-[667px] w-full max-w-[480px] mx-auto flex-col bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl sm:rounded-3xl border border-zinc-100 dark:border-zinc-800">
        {/* Header */}
        <div className="flex bg-white dark:bg-zinc-900 px-4 py-2 z-10 border-zinc-100 dark:border-zinc-800 items-center justify-center border-b">
          <h2 className="text-zinc-900 dark:text-white text-base font-bold leading-tight tracking-tight text-center">
            Penny Rounding Calculator
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-4 pt-2 pb-2">
          {/* Tax Rate Input */}
          <div className="mb-2">
            <label className="text-[10px] font-bold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-1 block">
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
                onFocus={() => setActiveInput("tax")}
                readOnly
                className={`h-8 text-sm pr-10 bg-white dark:bg-zinc-800 border-2 rounded-lg font-semibold shadow-sm cursor-pointer transition-all ${
                  activeInput === "tax"
                    ? "border-emerald-500 ring-2 ring-emerald-500/30"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400 pointer-events-none">%</span>
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

          <div className="flex flex-col items-center justify-center py-3 mb-2">
            <label className="text-[10px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-2">
              Pre-Tax Amount
            </label>
            <div
              className={`relative w-full rounded-xl p-2 transition-all cursor-pointer ${
                activeInput === "price"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50"
                  : "bg-transparent"
              }`}
              onClick={() => setActiveInput("price")}
            >
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-semibold text-zinc-400 dark:text-zinc-500 self-start mt-1">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={() => setActiveInput("price")}
                  readOnly
                  className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight border-0 bg-transparent p-0 h-auto text-center focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="mb-2">
            <div className="flex justify-between items-center px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Tax ({(Number.parseFloat(taxRate) || 0).toFixed(2)}%)
                </span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  +${calculations.taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Subtotal
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                  ${calculations.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-2 opacity-60 mb-2">
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
            <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Rounded Prices
            </span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
          </div>

          {/* Success Message */}
          {calculations.subtotal > 0 && calculations.direction === "none" && (
            <div className="mb-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Perfect!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">No rounding needed</p>
            </div>
          )}

          {/* Suggestion Cards */}
          {!(calculations.subtotal > 0 && calculations.direction === "none") && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Seller Card - Left Side, Green */}
              <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm border-2 border-zinc-100 dark:border-zinc-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Store className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Seller
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-2">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Set pre-tax to
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                      <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {calculations.sellerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      After-tax total
                    </span>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-500">
                      ${calculations.sellerSuggestion?.total.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Card - Right Side, Blue */}
              <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-xl p-3 shadow-sm border-2 border-zinc-100 dark:border-zinc-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Users className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Customer
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-2">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      Set pre-tax to
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg text-blue-600 dark:text-blue-400 font-bold">$</span>
                      <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {calculations.customerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-700">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                      After-tax total
                    </span>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-500">
                      ${calculations.customerSuggestion?.total.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 mt-auto">
            {/* Row 1 */}
            <button
              onClick={() => handleKeypadInput("1")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              1
            </button>
            <button
              onClick={() => handleKeypadInput("2")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              2
            </button>
            <button
              onClick={() => handleKeypadInput("3")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              3
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleKeypadInput("4")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              4
            </button>
            <button
              onClick={() => handleKeypadInput("5")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              5
            </button>
            <button
              onClick={() => handleKeypadInput("6")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              6
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleKeypadInput("7")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              7
            </button>
            <button
              onClick={() => handleKeypadInput("8")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              8
            </button>
            <button
              onClick={() => handleKeypadInput("9")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              9
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleKeypadInput(".")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              .
            </button>
            <button
              onClick={() => handleKeypadInput("0")}
              className="h-12 rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button
              onClick={() => handleKeypadInput("backspace")}
              className="h-12 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xl hover:bg-red-100 dark:hover:bg-red-950/40 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
