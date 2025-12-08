import { PriceRoundingCalculator } from "@/components/price-rounding-calculator"

export default function Home() {
  return (
    <main className="min-h-dvh bg-background p-3 flex flex-col">
      <header className="text-center mb-3">
        <h1 className="text-xl font-bold text-foreground">Penny Rounding Calculator</h1>
        <p className="text-xs text-muted-foreground">Round cash transactions to the nearest nickel</p>
      </header>
      <PriceRoundingCalculator />
    </main>
  )
}
