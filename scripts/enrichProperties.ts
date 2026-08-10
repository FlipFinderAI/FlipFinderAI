import axios from "axios";
import * as cheerio from "cheerio";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";


const adapter = new PrismaLibSql({
  url: "file:./dev.db",
});


const prisma = new PrismaClient({
  adapter,
});



// -------------------------------------
// Clean description extractor
// -------------------------------------

function extractDescription($:any){


  const selectors = [

    '[data-testid="description"]',

    ".description",

    ".property-description",

    "main",

    "article"

  ];



  for(const selector of selectors){


    const value =
      $(selector)
      .first()
      .text()
      .replace(/\s+/g," ")
      .trim();



    if(
      value.length > 100 &&
      !value.includes("Skip to main content")
    ){

      return value.substring(0,1200);

    }

  }



  return "";

}





// -------------------------------------
// Extract agent
// -------------------------------------

function extractAgent($:any){


  const text =
    $("body")
    .text()
    .replace(/\s+/g," ")
    .trim();



  const match =
    text.match(
      /([A-Z][A-Za-z &]+)\s+\d{3,5}\s+[A-Z]{2,}/
    );


  if(match){

    return match[1].trim();

  }


  return null;

}





// -------------------------------------
// Extract EPC
// -------------------------------------

function extractEPC(text:string){


  const match =
    text.match(
      /EPC\s*(?:rating)?\s*([A-G])/i
    );


  if(match){

    return match[1].toUpperCase();

  }


  return null;

}





// -------------------------------------
// Scrape property page
// -------------------------------------

async function scrapeDetails(url:string){


  try{


    const fullUrl =
      url.startsWith("http")
      ?
      url
      :
      `https://www.onthemarket.com${url}`;



    console.log(
      "Scanning:",
      fullUrl
    );



    const response =
      await axios.get(
        fullUrl,
        {

          headers:{

            "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

          }

        }

      );



    const html =
      response.data;



    const $ =
      cheerio.load(html);



    const text =
      $("body")
      .text()
      .replace(/\s+/g," ")
      .trim();





    // Bedrooms

    let bedrooms:number|null = null;


    const bedMatch =
      text.match(
        /(\d+)\s*bed/i
      );


    if(bedMatch){

      bedrooms =
        Number(
          bedMatch[1]
        );

    }





    // Bathrooms

    let bathrooms:number|null = null;


    const bathMatch =
      text.match(
        /(\d+)\s*bath/i
      );


    if(bathMatch){

      bathrooms =
        Number(
          bathMatch[1]
        );

    }





    // Type

    let type =
      "House";


    if(/flat/i.test(text))
      type="Flat";


    if(/semi[- ]detached/i.test(text))
      type="Semi-detached";


    if(/terraced/i.test(text))
      type="Terraced";


    if(/detached/i.test(text))
      type="Detached";







    // Floor area

    let floorArea:number|null=null;


    const areaMatch =
      text.match(
        /(\d+)\s*(?:sq\s*ft|sqft)/i
      );


    if(areaMatch){

      floorArea =
        Number(
          areaMatch[1]
        );

    }






    return {


      bedrooms,

      bathrooms,

      type,

      floorArea,


      description:
        extractDescription($),


      agent:
        extractAgent($),


      epcRating:
        extractEPC(text)


    };


  }
  catch(error){


    console.log(
      "FAILED:",
      url
    );


    return {};

  }


}







// -------------------------------------
// Run enrichment
// -------------------------------------

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



    if(!property.listingUrl)
      continue;





    const details =
      await scrapeDetails(
        property.listingUrl
      );





    await prisma.property.update({


      where:{

        id:
          property.id

      },


      data:{


        bedrooms:
          details.bedrooms ?? undefined,


        bathrooms:
          details.bathrooms ?? undefined,


        type:
          details.type ?? undefined,


        floorArea:
          details.floorArea ?? undefined,


        description:
          details.description ?? undefined,


        agent:
          details.agent ?? undefined,


        epcRating:
          details.epcRating ?? undefined


      }


    });




    console.log(
      "Updated:",
      property.id
    );




    await new Promise(
      resolve =>
      setTimeout(resolve,1500)
    );



  }




  console.log(
    "ENRICHMENT COMPLETE"
  );


}





main()

.then(()=>{

 console.log(
  "DONE"
 );

})


.catch(console.error)


.finally(async()=>{

 await prisma.$disconnect();

});