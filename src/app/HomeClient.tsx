"use client";

import { useState } from "react";
import PropertyCard from "@/components/PropertyCard";


export default function HomeClient({
  properties,
}: {
  properties: any[];
}) {


  const [sort, setSort] = useState("score");

  const [postcode, setPostcode] = useState("");

  const [minPrice, setMinPrice] = useState("");

  const [maxPrice, setMaxPrice] = useState("");

  const [minScore, setMinScore] = useState("");



  const filteredProperties = properties.filter((property) => {


    const matchesPostcode =
      postcode === "" ||
      (property.postcode ?? "")
        .toLowerCase()
        .includes(postcode.toLowerCase());



    const matchesMinPrice =
      minPrice === "" ||
      property.price >= Number(minPrice);



    const matchesMaxPrice =
      maxPrice === "" ||
      property.price <= Number(maxPrice);



    const matchesScore =
      minScore === "" ||
      property.score >= Number(minScore);



    return (
      matchesPostcode &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesScore
    );

  });





  const sortedProperties = [...filteredProperties].sort((a, b) => {


    if (sort === "score") {
      return b.score - a.score;
    }



    if (sort === "upside") {

      const profitA =
        a.value - a.price - a.refurb;


      const profitB =
        b.value - b.price - b.refurb;


      return profitB - profitA;

    }




    if (sort === "discount") {

      const discountA =
        ((a.value - a.price) / a.value) * 100;


      const discountB =
        ((b.value - b.price) / b.value) * 100;


      return discountB - discountA;

    }




    if (sort === "highPrice") {
      return b.price - a.price;
    }




    if (sort === "lowPrice") {
      return a.price - b.price;
    }




    return 0;

  });






  return (

    <main className="min-h-screen bg-gray-100 p-6">


      <div className="max-w-7xl mx-auto">


        <h1 className="text-3xl font-bold">
          FlipFinderAI
        </h1>


        <p className="text-gray-600">
          AI-powered property deal finder
        </p>





        <div className="bg-white rounded-xl shadow p-4 mt-6">


          <div className="grid md:grid-cols-5 gap-3">


            <input

              placeholder="Postcode e.g. LS8"

              value={postcode}

              onChange={(e) =>
                setPostcode(e.target.value)
              }

              className="border rounded-lg p-2"

            />



            <input

              placeholder="Min £"

              type="number"

              value={minPrice}

              onChange={(e) =>
                setMinPrice(e.target.value)
              }

              className="border rounded-lg p-2"

            />



            <input

              placeholder="Max £"

              type="number"

              value={maxPrice}

              onChange={(e) =>
                setMaxPrice(e.target.value)
              }

              className="border rounded-lg p-2"

            />



            <select

              value={minScore}

              onChange={(e) =>
                setMinScore(e.target.value)
              }

              className="border rounded-lg p-2"

            >

              <option value="">
                All Scores
              </option>


              <option value="90">
                90+ Excellent
              </option>


              <option value="80">
                80+ Strong
              </option>


              <option value="70">
                70+ Good
              </option>


            </select>





            <select

              value={sort}

              onChange={(e) =>
                setSort(e.target.value)
              }

              className="border rounded-lg p-2"

            >

              <option value="score">
                🔥 Best Deal Score
              </option>


              <option value="upside">
                📈 Highest Upside
              </option>


              <option value="discount">
                📉 Biggest Discount
              </option>


              <option value="highPrice">
                ⬆ Highest Price
              </option>


              <option value="lowPrice">
                ⬇ Lowest Price
              </option>


            </select>


          </div>


        </div>





        
<div className="mt-6 grid gap-6 md:grid-cols-3">

          {sortedProperties.map((property) => (

            <PropertyCard

              key={property.id}

              property={property}

            />

          ))}


        </div>



      </div>


    </main>

  );

}