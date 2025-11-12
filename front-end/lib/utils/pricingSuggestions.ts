/**
 * Pricing suggestions and competitiveness scoring for marketplace listings
 * Based on actual Walrus system pricing (non-linear due to metadata overhead)
 */

export interface CompetitivenessScore {
  score: number; // 0-100
  label: string;
  color: string; // Tailwind color class
}

/**
 * Calculate suggested competitive price (10% below system price)
 */
export function calculateSuggestedPrice(totalSystemPrice: number): number {
  const SUGGESTED_DISCOUNT = 0.10; // 10% discount
  return totalSystemPrice * (1 - SUGGESTED_DISCOUNT);
}

/**
 * Calculate suggested price per unit (MiB per epoch)
 */
export function calculateSuggestedPricePerUnit(
  totalSystemPrice: number,
  totalStorageMiB: number,
  totalEpochs: number
): number {
  const suggestedTotalPrice = calculateSuggestedPrice(totalSystemPrice);
  const totalUnits = totalStorageMiB * totalEpochs;
  return totalUnits > 0 ? suggestedTotalPrice / totalUnits : 0;
}

/**
 * Get competitiveness score based on price difference from system price
 */
export function getCompetitivenessScore(
  userPrice: number,
  systemPrice: number
): CompetitivenessScore {
  if (systemPrice <= 0) {
    return {
      score: 0,
      label: "Unable to calculate",
      color: "text-gray-500",
    };
  }

  const percentageDifference = ((userPrice - systemPrice) / systemPrice) * 100;

  // Score based on pricing competitiveness
  if (percentageDifference < -20) {
    return {
      score: 95,
      label: "Extremely competitive",
      color: "text-green-600",
    };
  } else if (percentageDifference < -10) {
    return {
      score: 80,
      label: "Very competitive",
      color: "text-green-500",
    };
  } else if (percentageDifference < -5) {
    return {
      score: 65,
      label: "Competitive",
      color: "text-green-400",
    };
  } else if (percentageDifference < 0) {
    return {
      score: 50,
      label: "Slightly competitive",
      color: "text-yellow-500",
    };
  } else if (percentageDifference < 10) {
    return {
      score: 35,
      label: "Slightly expensive",
      color: "text-orange-400",
    };
  } else if (percentageDifference < 25) {
    return {
      score: 20,
      label: "Expensive",
      color: "text-orange-500",
    };
  } else {
    return {
      score: 5,
      label: "Unlikely to sell",
      color: "text-red-500",
    };
  }
}

/**
 * Format price difference percentage for display
 */
export function formatPriceDifference(percentage: number): {
  text: string;
  color: string;
} {
  const absPercentage = Math.abs(percentage);

  if (percentage > 0) {
    return {
      text: `${absPercentage.toFixed(1)}% more expensive than system storage`,
      color: "text-orange-500",
    };
  } else if (percentage < 0) {
    return {
      text: `${absPercentage.toFixed(1)}% cheaper than system storage`,
      color: "text-green-500",
    };
  } else {
    return {
      text: "Matches system storage price",
      color: "text-gray-500",
    };
  }
}
