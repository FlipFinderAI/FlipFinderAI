export function getScoreBreakdown(property: any) {

  const profit =
    property.value -
    property.price -
    property.refurb;


  const discount =
    ((property.value - property.price) /
    property.value) * 100;


  const investment =
    property.price +
    property.refurb;


  const roi =
    (profit / investment) * 100;



  let discountScore = 0;

  if (discount >= 25) {
    discountScore = 35;
  } else if (discount >= 15) {
    discountScore = 25;
  } else if (discount >= 10) {
    discountScore = 15;
  }



  let profitScore = 0;

  if (profit >= 50000) {
    profitScore = 30;
  } else if (profit >= 30000) {
    profitScore = 25;
  } else if (profit >= 15000) {
    profitScore = 15;
  }



  let roiScore = 0;

  if (roi >= 25) {
    roiScore = 20;
  } else if (roi >= 15) {
    roiScore = 15;
  } else if (roi >= 10) {
    roiScore = 10;
  }



  let rentalScore = 0;

  if (property.rent) {

    const yieldPercent =
      ((property.rent * 12) /
      property.price) * 100;


    if (yieldPercent >= 7) {
      rentalScore = 10;
    } else if (yieldPercent >= 5) {
      rentalScore = 7;
    }

  }



  let riskScore = 0;

  if (property.refurb <= 20000) {
    riskScore = 10;
  } else if (property.refurb <= 40000) {
    riskScore = 5;
  }



  return {

    discount: discountScore,

    profit: profitScore,

    roi: roiScore,

    rental: rentalScore,

    risk: riskScore,

    total:
      discountScore +
      profitScore +
      roiScore +
      rentalScore +
      riskScore

  };

}