"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowDown, ArrowUp, Minus, Info, Store, Users } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const US_STATE_TAX_RATES = [
  { state: "Alabama", rate: 4.0 },
  { state: "Alaska", rate: 0.0 },
  { state: "Arizona", rate: 5.6 },
  { state: "Arkansas", rate: 6.5 },
  { state: "California", rate: 7.25 },
  { state: "Colorado", rate: 2.9 },
  { state: "Connecticut", rate: 6.35 },
  { state: "Delaware", rate: 0.0 },
  { state: "Florida", rate: 6.0 },
  { state: "Georgia", rate: 4.0 },
  { state: "Hawaii", rate: 4.0 },
  { state: "Idaho", rate: 6.0 },
  { state: "Illinois", rate: 6.25 },
  { state: "Indiana", rate: 7.0 },
  { state: "Iowa", rate: 6.0 },
  { state: "Kansas", rate: 6.5 },
  { state: "Kentucky", rate: 6.0 },
  { state: "Louisiana", rate: 5.0 },
  { state: "Maine", rate: 5.5 },
  { state: "Maryland", rate: 6.0 },
  { state: "Massachusetts", rate: 6.25 },
  { state: "Michigan", rate: 6.0 },
  { state: "Minnesota", rate: 6.875 },
  { state: "Mississippi", rate: 7.0 },
  { state: "Missouri", rate: 4.225 },
  { state: "Montana", rate: 0.0 },
  { state: "Nebraska", rate: 5.5 },
  { state: "Nevada", rate: 6.85 },
  { state: "New Hampshire", rate: 0.0 },
  { state: "New Jersey", rate: 6.625 },
  { state: "New Mexico", rate: 4.875 },
  { state: "New York", rate: 4.0 },
  { state: "North Carolina", rate: 4.75 },
  { state: "North Dakota", rate: 5.0 },
  { state: "Ohio", rate: 5.75 },
  { state: "Oklahoma", rate: 4.5 },
  { state: "Oregon", rate: 0.0 },
  { state: "Pennsylvania", rate: 6.0 },
  { state: "Rhode Island", rate: 7.0 },
  { state: "South Carolina", rate: 6.0 },
  { state: "South Dakota", rate: 4.2 },
  { state: "Tennessee", rate: 7.0 },
  { state: "Texas", rate: 6.25 },
  { state: "Utah", rate: 4.85 },
  { state: "Vermont", rate: 6.0 },
  { state: "Virginia", rate: 4.3 },
  { state: "Washington", rate: 6.5 },
  { state: "West Virginia", rate: 6.0 },
  { state: "Wisconsin", rate: 5.0 },
  { state: "Wyoming", rate: 4.0 },
]

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

function calculateNoLossPreTaxPrice(currentPreTax: number, taxRate: number): number {
  const total = currentPreTax * (1 + taxRate / 100)
  const { rounded, direction } = roundToNickel(total)

  if (direction !== "down") return currentPreTax

  // Find the next nickel up from rounded amount
  const targetTotal = rounded + 0.05
  // Calculate pre-tax price needed to hit that target
  const requiredPreTax = targetTotal / (1 + taxRate / 100)
  // Round up to nearest cent
  return Math.ceil(requiredPreTax * 100) / 100
}

function calculateExactPreTaxPrice(currentPreTax: number, taxRate: number): { preTax: number; total: number } | null {
  const total = currentPreTax * (1 + taxRate / 100)
  const { direction } = roundToNickel(total)

  if (direction !== "up") return null

  // Search upward from current price to find a pre-tax that lands exactly on a nickel
  for (let i = 1; i <= 50; i++) {
    const candidatePreTax = (Math.ceil(currentPreTax * 100) + i) / 100

    const candidateTotal = candidatePreTax * (1 + taxRate / 100)
    const { direction: candidateDirection } = roundToNickel(candidateTotal)

    if (candidateDirection === "none") {
      // Found an exact match
      return { preTax: candidatePreTax, total: candidateTotal }
    }
  }

  return null
}

function findPreTaxForExactNickel(targetNickel: number, taxRate: number): number | null {
  // Calculate approximate pre-tax
  const approxPreTax = targetNickel / (1 + taxRate / 100)

  // Search with expanded range (50 cents in each direction)
  for (let offset = -50; offset <= 50; offset++) {
    const candidatePreTax = Math.round(approxPreTax * 100 + offset) / 100
    if (candidatePreTax <= 0) continue

    const candidateTotal = candidatePreTax * (1 + taxRate / 100)
    const { rounded, direction } = roundToNickel(candidateTotal)

    // Check if this pre-tax lands exactly on the target nickel
    if (direction === "none" && Math.abs(rounded - targetNickel) < 0.001) {
      return candidatePreTax
    }
  }

  console.log("[v0] Could not find exact pre-tax for target nickel:", targetNickel, "with tax rate:", taxRate)
  return null
}

function calculateSuggestions(preTax: number, taxRate: number) {
  const total = preTax * (1 + taxRate / 100)
  const { rounded, direction } = roundToNickel(total)

  // If already exact, no suggestions needed
  if (direction === "none") {
    return { seller: null, customer: null }
  }

  let sellerTarget: number
  let customerTarget: number

  if (direction === "down") {
    // Rounded DOWN: customer already has best price (the rounded amount)
    // Seller needs the next nickel up
    customerTarget = rounded
    sellerTarget = rounded + 0.05
  } else {
    // Rounded UP: seller already has best price (the rounded amount)
    // Customer needs the previous nickel down
    sellerTarget = rounded
    customerTarget = rounded - 0.05
  }

  const sellerPreTax = findPreTaxForExactNickel(sellerTarget, taxRate)
  const customerPreTax = findPreTaxForExactNickel(customerTarget, taxRate)

  return {
    seller: sellerPreTax ? { preTax: sellerPreTax, total: sellerTarget } : null,
    customer: customerPreTax ? { preTax: customerPreTax, total: customerTarget } : null,
  }
}

export function PriceRoundingCalculator() {
  const [price, setPrice] = useState("")
  const [selectedState, setSelectedState] = useState("Florida")
  const [customTaxRate, setCustomTaxRate] = useState("")
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false)

  const stateTaxRate = useMemo(() => {
    return US_STATE_TAX_RATES.find((s) => s.state === selectedState)?.rate || 0
  }, [selectedState])

  const taxRate = useMemo(() => {
    if (isEditingTaxRate && customTaxRate !== "") {
      return Number.parseFloat(customTaxRate) || 0
    }
    return stateTaxRate
  }, [isEditingTaxRate, customTaxRate, stateTaxRate])

  const handleStateChange = (state: string) => {
    setSelectedState(state)
    setIsEditingTaxRate(false)
    setCustomTaxRate("")
  }

  const handleTaxRateChange = (value: string) => {
    setCustomTaxRate(value)
    setIsEditingTaxRate(true)
  }

  const calculations = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0
    const taxAmount = priceNum * (taxRate / 100)
    const total = priceNum + taxAmount
    const { rounded, direction } = roundToNickel(total)
    const difference = rounded - total

    const suggestions = priceNum > 0 ? calculateSuggestions(priceNum, taxRate) : { seller: null, customer: null }

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
      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {/* Input Section - Compact */}
        <div className="p-4 border-2 border-foreground bg-card rounded-lg">
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <Label htmlFor="state" className="text-xs font-semibold uppercase tracking-wide">
                State
              </Label>
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger id="state" className="h-9 text-sm border-2 border-foreground bg-background w-full mt-1">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {US_STATE_TAX_RATES.map((s) => (
                    <SelectItem key={s.state} value={s.state}>
                      {s.state} ({s.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-24">
              <Label htmlFor="tax-rate" className="text-xs font-semibold uppercase tracking-wide">
                Tax Rate
              </Label>
              <div className="relative mt-1">
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="20"
                  placeholder={stateTaxRate.toString()}
                  value={isEditingTaxRate ? customTaxRate : stateTaxRate.toString()}
                  onChange={(e) => handleTaxRateChange(e.target.value)}
                  className="h-9 text-sm pr-6 border-2 border-foreground bg-background font-mono"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wide">
              Pre-Tax Price
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8 h-12 text-xl font-mono border-2 border-foreground bg-background"
              />
            </div>
          </div>
        </div>

        {/* Results Section - Always visible, compact */}
        {hasValidPrice && (
          <>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>
                Subtotal: <span className="font-mono">${calculations.subtotal.toFixed(2)}</span>
              </span>
              <span>
                Tax: <span className="font-mono">+${calculations.taxAmount.toFixed(2)}</span>
              </span>
              <span>
                Total: <span className="font-mono">${calculations.total.toFixed(2)}</span>
              </span>
            </div>

            <div className="p-4 bg-primary/10 border-2 border-primary rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">Cash Amount</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <p className="font-semibold mb-1">Swedish Rounding Rules</p>
                      <p className="text-xs">
                        <span className="text-destructive">Round Down:</span> ends in 1, 2, 6, 7
                      </p>
                      <p className="text-xs">
                        <span className="text-success">Round Up:</span> ends in 3, 4, 8, 9
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1">
                  {calculations.direction === "up" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <ArrowUp className="w-3 h-3" />+{Math.abs(calculations.difference).toFixed(2)}
                    </span>
                  )}
                  {calculations.direction === "down" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <ArrowDown className="w-3 h-3" />
                      {calculations.difference.toFixed(2)}
                    </span>
                  )}
                  {calculations.direction === "none" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Minus className="w-3 h-3" />
                      Exact
                    </span>
                  )}
                </div>
              </div>
              <div className="text-4xl font-bold text-primary font-mono">${calculations.rounded.toFixed(2)}</div>
            </div>

            {calculations.direction !== "none" && (
              <div className="grid grid-cols-2 gap-2">
                {/* seller Centric - Next Nickel */}
                {calculations.sellerSuggestion && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-500">Seller</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set pre-tax to{" "}
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        ${calculations.sellerSuggestion.preTax.toFixed(2)}
                      </span>{" "}
                      for exactly{" "}
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        ${calculations.sellerSuggestion.total.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Customer Centric - Previous Nickel */}
                {calculations.customerSuggestion && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-500">Customer</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set pre-tax to{" "}
                      <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                        ${calculations.customerSuggestion.preTax.toFixed(2)}
                      </span>{" "}
                      for exactly{" "}
                      <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">
                        ${calculations.customerSuggestion.total.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* End of suggestion boxes */}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
