import axios from "axios";
import prisma from "../lib/prisma";
import { setTimeout } from "timers/promises";


// --------------------------------------
// Get property images
// --------------------------------------

async function getPropertyImages(href: string) {

  try {

    const url = href.startsWith("http")
      ? href
      : `https://www.onthemarket.com${href}`;


    console.log("Getting images:", url);


    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
      }
    });


    const html = response.data;


    const images:string[] = [];


    const matches =
      html.match(
        /https?:\/\/media\.onthemarket\.com\/[^"'\\\s]+/g
      );


    if(matches){

      for(const image of matches){

        const clean =
          image
          .replace(/\\u002F/g,"/")
          .replace(/\\u0026/g,"&")
          .split(",")[0];


        if(
          clean.includes(".jpg") ||
          clean.includes(".jpeg") ||
          clean.includes(".png") ||
          clean.includes(".webp")
        ){

          images.push(clean);

        }

      }

    }


    return [
      ...new Set(images)
    ].slice(0,10);


  } catch(error){

    console.log(
      "Image error:",
      href
    );

    return [];

  }

}





// --------------------------------------
// Get property details
// --------------------------------------

async function getPropertyDetails(href:string){

  try {


    const url = href.startsWith("http")
      ? href
      : `https://www.onthemarket.com${href}`;



    const response =
      await axios.get(url,{
        headers:{
          "User-Agent":
          "Mozilla/5.0"
        }
      });



    const html =
      response.data.toString();



    const details:any = {

      bedrooms:null,

      bathrooms:null,

      type:"Unknown",

      epcRating:null,

      floorArea:null,

      tenure:null

    };



    // Bedrooms

    const beds =
      html.match(
        /(\d+)\s*bed/i
      );


    if(beds){

      details.bedrooms =
        Number(beds[1]);

    }




    // Bathrooms

    const baths =
      html.match(
        /(\d+)\s*bath/i
      );


    if(baths){

      details.bathrooms =
        Number(baths[1]);

    }





    // Property type

    const types = [

      "Terrace",
      "Semi Detached",
      "Detached",
      "Flat",
      "Apartment",
      "Bungalow"

    ];



    for(const t of types){

      if(
        html
        .toLowerCase()
        .includes(
          t.toLowerCase()
        )
      ){

        details.type=t;

        break;

      }

    }





    // EPC

    const epc =
      html.match(
        /EPC.{0,80}?([A-G])/i
      );


    if(epc){

      details.epcRating =
        epc[1].toUpperCase();

    }





    // Floor area

    const area =
      html.match(
        /(\d+)\s*(sq ft|sqft)/i
      );


    if(area){

      details.floorArea =
        Number(area[1]);

    }





    // Tenure

    const lower =
      html.toLowerCase();



    if(
      lower.includes("freehold")
    ){

      details.tenure="Freehold";

    }


    if(
      lower.includes("leasehold")
    ){

      details.tenure="Leasehold";

    }




    return details;



  }catch(error){


    console.log(
      "Detail error:",
      href
    );


    return {};

  }


}







// --------------------------------------
// Scrape OnTheMarket
// --------------------------------------

async function scrapeOnTheMarket(){


  const url =
    "https://www.onthemarket.com/for-sale/property/ls8/";



  const response =
    await axios.get(url,{

      headers:{
        "User-Agent":
        "Mozilla/5.0"
      }

    });



  const html =
    response.data;



  const links =
    [
      ...new Set(
        html.match(
          /\/details\/[0-9]+\//g
        ) || []
      )
    ];



  const properties:any[]=[];




  for(const href of links){


    properties.push({

      address:
        "Imported property",


      postcode:
        "LS8",


      type:
        "Unknown",


      bedrooms:null,


      bathrooms:null,


      price:0,


      value:0,


      refurb:20000,


      score:50,


      description:
        "Imported from OnTheMarket",


      images:
        JSON.stringify([]),


      findings:
        href,


      listingUrl:
        href,


      source:
        "OnTheMarket",


      status:
        "active"

    });


  }



  return properties;



}







// --------------------------------------
// Import
// --------------------------------------

async function main(){


  const properties =
    await scrapeOnTheMarket();



  console.log(
    "Found",
    properties.length,
    "properties"
  );




  for(const property of properties){



    console.log(
      "Processing",
      property.listingUrl
    );



    const details =
      await getPropertyDetails(
        property.listingUrl
      );



    Object.assign(
      property,
      details
    );



    const images =
      await getPropertyImages(
        property.listingUrl
      );



    property.images =
      JSON.stringify(images);



    await prisma.property.create({

      data:{

        ...property,

        aiConfidence:0,

        aiRecommendation:
          "Awaiting AI analysis"

      }

    });



    console.log(
      "Imported",
      images.length,
      "images"
    );



    await setTimeout(1500);



  }



}





main()

.then(()=>{

  console.log(
    "IMPORT COMPLETE"
  );

})

.catch(console.error)

.finally(async()=>{

  await prisma.$disconnect();

});