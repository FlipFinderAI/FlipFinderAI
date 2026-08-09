import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaLibSql({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({
  adapter,
});


// ---------------------------------------
// Basic AI property analysis engine
// ---------------------------------------

function analyseProperty(property:any) {


  const price =
    property.price || 0;


  const value =
    property.value || price;


  const refurb =
    property.refurb || 20000;



  const uplift =
    value - price;



  const profit =
    value - price - refurb;



  const discount =
    value > 0
      ? Math.round(
          ((value-price)/value)*100
        )
      : 0;



  let score = 50;


  const findings:string[] = [];

  const risks:string[] = [];



  // Discount scoring

  if(discount >= 20){

    score += 20;

    findings.push(
      "Property appears significantly below estimated value"
    );

  }
  else if(discount >=10){

    score +=10;

    findings.push(
      "Good purchase discount"
    );

  }
  else{

    risks.push(
      "Limited discount from asking price"
    );

  }



  // Profit potential

  if(profit >=30000){

    score +=15;

    findings.push(
      "Strong profit potential"
    );

  }
  else if(profit >=15000){

    score +=8;

    findings.push(
      "Reasonable uplift opportunity"
    );

  }
  else{

    risks.push(
      "Lower margin opportunity"
    );

  }



  // Refurb risk

  if(refurb <=15000){

    score +=10;

    findings.push(
      "Likely manageable refurbishment"
    );

  }
  else{

    risks.push(
      "Higher refurbishment requirement"
    );

  }



  // Price bracket

  if(price <150000){

    score +=5;

    findings.push(
      "Lower entry price"
    );

  }



  if(score>100)
    score=100;



  let recommendation =
    "WATCH";


  if(score >=85)
    recommendation="STRONG BUY";

  else if(score >=70)
    recommendation="BUY";

  else if(score <50)
    recommendation="AVOID";



  return {


    aiScore:
      score,


    score,


    aiConfidence:
      Math.min(
        95,
        score
      ),


    aiRecommendation:
      recommendation,


    aiSummary:
      `
AI assessment:

Purchase price:
£${price.toLocaleString()}

Estimated value:
£${value.toLocaleString()}

Discount:
${discount}%

Potential profit:
£${profit.toLocaleString()}

Recommendation:
${recommendation}
      `.trim(),



    aiOpportunities:
      JSON.stringify(findings),


    aiRisks:
      JSON.stringify(risks),


    findings:
      JSON.stringify(findings),



    refurbEstimate:
      refurb,


    value,


  };

}



// ---------------------------------------
// Run analysis
// ---------------------------------------

async function main(){


  const properties =
    await prisma.property.findMany();



  console.log(
    "Analysing",
    properties.length,
    "properties"
  );



  for(const property of properties){


    const analysis =
      analyseProperty(property);



    await prisma.property.update({

      where:{
        id:property.id
      },

      data:analysis

    });



    console.log(
      "Updated:",
      property.address,
      analysis.aiRecommendation,
      analysis.aiScore
    );


  }


}



main()

.then(()=>{

 console.log(
  "AI ANALYSIS COMPLETE"
 );

})


.catch(console.error)


.finally(async()=>{

 await prisma.$disconnect();

});