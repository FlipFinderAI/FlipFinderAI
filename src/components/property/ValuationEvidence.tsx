type ValuationEvidenceProps = {
  valuation: any;
};


export default function ValuationEvidence({
  valuation,
}: ValuationEvidenceProps) {
  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">

      <h2 className="text-xl font-bold">
        Valuation Evidence
      </h2>


      <p className="mt-1 text-sm text-slate-400">
        How the valuation has been calculated.
      </p>


      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">


        <div className="rounded-2xl bg-slate-800 p-3">

          <p className="text-sm text-slate-400">
            Exact postcode
          </p>

          <p className="mt-1 text-xl font-bold">
            {valuation?.exactPostcodeCount ?? 0}
          </p>

          <p className="text-xs text-slate-500">
            Same postcode
          </p>

        </div>



        <div className="rounded-2xl bg-slate-800 p-3">

          <p className="text-sm text-slate-400">
            Same street
          </p>

          <p className="mt-1 text-xl font-bold">
            {valuation?.sameStreetCount ?? 0}
          </p>

          <p className="text-xs text-slate-500">
            Strong local evidence
          </p>

        </div>



        <div className="rounded-2xl bg-slate-800 p-3">

          <p className="text-sm text-slate-400">
            Same property type
          </p>

          <p className="mt-1 text-xl font-bold">
            {valuation?.sameTypeCount ?? 0}
          </p>

          <p className="text-xs text-slate-500">
            Matching type
          </p>

        </div>



        <div className="rounded-2xl bg-slate-800 p-3">

          <p className="text-sm text-slate-400">
            Same bedrooms
          </p>

          <p className="mt-1 text-xl font-bold">
            {valuation?.sameBedroomsCount ?? 0}
          </p>

          <p className="text-xs text-slate-500">
            Where data exists
          </p>

        </div>



        <div className="rounded-2xl bg-slate-800 p-3">

          <p className="text-sm text-slate-400">
            Recent sales
          </p>

          <p className="mt-1 text-xl font-bold">
            {valuation?.recentCount ?? 0}
          </p>

          <p className="text-xs text-slate-500">
            Within 12 months
          </p>

        </div>


      </div>

    </section>
  );
}