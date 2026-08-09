import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";


const adapter = new PrismaLibSql({
  url:"file:./dev.db"
});


const prisma = new PrismaClient({
  adapter
});



function estimateRefurb(property:any){


let cost = 0;


if(property.type?.includes("Flat")){
    cost += 10000;
}
else{
    cost += 20000;
}



if(property.bedrooms >= 4){
    cost += 5000;
}


if(property.epcRating === "E" ||
   property.epcRating === "F" ||
   property.epcRating === "G"){
    cost += 10000;
}


return cost;

}





async function findComparableValue(property:any){


const postcodePrefix =
property.postcode
?.substring(0,4);



const comparables =
await prisma.property.findMany({

where:{

postcode:{
startsWith:postcodePrefix
},

type:
property.type,

bedrooms:
property.bedrooms

}

});



if(comparables.length < 2){

return property.price;

}



const prices =
comparables
.map(
p=>p.price
)
.filter(
p=>p>0
);



const average =
prices.reduce(
(a,b)=>a+b,
0
)
/
prices.length;



return Math.round(average);



}






async function main(){


const properties =
await prisma.property.findMany();



console.log(
"Analysing",
properties.length,
"properties"
);



for(const property of properties){



const marketValue =
await findComparableValue(property);



const refurb =
estimateRefurb(property);



const costs =
property.price
+
refurb
+
5000;



const profit =
marketValue
-
costs;



let recommendation =
"PASS";


let score = 50;



if(profit > 30000){

recommendation="BUY";

score=85;

}

else if(profit > 15000){

recommendation="WATCH";

score=70;

}



await prisma.property.update({

where:{
id:property.id
},

data:{


estimatedValue:
marketValue,


totalRefurbCost:
refurb,


aiScore:
score,


aiRecommendation:
recommendation,


aiSummary:

`
Market value estimate:
£${marketValue}

Purchase price:
£${property.price}

Refurb estimate:
£${refurb}

Total costs:
£${costs}

Potential profit:
£${profit}

Recommendation:
${recommendation}
`

}


});



console.log(
property.address,
"Value:",
marketValue,
"Profit:",
profit,
recommendation
);



}



}



main()

.then(()=>{

console.log(
"BMV ANALYSIS COMPLETE"
);

})

.catch(console.error)

.finally(async()=>{

await prisma.$disconnect();

});