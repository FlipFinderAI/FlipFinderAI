import axios from "axios";
import * as cheerio from "cheerio";


async function main() {

  const url =
    "https://www.onthemarket.com/for-sale/property/ls8/";


  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0"
    }
  });


  const $ = cheerio.load(response.data);


  console.log("TITLE:");
  console.log($("title").text());


  console.log("\nPossible links:");

  $("a").each((_, el) => {

    const href = $(el).attr("href");

    if (
      href &&
      href.includes("/details/")
    ) {
      console.log(href);
    }

  });


}


main();