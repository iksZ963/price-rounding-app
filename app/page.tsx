"use client"

import { useState } from "react"
import { PriceRoundingCalculator } from "@/components/price-rounding-calculator"
import { PriceRoundingCalculatorApple } from "@/components/price-rounding-calculator-apple"

export default function Home() {
  const [useAppleStyle, setUseAppleStyle] = useState(false)

  return (
    <main className="min-h-dvh bg-background p-3 flex flex-col">
      <header className="text-center mb-3">
        <h1 className="text-xl font-bold text-foreground">Penny Rounding Calculator</h1>
        <p className="text-xs text-muted-foreground">Round cash transactions to the nearest nickel</p>
        <button
          onClick={() => setUseAppleStyle(!useAppleStyle)}
          className="mt-2 text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          {useAppleStyle ? "Switch to Original" : "Switch to Apple Style"}
        </button>
      </header>
      {useAppleStyle ? <PriceRoundingCalculatorApple /> : <PriceRoundingCalculator />}
    </main>
  )
}
