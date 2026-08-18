"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function PropertySearch() {
const router = useRouter();
const searchParams = useSearchParams();

const [postcode, setPostcode] = useState(
searchParams.get("postcode") || ""
);

const [minPrice, setMinPrice] = useState(
searchParams.get("minPrice") || ""
);

const [maxPrice, setMaxPrice] = useState(
searchParams.get("maxPrice") || ""
);

const [sort, setSort] = useState(
searchParams.get("sort") || "best"
);

const [type, setType] = useState(
searchParams.get("type") || ""
);

const [bedrooms, setBedrooms] = useState(
searchParams.get("bedrooms") || ""
);

function submitSearch(event: FormEvent) {
event.preventDefault();


const params = new URLSearchParams();

if (postcode.trim()) {
  params.set("postcode", postcode.trim());
}

if (minPrice) {
  params.set("minPrice", minPrice);
}

if (maxPrice) {
  params.set("maxPrice", maxPrice);
}

if (type) {
  params.set("type", type);
}

if (bedrooms) {
  params.set("bedrooms", bedrooms);
}

if (sort) {
  params.set("sort", sort);
}

const query = params.toString();

router.push(query ? `/?${query}` : "/");


}

function clearSearch() {
setPostcode("");
setMinPrice("");
setMaxPrice("");
setType("");
setBedrooms("");
setSort("best");


router.push("/");


}

return ( <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
{/* HEADER */}

  <div className="mb-5">
    <h2 className="text-xl font-bold text-white">
      Find Property Deals
    </h2>

    <p className="mt-1 text-sm text-slate-400">
      Search the entire FlipFinderAI property database and narrow
      down the best opportunities.
    </p>
  </div>

  {/* SEARCH FORM */}

  <form
    onSubmit={submitSearch}
    className="grid gap-3 md:grid-cols-2 lg:grid-cols-6"
  >
    {/* LOCATION */}

    <div className="lg:col-span-2">
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Postcode / Address
      </label>

      <input
        type="text"
        value={postcode}
        onChange={(event) =>
          setPostcode(event.target.value)
        }
        placeholder="e.g. LS8, LS17 or street"
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
      />
    </div>

    {/* MIN PRICE */}

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Min price
      </label>

      <select
        value={minPrice}
        onChange={(event) =>
          setMinPrice(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">Any</option>
        <option value="50000">£50k</option>
        <option value="75000">£75k</option>
        <option value="100000">£100k</option>
        <option value="125000">£125k</option>
        <option value="150000">£150k</option>
        <option value="175000">£175k</option>
        <option value="200000">£200k</option>
        <option value="225000">£225k</option>
        <option value="250000">£250k</option>
        <option value="300000">£300k</option>
        <option value="350000">£350k</option>
        <option value="400000">£400k</option>
        <option value="500000">£500k</option>
        <option value="750000">£750k</option>
        <option value="1000000">£1m</option>
      </select>
    </div>

    {/* MAX PRICE */}

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Max price
      </label>

      <select
        value={maxPrice}
        onChange={(event) =>
          setMaxPrice(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">Any</option>
        <option value="50000">£50k</option>
        <option value="75000">£75k</option>
        <option value="100000">£100k</option>
        <option value="125000">£125k</option>
        <option value="150000">£150k</option>
        <option value="175000">£175k</option>
        <option value="200000">£200k</option>
        <option value="225000">£225k</option>
        <option value="250000">£250k</option>
        <option value="300000">£300k</option>
        <option value="350000">£350k</option>
        <option value="400000">£400k</option>
        <option value="500000">£500k</option>
        <option value="750000">£750k</option>
        <option value="1000000">£1m</option>
        <option value="1500000">£1.5m</option>
        <option value="2000000">£2m</option>
        <option value="3000000">£3m+</option>
      </select>
    </div>

    {/* PROPERTY TYPE */}

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Property
      </label>

      <select
        value={type}
        onChange={(event) =>
          setType(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">All types</option>
        <option value="house">House</option>
        <option value="flat">Flat</option>
        <option value="bungalow">Bungalow</option>
        <option value="terraced">Terraced</option>
        <option value="semi-detached">
          Semi-detached
        </option>
        <option value="detached">
          Detached
        </option>
      </select>
    </div>

    {/* BEDROOMS */}

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Bedrooms
      </label>

      <select
        value={bedrooms}
        onChange={(event) =>
          setBedrooms(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">Any</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
        <option value="5">5+</option>
      </select>
    </div>

    {/* SORT */}

    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Sort by
      </label>

      <select
        value={sort}
        onChange={(event) =>
          setSort(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="best">
          Best deals
        </option>

        <option value="bmv">
          Best BMV
        </option>

        <option value="profit">
          Highest profit
        </option>

        <option value="roi">
          Highest ROI
        </option>

        <option value="price-low">
          Lowest price
        </option>

        <option value="newest">
          Newest
        </option>
      </select>
    </div>

    {/* BUTTONS */}

    <div className="flex items-end gap-2 lg:col-span-2">
      <button
        type="submit"
        className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
      >
        🔎 Search Deals
      </button>

      <button
        type="button"
        onClick={clearSearch}
        className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
      >
        Clear
      </button>
    </div>
  </form>
</section>


);
}
