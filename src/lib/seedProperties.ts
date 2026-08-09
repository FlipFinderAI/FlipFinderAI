import prisma from "@/lib/prisma";

async function main() {
await prisma.property.createMany({
data: [
{
externalId: "TEST-001",
address: "12 Example Street, Leeds",
postcode: "LS8 4AA",
type: "Terraced",
description: "Test property for FlipFinderAI",
listingUrl: null,
agent: "Test Agent",
source: "Test",
images: JSON.stringify([]),
price: 180000,
estimatedValue: 250000,
soldComparableAvg: 245000,
discountPercent: 28,
bedrooms: 3,
bathrooms: 1,
floorArea: 90,
tenure: "Freehold",
epcRating: "D",
refurbRequired: true,
kitchenCost: 8000,
bathroomCost: 5000,
decorationCost: 4000,
extensionCost: 0,
totalRefurbCost: 17000,
purchaseCosts: 5000,
stampDuty: 0,
legalCosts: 2000,
totalInvestment: 204000,
resaleValue: 250000,
potentialProfit: 46000,
rentalValue: 12000,
yield: 6.67,
aiScore: 82,
aiConfidence: 90,
aiRecommendation: "Strong potential",
aiSummary:
"Good potential BMV property with scope for refurbishment and value improvement.",
aiOpportunities:
"Kitchen modernisation, bathroom upgrade and general decoration.",
aiRisks:
"Refurbishment costs may increase and resale value depends on local market conditions.",
photoAnalysis: null,
detectedIssues: null,
refurbPlan: null,
valuationReasoning:
"Estimated using comparable properties and local market conditions.",
comparableAnalysis:
"Comparable properties suggest an estimated value around £250,000.",
marketAnalysis:
"Leeds market conditions support the estimated resale value.",
aiTrainingData: null,
actualOutcome: null,
dealSuccessful: null,
},
{
externalId: "TEST-002",
address: "45 Example Road, Leeds",
postcode: "LS14 2BB",
type: "Semi-detached",
description: "Second test property for FlipFinderAI",
listingUrl: null,
agent: "Test Agent",
source: "Test",
images: JSON.stringify([]),
price: 210000,
estimatedValue: 290000,
soldComparableAvg: 285000,
discountPercent: 28,
bedrooms: 4,
bathrooms: 2,
floorArea: 120,
tenure: "Freehold",
epcRating: "E",
refurbRequired: true,
kitchenCost: 10000,
bathroomCost: 7000,
decorationCost: 5000,
extensionCost: 15000,
totalRefurbCost: 37000,
purchaseCosts: 5000,
stampDuty: 0,
legalCosts: 2500,
totalInvestment: 254500,
resaleValue: 290000,
potentialProfit: 35500,
rentalValue: 15000,
yield: 7.14,
aiScore: 76,
aiConfidence: 86,
aiRecommendation: "Worth investigating",
aiSummary:
"Good-sized property with significant potential after refurbishment.",
aiOpportunities:
"Kitchen, bathrooms, decoration and possible extension.",
aiRisks:
"Higher refurbishment requirement means costs need to be controlled.",
photoAnalysis: null,
detectedIssues: null,
refurbPlan: null,
valuationReasoning:
"Estimated using comparable four-bedroom properties in the area.",
comparableAnalysis:
"Comparable sales indicate a potential value around £290,000.",
marketAnalysis:
"The local market supports demand for improved family homes.",
aiTrainingData: null,
actualOutcome: null,
dealSuccessful: null,
},
{
externalId: "TEST-003",
address: "78 Example Avenue, Leeds",
postcode: "LS17 7CC",
type: "Detached",
description: "Third test property for FlipFinderAI",
listingUrl: null,
agent: "Test Agent",
source: "Test",
images: JSON.stringify([]),
price: 165000,
estimatedValue: 205000,
soldComparableAvg: 200000,
discountPercent: 20,
bedrooms: 3,
bathrooms: 1,
floorArea: 100,
tenure: "Freehold",
epcRating: "D",
refurbRequired: true,
kitchenCost: 7000,
bathroomCost: 5000,
decorationCost: 3000,
extensionCost: 0,
totalRefurbCost: 15000,
purchaseCosts: 4000,
stampDuty: 0,
legalCosts: 2000,
totalInvestment: 186000,
resaleValue: 205000,
potentialProfit: 19000,
rentalValue: 12000,
yield: 7.27,
aiScore: 69,
aiConfidence: 82,
aiRecommendation: "Moderate potential",
aiSummary:
"Potentially viable refurbishment opportunity, but the margin is tighter.",
aiOpportunities:
"Kitchen upgrade, bathroom improvement and decoration.",
aiRisks:
"Lower profit margin leaves less room for unexpected refurbishment costs.",
photoAnalysis: null,
detectedIssues: null,
refurbPlan: null,
valuationReasoning:
"Estimated using local comparable properties.",
comparableAnalysis:
"Comparable properties indicate a potential value around £205,000.",
marketAnalysis:
"Demand for improved properties remains reasonable in the local area.",
aiTrainingData: null,
actualOutcome: null,
dealSuccessful: null,
},
],
});

console.log("Test properties created successfully.");
}

main()
.catch((error) => {
console.error(error);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});
