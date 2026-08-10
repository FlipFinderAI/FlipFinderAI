import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";


const adapter = new PrismaLibSql({
  url:"file:./dev.db"
});


const prisma = new PrismaClient({
  adapter
});



function normaliseType(type:string|null){

if(!type) return "";

return type
.toLowerCase()
.replace(" house","")
.replace(" flat","")
.trim();

}




function refurbEstimate(property:any){

let refurb = 20000;


if(property.type?.toLowerCase().includes("flat")){
    refurb = 10000;
}


if(property.bedrooms >= 4){
    refurb += 5000;
}


if(
property.epcRating === "E" ||
property.epcRating === "F" ||
property.epcRating === "G"
){
    refurb += 10000;
}


return refurb;

}




function postcodeArea(postcode:string|null){

if(!postcode) return "";

return postcode
.replace(/\s+/g,"")
.substring(0,4)
.toUpperCase();

}





async function getComparableValue(property:any){


const area =
postcodeArea(property.postcode);



const targetType =
normaliseType(property.type);



const sold =
await prisma.property.findMany({

where:{

postcode:{
startsWith:area
}

}

});



const scored =
sold
.filter(p=>p.id !== property.id)
.map(p=>{


let score = 0;



if(
normaliseType(p.type) === targetType
){
score += 30;
}



if(
p.bedrooms &&
property.bedrooms &&
p.bedrooms === property.bedrooms
){
score += 30;
}



if(
p.floorArea &&
property.floorArea
){

const difference =
Math.abs(
p.floorArea-property.floorArea
)
/
property.floorArea;


if(difference < 0.25){

score += 20;

}

}



if(
p.epcRating === property.epcRating
){

score +=10;

}



return {

price:p.price,
score

};


})
.filter(x=>x.score>=50)
.sort(
(a,b)=>b.score-a.score
);



if(scored.length===0){

return {

value:property.price,
confidence:20,
comparables:[]

};

}



const best =
scored.slice(0,5);



const average =
Math.round(

best.reduce(
(sum,p)=>sum+p.price,
0
)
/best.length

);



return {

value:average,

confidence:
Math.min(
95,
50 + best.length*10
),

comparables:best

};


}





async function main(){


const properties =
await prisma.property.findMany();



console.log(
"Improving valuation for",
properties.length,
"properties"
);



for(const property of properties){


const valuation =
await getComparableValue(property);



const refurb =
refurbEstimate(property);



const totalCost =
property.price +
refurb +
5000;



const profit =
valuation.value -
totalCost;



let recommendation =
"PASS";

let score = 50;



if(
profit > 30000 &&
valuation.confidence >=70
){

recommendation="BUY";
score=90;

}
else if(
profit >15000
){

recommendation="WATCH";
score=70;

}



await prisma.property.update({

where:{
id:property.id
},

data:{


estimatedValue:
valuation.value,


totalRefurbCost:
refurb,


aiScore:
score,


aiRecommendation:
recommendation,


aiSummary:
`
Estimated value:
£${valuation.value}

Purchase price:
£${property.price}

Refurb:
£${refurb}

Total costs:
£${totalCost}

Potential profit:
£${profit}

Confidence:
${valuation.confidence}%

Comparable properties:
${valuation.comparables.length}

Recommendation:
${recommendation}
`

}

});



console.log(
property.address,
"Value:",
valuation.value,
"Profit:",
profit,
recommendation,
"Confidence:",
valuation.confidence+"%"
);



}



}



main()

.then(()=>{

console.log(
"VALUATION IMPROVED"
);

})

.catch(console.error)

.finally(async()=>{

await prisma.$disconnect();

});