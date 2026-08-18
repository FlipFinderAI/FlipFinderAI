type ComparableValuationProps = {
  estimatedValue: number;
  valuation: any;
  formatMoney: (value: number | null | undefined) => string;
};

export default function ComparableValuation({
  estimatedValue,
  valuation,
  formatMoney,
}: ComparableValuationProps) {
    
  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          Comparable Valuation
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Valuation based on recent local sold-property evidence.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Estimated market value
          </p>

          <p className="mt-1 text-2xl font-bold">
            {formatMoney(estimatedValue)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Valuation range
          </p>

          <p className="mt-1 text-lg font-bold">
            {formatMoney(valuation?.valuationRangeLow ?? 0)}
            {" – "}
            {formatMoney(valuation?.valuationRangeHigh ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Comparable sales
          </p>

          <p className="mt-1 text-2xl font-bold">
            {valuation?.comparableCount ?? 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">
            Confidence
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-400">
            {valuation?.confidence ?? 0}%
          </p>
        </div>
      </div>
    </section>
  );
}