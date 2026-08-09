import { DealRating } from "./dealScore";

export function getDealRatingLabel(rating: DealRating): string {
  switch (rating) {
    case "EXCELLENT":
      return "🔥 Excellent Deal";

    case "STRONG":
      return "🟢 Strong Candidate";

    case "INVESTIGATE":
      return "🟡 Investigate";

    case "WEAK":
      return "🟠 Weak Deal";

    default:
      return "🔴 Ignore";
  }
}

export function getDealRatingClass(rating: DealRating): string {
  switch (rating) {
    case "EXCELLENT":
      return "bg-green-600 text-white";

    case "STRONG":
      return "bg-green-500 text-white";

    case "INVESTIGATE":
      return "bg-yellow-400 text-black";

    case "WEAK":
      return "bg-orange-400 text-black";

    default:
      return "bg-red-500 text-white";
  }
}