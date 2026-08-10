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


  console.log(
    "Length:",
    html.length
  );


  console.log(
    "Contains property:",
    html.includes("property")
  );


  console.log(
    "Contains price:",
    html.includes("£")
  );


  const matches =
    html.match(/£[0-9,]+/g);


  console.log(
    "Prices found:",
    matches?.slice(0,10)
  );


}


main();