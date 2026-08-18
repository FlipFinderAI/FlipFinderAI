import PropertyGallery from "@/components/PropertyGallery";


type PropertyHeaderProps = {
  property: any;
  images: string[];
  floorPlans?: string[];
  purchasePrice: number;
  estimatedValue: number;
  discountPercent: number;
  formatMoney: (value: number | null | undefined) => string;
};


export default function PropertyHeader({
  property,
  images,
  floorPlans = [],
  purchasePrice,
  estimatedValue,
  discountPercent,
  formatMoney,
}: PropertyHeaderProps) {

  const mapsAddress = encodeURIComponent(
    property.address || ""
  );

  const googleMapsUrl =
    property.latitude && property.longitude
      ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${mapsAddress}`;

  const streetViewUrl =
    property.latitude && property.longitude
      ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.latitude},${property.longitude}`
      : `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${mapsAddress}`;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">


        {/* GALLERY */}

        <div>
          <PropertyGallery
            images={images}
            floorPlans={floorPlans}
            address={property.address}
          />
        </div>


        {/* PROPERTY DETAILS */}

        <div className="flex flex-col justify-between">

          <div>

            <div className="mb-2 flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                {property.type || "Property"}
              </span>


              {discountPercent > 0 && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400">
                  {discountPercent}% BMV
                </span>
              )}

            </div>


            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              {property.address}
            </h1>


            <p className="mt-1 text-base text-slate-400">
              {property.postcode}
            </p>


            <div className="mt-4 flex flex-wrap gap-5 text-slate-300">

              <span>
                🛏 {property.bedrooms ?? "—"}
              </span>

              <span>
                🛁 {property.bathrooms ?? "—"}
              </span>

              <span>
                🏠 {property.type ?? "—"}
              </span>


              {property.floorArea && (
                <span>
                  📐 {property.floorArea} m²
                </span>
              )}

            </div>

          </div>


          {/* MAPS + STREET VIEW BUTTONS */}

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              <span>📍</span>
              Google Maps
            </a>

            <a
              href={streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
            >
              <span>🏘</span>
              Street View
            </a>
          </div>


          <div className="mt-6 grid grid-cols-2 gap-3">


            <div className="rounded-2xl bg-slate-800 p-4">

              <p className="text-sm text-slate-400">
                Asking price
              </p>

              <p className="mt-1 text-2xl font-bold">
                {formatMoney(purchasePrice)}
              </p>

            </div>



            <div className="rounded-2xl bg-green-500/10 p-4">

              <p className="text-sm text-green-400">
                Estimated value
              </p>

              <p className="mt-1 text-2xl font-bold text-green-400">
                {formatMoney(estimatedValue)}
              </p>

            </div>


          </div>


        </div>


      </div>

    </section>
  );
}