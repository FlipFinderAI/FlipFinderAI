import Image from "next/image";
import Link from "next/link";

type Property = {
  id: number;
  address: string;
  postcode?: string | null;
  type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price: number;
  estimatedValue?: number | null;
  totalRefurbCost?: number | null;
  aiScore?: number | null;
  discountPercent?: number | null;
  potentialProfit?: number | null;
  images?: string | null;
};

type Props = {
  property: Property;
};

export default function PropertyCard({ property }: Props) {
  const value = property.estimatedValue ?? 0;
  const refurb = property.totalRefurbCost ?? 0;

  const profit =
    property.potentialProfit ??
    value - property.price - refurb;

  const discount =
    property.discountPercent ??
    (value > 0
      ? ((value - property.price) / value) * 100
      : 0);

  const roi =
    property.price + refurb > 0
      ? (profit / (property.price + refurb)) * 100
      : 0;

  const score = property.aiScore ?? 0;

  let image = "/house-placeholder.jpg";

  try {
    const images = property.images
      ? JSON.parse(property.images)
      : [];

    if (Array.isArray(images) && images.length > 0) {
      const firstImage = String(images[0]);

      image = firstImage
        .replace("[", "")
        .replace("]", "")
        .replace("(", "")
        .replace(")", "")
        .replace(/"/g, "")
        .trim();
    }
  } catch {
    image = "/house-placeholder.jpg";
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border flex flex-col">

      <div className="relative h-48 w-full">
        <Image
          src={image}
          alt={property.address}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          loading="eager"
        />

        <div className="absolute top-3 left-3 bg-black/85 text-white px-3 py-1.5 rounded-full text-xs font-bold">
          AI {score}/100
        </div>

        <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">
          {discount.toFixed(0)}% BMV
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

        <div>
          <h2 className="font-bold text-lg leading-tight">
            {property.address}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {property.postcode || "Postcode unavailable"}
          </p>
        </div>

        <div className="flex gap-2 text-xs flex-wrap">

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛏 {property.bedrooms ?? 0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🛁 {property.bathrooms ?? 0}
          </span>

          <span className="bg-gray-100 px-3 py-1.5 rounded-full">
            🏠 {property.type || "House"}
          </span>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div>
            <p className="text-xs text-gray-500">
              Purchase
            </p>

            <p className="font-bold text-lg">
              £{property.price.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Market Value
            </p>

            <p className="font-bold text-lg">
              £{value.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Refurb
            </p>

            <p className="font-bold">
              £{refurb.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              ROI
            </p>

            <p className="font-bold">
              {roi.toFixed(0)}%
            </p>
          </div>

        </div>

        <div className="bg-green-50 border border-green-100 rounded-xl p-4">

          <p className="text-xs text-gray-500">
            Potential Profit
          </p>

          <p className="text-2xl font-bold text-green-700">
            £{profit.toLocaleString()}
          </p>

        </div>

        <Link
          href={`/property/${property.id}`}
          className="bg-black text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
        >
          Analyse Deal
        </Link>

      </div>
    </div>
  );
}
