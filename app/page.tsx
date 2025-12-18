import PriceRoundingCalculator from "@/components/price-rounding-calculator"

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <PriceRoundingCalculator />
    </main>
  )
}
