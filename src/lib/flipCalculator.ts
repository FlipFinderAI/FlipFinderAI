
export type FlipCalculationInput = {
  purchasePrice: number;
  resaleValue: number;
  refurbCost: number;
};

export type FlipCalculation = {
  purchasePrice: number;
  resaleValue: number;
  stampDuty: number;
  legalCosts: number;
  refurbCost: number;
  financeCosts: number;
  sellingCosts: number;
  totalProjectCost: number;
  netProfit: number;
  roi: number;
  maximumPurchasePrice: number;
  recommendedOffer: number;
  targetProfit: number;
};

function calculateStampDuty(
  purchasePrice: number
): number {
  if (purchasePrice <= 125000) {
    return Math.round(purchasePrice * 0.05);
  }

  if (purchasePrice <= 250000) {
    return (
      6250 +
      Math.round(
        (purchasePrice - 125000) * 0.07
      )
    );
  }

  if (purchasePrice <= 925000) {
    return (
      15000 +
      Math.round(
        (purchasePrice - 250000) * 0.10
      )
    );
  }

  if (purchasePrice <= 1500000) {
    return (
      82500 +
      Math.round(
        (purchasePrice - 925000) * 0.15
      )
    );
  }

  return (
    168750 +
    Math.round(
      (purchasePrice - 1500000) * 0.17
    )
  );
}

export function calculateFlip(
  input: FlipCalculationInput
): FlipCalculation {
  const purchasePrice = Math.max(
    0,
    input.purchasePrice
  );

  const resaleValue = Math.max(
    0,
    input.resaleValue
  );

  const refurbCost = Math.max(
    0,
    input.refurbCost
  );

  const legalCosts = 2000;

  const targetProfit = 20000;

  /*
   * Finance allowance.
   *
   * We currently allow 3% of the purchase
   * price for finance costs.
   */

  const financeCosts = Math.round(
    purchasePrice * 0.03
  );

  /*
   * Selling costs.
   *
   * We currently allow 1.5% of the
   * resale value.
   */

  const sellingCosts = Math.round(
    resaleValue * 0.015
  );

  /*
   * Stamp Duty.
   */

  const stampDuty =
    calculateStampDuty(purchasePrice);

  /*
   * Total project cost.
   */

  const totalProjectCost =
    purchasePrice +
    stampDuty +
    legalCosts +
    refurbCost +
    financeCosts +
    sellingCosts;

  /*
   * Net profit.
   */

  const netProfit =
    resaleValue -
    totalProjectCost;

  /*
   * ROI.
   */

  const roi =
    totalProjectCost > 0
      ? (netProfit / totalProjectCost) * 100
      : 0;

  /*
   * ------------------------------------------------
   * MAXIMUM PURCHASE PRICE
   * ------------------------------------------------
   *
   * Work backwards from the resale value to
   * determine the highest purchase price that
   * should still leave approximately £20,000
   * net profit.
   *
   * SDLT and finance costs depend on the
   * purchase price, so we test possible
   * purchase prices in £100 increments.
   */

  let maximumPurchasePrice = 0;

  for (
    let testPrice = 0;
    testPrice <= resaleValue;
    testPrice += 100
  ) {
    const testStampDuty =
      calculateStampDuty(testPrice);

    const testFinance =
      Math.round(testPrice * 0.03);

    const testTotal =
      testPrice +
      testStampDuty +
      legalCosts +
      refurbCost +
      testFinance +
      sellingCosts;

    const testProfit =
      resaleValue -
      testTotal;

    if (testProfit >= targetProfit) {
      maximumPurchasePrice =
        testPrice;
    }
  }

  /*
   * Recommended offer.
   *
   * We deliberately offer approximately
   * 5% below the maximum purchase price.
   *
   * This leaves some room for negotiation
   * and unexpected costs.
   */

  const recommendedOffer =
    Math.max(
      0,
      Math.round(
        (maximumPurchasePrice * 0.95) /
          1000
      ) * 1000
    );

  return {
    purchasePrice,
    resaleValue,
    stampDuty,
    legalCosts,
    refurbCost,
    financeCosts,
    sellingCosts,
    totalProjectCost,
    netProfit,
    roi,
    maximumPurchasePrice,
    recommendedOffer,
    targetProfit,
  };
}
