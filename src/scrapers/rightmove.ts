import axios from "axios";
import * as cheerio from "cheerio";


export async function scrapeRightmove() {


  const url =
    "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=POSTCODE/LS8";


  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0",
    },
  });


  const $ = cheerio.load(response.data);


  const properties:any[] = [];


  $(".propertyCard").each((_, element) => {


    const address =
      $(element)
        .find(".propertyCard-address")
        .text()
        .trim();


    const priceText =
      $(element)
        .find(".propertyCard-priceValue")
        .text()
        .trim();


    const price =
      Number(
        priceText
          .replace(/[^0-9]/g, "")
      );


    if(address && price) {

      properties.push({

        address,

        postcode:"LS8",

        price,

        value: price,

        refurb:20000,

        score:50,

        images:"/house-placeholder.jpg",

        description:
          "Imported from Rightmove"

      });

    }


  });


  console.log(
    `Found ${properties.length} properties`
  );


  return properties;

}