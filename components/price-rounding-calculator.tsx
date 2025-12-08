"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"

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
  { state: "Louisiana", rate: 4.45 },
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
  { state: "Utah", rate: 6.1 },
  { state: "Vermont", rate: 6.0 },
  { state: "Virginia", rate: 5.3 },
  { state: "Washington", rate: 6.5 },
  { state: "West Virginia", rate: 6.0 },
  { state: "Wisconsin", rate: 5.0 },
  { state: "Wyoming", rate: 4.0 },
  { state: "Custom", rate: 0.0 },
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

export function PriceRoundingCalculator() {
  const [price, setPrice] = useState("")
  const [selectedState, setSelectedState] = useState("Florida")
  const [customTaxRate, setCustomTaxRate] = useState("")

  const taxRate = useMemo(() => {
    if (selectedState === "Custom") {
      return Number.parseFloat(customTaxRate) || 0
    }
    return US_STATE_TAX_RATES.find((s) => s.state === selectedState)?.rate || 0
  }, [selectedState, customTaxRate])

  const calculations = useMemo(() => {
    const priceNum = Number.parseFloat(price) || 0
    const taxAmount = priceNum * (taxRate / 100)
    const total = priceNum + taxAmount
    const { rounded, direction } = roundToNickel(total)
    const difference = rounded - total

    return {
      subtotal: priceNum,
      taxAmount,
      total,
      rounded,
      direction,
      difference,
    }
  }, [price, taxRate])

  const hasValidPrice = Number.parseFloat(price) > 0

  return (
    <div className="space-y-6">
      <Card className="border-2 border-foreground bg-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-semibold uppercase tracking-wide">
              Pre-Tax Price
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-foreground">$</span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-10 h-14 text-2xl font-mono border-2 border-foreground bg-background"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-semibold uppercase tracking-wide">
                State
              </Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger id="state" className="h-12 border-2 border-foreground bg-background w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {US_STATE_TAX_RATES.map((s) => (
                    <SelectItem key={s.state} value={s.state}>
                      {s.state} {s.state !== "Custom" && `(${s.rate}%)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-rate" className="text-sm font-semibold uppercase tracking-wide">
                Tax Rate
              </Label>
              {selectedState === "Custom" ? (
                <div className="relative">
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="20"
                    placeholder="0.00"
                    value={customTaxRate}
                    onChange={(e) => setCustomTaxRate(e.target.value)}
                    className="h-12 pr-8 border-2 border-foreground bg-background font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              ) : (
                <div className="h-12 px-4 flex items-center border-2 border-foreground bg-muted rounded-md font-mono text-lg">
                  {taxRate}%
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {hasValidPrice && (
        <Card className="border-2 border-foreground bg-card">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">Calculation Breakdown</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-lg">${calculations.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="font-mono text-lg">+${calculations.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t-2 border-dashed border-foreground/30">
                <span className="text-muted-foreground">Total (before rounding)</span>
                <span className="font-mono text-lg">${calculations.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 bg-primary/10 border-2 border-primary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold uppercase tracking-wide text-primary">Cash Amount</span>
                <div className="flex items-center gap-2">
                  {calculations.direction === "up" && (
                    <span className="flex items-center gap-1 text-sm font-medium text-success">
                      <ArrowUp className="w-4 h-4" />
                      Rounded Up
                    </span>
                  )}
                  {calculations.direction === "down" && (
                    <span className="flex items-center gap-1 text-sm font-medium text-destructive">
                      <ArrowDown className="w-4 h-4" />
                      Rounded Down
                    </span>
                  )}
                  {calculations.direction === "none" && (
                    <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      <Minus className="w-4 h-4" />
                      No Change
                    </span>
                  )}
                </div>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-primary font-mono">
                ${calculations.rounded.toFixed(2)}
              </div>
              {calculations.direction !== "none" && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Difference:{" "}
                  <span className="font-mono">
                    {calculations.difference > 0 ? "+" : ""}
                    {calculations.difference.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-foreground/30 bg-card">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">Swedish Rounding Rules</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-destructive flex items-center gap-2">
                <ArrowDown className="w-4 h-4" /> Round Down
              </p>
              <p className="text-muted-foreground font-mono">Ends in 1, 2, 6, 7</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-success flex items-center gap-2">
                <ArrowUp className="w-4 h-4" /> Round Up
              </p>
              <p className="text-muted-foreground font-mono">Ends in 3, 4, 8, 9</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
