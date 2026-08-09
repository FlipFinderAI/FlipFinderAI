import axios from "axios";


// --------------------------------------
// Find possible Rightmove API endpoints
// --------------------------------------

async function findRightmoveAPI() {


  const url =
    "https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=POSTCODE%5ELS8";



  try {


    const response =
      await axios.get(url, {

        headers: {

          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"

        }

      });



    const html =
      response.data;



    console.log(
      "Downloaded Rightmove page"
    );



    const apiMatches =
      html.match(
        /https?:\/\/[^"'\\]+/g
      );



    if (!apiMatches) {

      console.log(
        "No URLs found"
      );

      return;

    }




    const possibleApis =
      apiMatches.filter(
        (url: string) =>

          url.includes("api") ||
          url.includes("property") ||
          url.includes("search")

      );





    console.log(
      "Possible API URLs:"
    );



    possibleApis
  .slice(0,50)
  .forEach(
  (api: string) =>
    console.log(api)
);



  } catch(error) {


    console.error(
      "Rightmove API scan failed:",
      error
    );


  }


}





findRightmoveAPI();