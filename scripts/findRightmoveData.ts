import axios from "axios";


async function main() {


  const url =
    "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=POSTCODE/LS8";


  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0",
    },
  });


  const html = response.data;


  const keywords = [
    "propertyId",
    "price",
    "displayAddress",
    "location",
    "bedrooms"
  ];


  for (const word of keywords) {

    console.log(
      word,
      html.indexOf(word)
    );

  }


}


main();