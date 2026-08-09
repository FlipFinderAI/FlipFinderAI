export function generateAISummary(property: any) {


  const profit =
    property.value -
    property.price -
    property.refurb;



  const discount =
    Math.round(
      ((property.value - property.price) /
      property.value) * 100
    );



  const investment =
    property.price +
    property.refurb;



  const roi =
    Math.round(
      (profit / investment) * 100
    );



  let summary = "";



  if (property.score >= 90) {

    summary =
      `This is an exceptional opportunity. The property is approximately ${discount}% below estimated market value and could create around £${profit.toLocaleString()} equity after refurbishment. With an estimated ROI of ${roi}%, this deal deserves immediate investigation.`;

  } 
  
  else if (property.score >= 80) {

    summary =
      `This property shows strong investment potential. It offers approximately ${discount}% discount to estimated value and could create around £${profit.toLocaleString()} uplift after refurbishment. The estimated ROI is ${roi}%, making it a worthwhile opportunity to investigate.`;

  } 
  
  else if (property.score >= 70) {

    summary =
      `This property has potential but requires further investigation. The estimated uplift is around £${profit.toLocaleString()} with a discount of ${discount}% to market value. Due diligence is recommended before proceeding.`;

  } 
  
  else {

    summary =
      `This property currently shows limited opportunity. The potential uplift and risk factors should be carefully reviewed before committing funds.`;

  }



  return summary;

}