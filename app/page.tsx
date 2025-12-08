import { PriceRoundingCalculator } from "@/components/price-rounding-calculator"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Penny Rounding Calculator</h1>
          <p className="text-muted-foreground">Round cash transactions to the nearest nickel after tax</p>
        </header>
        <PriceRoundingCalculator />
      </div>
    </main>
  )
}
