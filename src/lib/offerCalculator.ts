import { calculateFlip } from "@/lib/flipCalculator";

export type OfferCalculationInput = {
  askingPrice: number;
  resaleValue: number;
  refurbCost: number;
};

export type OfferCalculation = {
  recommendedOffer: number;
  maximumPurchasePrice: number;
  askingPrice: number;
  discountFromAsking: number;
  netProfitAtOffer: number;
  recommendation: "STRONG DEAL" | "NEGOTIATE" | "WALK AWAY";
};

export function calculateOffer(
  input: OfferCalculationInput
): OfferCalculation {
  const askingPrice = Math.max(0, input.askingPrice);
  const resaleValue = Math.max(0, input.resaleValue);
  const refurbCost = Math.max(0, input.refurbCost);

  const flipAtAsking = calculateFlip({
    purchasePrice: askingPrice,
    resaleValue,
    refurbCost,
  });

  const maximumPurchasePrice =
    flipAtAsking.maximumPurchasePrice;

  /*
   * Our target offer is slightly below the maximum
   * purchase price so there is negotiation room.
   */
  let recommendedOffer = Math.min(
    askingPrice,
    maximumPurchasePrice
  );

  if (askingPrice <= maximumPurchasePrice) {
    recommendedOffer = askingPrice;
  } else {
    recommendedOffer = Math.round(
      maximumPurchasePrice * 0.95
    );
  }

  recommendedOffer = Math.max(
    0,
    Math.round(recommendedOffer / 1000) * 1000
  );

  const flipAtOffer = calculateFlip({
    purchasePrice: recommendedOffer,
    resaleValue,
    refurbCost,
  });

  const discountFromAsking =
    askingPrice > 0
      ? ((askingPrice - recommendedOffer) /
          askingPrice) *
        100
      : 0;

  let recommendation:
    | "STRONG DEAL"
    | "NEGOTIATE"
    | "WALK AWAY";

  if (
    askingPrice <= maximumPurchasePrice &&
    flipAtAsking.netProfit >= 20000
  ) {
    recommendation = "STRONG DEAL";
  } else if (
    maximumPurchasePrice > 0 &&
    maximumPurchasePrice >= askingPrice * 0.9
  ) {
    recommendation = "NEGOTIATE";
  } else {
    recommendation = "WALK AWAY";
  }

  return {
    recommendedOffer,
    maximumPurchasePrice,
    askingPrice,
    discountFromAsking,
    netProfitAtOffer: flipAtOffer.netProfit,
    recommendation,
  };
}