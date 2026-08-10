import axios from "axios";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { setTimeout } from "timers/promises";


// Prisma connection

const adapter = new PrismaLibSql({
  url: "file:./dev.db",
});


const prisma = new PrismaClient({
  adapter,
});



// ------------------------------------
// Extract value helper
// ------------------------------------

function extract(
  html:string,
  regex:RegExp
){

  const match =
    html.match(regex);

  return match ? match[1] : null;

}



// ------------------------------------
// Get property page data
// ------------------------------------

async function getDetails(
  href:string
){

  const url =
    href.startsWith("http")
    ? href
    : `https://www.onthemarket.com${href}`;


  console.log(
    "Scanning:",
    url
  );


  const response =
    await axios.get(
      url,
      {
        headers:{
          "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        }
      }
    );


  const html =
    response.data;



  // ADDRESS

  const address =
    extract(
      html,
      /"displayAddress":"([^"]+)"/
    )
    ?.replace(/\\n/g,", ")
    ??
    null;



  // POSTCODE

  const postcodeMatch =
    html.match(
      /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/
    );


  const postcode =
    postcodeMatch
    ? postcodeMatch[0]
    : null;



  // PRICE

  const priceMatch =
    html.match(
      /"price":"£?([\d,]+)"/
    );


  const price =
    priceMatch
    ?
    Number(
      priceMatch[1]
      .replace(/,/g,"")
    )
    :
    null;



  // PROPERTY TYPE

  const type =
    extract(
      html,
      /"humanisedPropertyType":"([^"]+)"/
    );



  // BEDROOMS

  const bedroomsMatch =
    html.match(
      /"bedrooms":(\d+)/
    );


  const bedrooms =
    bedroomsMatch
    ?
    Number(
      bedroomsMatch[1]
    )
    :
    null;



  // BATHROOMS

  const bathroomsMatch =
    html.match(
      /"bathrooms":(\d+)/
    );


  const bathrooms =
    bathroomsMatch
    ?
    Number(
      bathroomsMatch[1]
    )
    :
    null;



  // EPC

  const epc =
    extract(
      html,
      /"rating":"([A-G])"/
    );



  // AGENT

  const agent =
    extract(
      html,
      /"agent":\{"branchId":\d+,"name":"([^"]+)"/
    );



  return {

    address,

    postcode,

    price,

    type,

    bedrooms,

    bathrooms,

    epcRating: epc,

    agent

  };


}




// ------------------------------------
// MAIN
// ------------------------------------

async function main(){


  const properties =
    await prisma.property.findMany();


  console.log(
    "Found",
    properties.length,
    "properties"
  );



  for(
    const property of properties
  ){


    const data =
      await getDetails(
        property.listingUrl!
      );



    await prisma.property.update({

      where:{
        id:property.id
      },

      data:{


        address:
          data.address ??
          property.address,


        postcode:
          data.postcode ??
          property.postcode,


        price:
          data.price ??
          property.price,


        type:
          data.type ??
          property.type,


        bedrooms:
          data.bedrooms ??
          property.bedrooms,


        bathrooms:
          data.bathrooms ??
          property.bathrooms,


        epcRating:
          data.epcRating ??
          property.epcRating,


        agent:
          data.agent ??
          property.agent

      }


    });



    console.log(

      "Updated:",
      data.address,
      data.postcode,
      data.price

    );


    await setTimeout(1000);


  }


}



main()

.then(()=>{

 console.log(
  "REBUILD COMPLETE"
 );

})


.catch(console.error)


.finally(async()=>{

 await prisma.$disconnect();

});