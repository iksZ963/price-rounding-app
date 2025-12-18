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
          // If empty or just starting, prepend "0."
          setPrice((prev) => (prev === "" ? "0." : prev + "."))
        }
      } else {
        setPrice((prev) => prev + value)
      }
    } else if (activeInput === "tax") {
      if (value === "backspace") {
        setTaxRate((prev) => prev.slice(0, -1))
      } else if (value === ".") {
        if (!taxRate.includes(".")) {
          // If empty or just starting, prepend "0."
          setTaxRate((prev) => (prev === "" ? "0." : prev + "."))
        }
      } else {
        const newValue = taxRate + value
        const numValue = Number.parseFloat(newValue)
        // Allow the input if it's valid and <= 20, or if it's an incomplete number
        if (!isNaN(numValue) && numValue <= 20) {
          setTaxRate(newValue)
        } else if (newValue.endsWith(".") || /^\d+\.?\d*$/.test(newValue)) {
          // Allow incomplete decimals like "1."
          setTaxRate(newValue)
        }
      }
    }
  }

  return (
    <TooltipProvider>
      <div className="relative flex h-screen w-full max-w-[480px] mx-auto flex-col bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="flex bg-white dark:bg-zinc-900 px-4 sm:px-6 py-2 sm:py-3 md:py-4 z-10 border-zinc-100 dark:border-zinc-800 items-center justify-center border-b">
          <h2 className="text-zinc-900 dark:text-white text-base sm:text-lg md:text-xl font-bold leading-tight tracking-tight text-center">
            Penny Rounding Calculator
          </h2>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col px-4 sm:px-6 pt-3 sm:pt-4 md:pt-6 pb-3 sm:pb-4 md:pb-6">
          {/* Tax Rate Input */}
          <div className="mb-2 sm:mb-3 md:mb-4">
            <label className="text-[10px] sm:text-xs font-bold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase mb-1 sm:mb-1.5 block">
              Tax Rate
            </label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                onFocus={() => setActiveInput("tax")}
                readOnly
                className={`h-8 sm:h-10 md:h-12 text-sm sm:text-base md:text-lg pr-10 sm:pr-12 bg-white dark:bg-zinc-800 border-2 rounded-lg font-semibold shadow-sm cursor-pointer transition-all ${
                  activeInput === "tax"
                    ? "border-emerald-500 ring-2 ring-emerald-500/30"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              />
              <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-sm sm:text-base md:text-lg font-semibold text-zinc-400 pointer-events-none">%</span>
            </div>
          </div>

          {/* Pre-Tax Price - Large Display Style */}
          <div className="flex flex-col items-center justify-center py-2 sm:py-3 md:py-4 mb-2 sm:mb-3 md:mb-4">
            <label className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-1.5 sm:mb-2 md:mb-3">
              Pre-Tax Amount
            </label>
            <div
              className={`relative w-full rounded-xl p-1.5 sm:p-2 md:p-3 transition-all cursor-pointer ${
                activeInput === "price"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/50"
                  : "bg-transparent"
              }`}
              onClick={() => setActiveInput("price")}
            >
              <div className="flex items-baseline justify-center gap-1 sm:gap-1.5 md:gap-2">
                <span className="text-xl sm:text-3xl md:text-4xl font-semibold text-zinc-400 dark:text-zinc-500 self-start mt-0.5 sm:mt-1 md:mt-1.5">$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onFocus={() => setActiveInput("price")}
                  readOnly
                  className="text-2xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight border-0 bg-transparent p-0 h-auto text-center focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="mb-2 sm:mb-3 md:mb-4">
            <div className="flex justify-between items-center px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Tax ({(Number.parseFloat(taxRate) || 0).toFixed(2)}%)
                </span>
                <span className="text-sm sm:text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  +${calculations.taxAmount.toFixed(2)}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 sm:h-10 md:h-12 w-px bg-zinc-200 dark:bg-zinc-700 cursor-help"></div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[260px] bg-zinc-900 text-white border-zinc-700 p-3">
                  <p className="font-bold mb-2 text-xs">Swedish Rounding Rules</p>
                  <div className="space-y-1.5 text-[10px]">
                    <p>
                      <span className="text-red-400 font-semibold">Round Down:</span> ends in 1, 2, 6, 7
                    </p>
                    <p>
                      <span className="text-green-400 font-semibold">Round Up:</span> ends in 3, 4, 8, 9
                    </p>
                    <p className="text-zinc-400 pt-1.5 border-t border-zinc-700">Ends in 0 or 5 stay exact</p>
                  </div>
                </TooltipContent>
              </Tooltip>
              <div className="flex flex-col items-end">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Subtotal
                </span>
                <span className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  ${calculations.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center gap-2 sm:gap-3 md:gap-4 opacity-60 mb-2 sm:mb-3 md:mb-4">
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
            <span className="text-[9px] sm:text-[10px] md:text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Rounded Prices
            </span>
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 flex-1"></div>
          </div>

          {/* Success Message */}
          {calculations.subtotal > 0 && calculations.direction === "none" && (
            <div className="mb-2 sm:mb-3 md:mb-4 p-3 sm:p-4 md:p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
              <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-2 sm:mb-2.5 md:mb-3">
                <svg className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-400">Perfect!</p>
              <p className="text-xs sm:text-sm md:text-base text-emerald-600 dark:text-emerald-500">No rounding needed</p>
            </div>
          )}

          {/* Suggestion Cards */}
          {!(calculations.subtotal > 0 && calculations.direction === "none") && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
              {/* Seller Card - Left Side, Green */}
              <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm border-2 border-zinc-100 dark:border-zinc-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 sm:w-1.5 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-2.5 md:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <Store className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Seller
                    </span>
                  </div>
                  {calculations.sellerSuggestion?.skipped && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-colors">
                          <AlertCircle className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-700">
                        <p className="text-[10px] font-semibold">Next reachable nickel</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-2 sm:mb-2.5 md:mb-3">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Set pre-tax to
                    </span>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                      <span className="text-base sm:text-lg md:text-xl text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {calculations.sellerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-2 sm:pt-2.5 md:pt-3 border-t border-zinc-100 dark:border-zinc-700">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      After-tax total
                    </span>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                      ${calculations.sellerSuggestion?.total.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Card - Right Side, Blue */}
              <div className="flex flex-col bg-white dark:bg-zinc-800 rounded-xl p-3 sm:p-4 md:p-5 shadow-sm border-2 border-zinc-100 dark:border-zinc-700 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 sm:w-1.5 h-full bg-blue-500"></div>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-2.5 md:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Users className="w-3 sm:w-4 md:w-5 h-3 sm:h-4 md:h-5" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Customer
                    </span>
                  </div>
                  {calculations.customerSuggestion?.skipped && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-colors">
                          <AlertCircle className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-700">
                        <p className="text-[10px] font-semibold">Previous reachable nickel</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="mb-2 sm:mb-2.5 md:mb-3">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Set pre-tax to
                    </span>
                    <div className="flex items-baseline gap-0.5 sm:gap-1">
                      <span className="text-base sm:text-lg md:text-xl text-blue-600 dark:text-blue-400 font-bold">$</span>
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {calculations.customerSuggestion?.preTax.toFixed(2) ?? "0.00"}
                      </h3>
                    </div>
                  </div>
                  <div className="pt-2 sm:pt-2.5 md:pt-3 border-t border-zinc-100 dark:border-zinc-700">
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      After-tax total
                    </span>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-500">
                      ${calculations.customerSuggestion?.total.toFixed(2) ?? "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mt-auto">
            {/* Row 1 */}
            <button
              onClick={() => handleKeypadInput("1")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              1
            </button>
            <button
              onClick={() => handleKeypadInput("2")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              2
            </button>
            <button
              onClick={() => handleKeypadInput("3")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              3
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleKeypadInput("4")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              4
            </button>
            <button
              onClick={() => handleKeypadInput("5")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              5
            </button>
            <button
              onClick={() => handleKeypadInput("6")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              6
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleKeypadInput("7")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              7
            </button>
            <button
              onClick={() => handleKeypadInput("8")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              8
            </button>
            <button
              onClick={() => handleKeypadInput("9")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              9
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleKeypadInput(".")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              .
            </button>
            <button
              onClick={() => handleKeypadInput("0")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold text-lg sm:text-xl md:text-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
            >
              0
            </button>
            <button
              onClick={() => handleKeypadInput("backspace")}
              className="h-11 sm:h-14 md:h-16 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-lg sm:text-xl md:text-2xl hover:bg-red-100 dark:hover:bg-red-950/40 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              <svg className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
