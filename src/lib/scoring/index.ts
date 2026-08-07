type ScoringInput = {
  services?: string[] | null;
  technologies?: string[] | null;
  companySize?: string | null;
  source?: string | null;
  description?: string | null;
};

export type ScoringWeights = {
  wordpress: number;
  woocommerce: number;
  smallMediumAgency: number;
  hiring: number;
  remoteFriendly: number;
  specialtyTech: number;
};

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  wordpress: 20,
  woocommerce: 20,
  smallMediumAgency: 15,
  hiring: 20,
  remoteFriendly: 15,
  specialtyTech: 10,
};

const WORDPRESS_KEYWORDS = ["wordpress", "wp"];
const WOOCOMMERCE_KEYWORDS = ["woocommerce", "woo"];
const SMALL_MEDIUM_SIZES = ["1-10", "11-50", "solo", "small", "medium"];
const REMOTE_KEYWORDS = ["remote", "distributed", "remote-friendly"];
const HIRING_KEYWORDS = ["hiring", "developers wanted", "looking for developer"];
const SPECIALTY_TECH = ["elementor", "divi", "acf", "php", "laravel", "react", "next.js"];

function textIncludesAny(text: string | null | undefined, keywords: string[]) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function listIncludesAny(list: string[] | null | undefined, keywords: string[]) {
  if (!list?.length) return false;
  const lower = list.map((v) => v.toLowerCase());
  return keywords.some((k) => lower.some((v) => v.includes(k)));
}

/**
 * Simple rule-based lead score (0-100). No ML — just weighted heuristics
 * tuned for a WordPress/WooCommerce freelancer targeting small/medium agencies.
 */
export function calculateLeadScore(input: ScoringInput, weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS): number {
  let score = 0;

  if (
    listIncludesAny(input.services, WORDPRESS_KEYWORDS) ||
    listIncludesAny(input.technologies, WORDPRESS_KEYWORDS) ||
    textIncludesAny(input.description, WORDPRESS_KEYWORDS)
  ) {
    score += weights.wordpress;
  }

  if (
    listIncludesAny(input.services, WOOCOMMERCE_KEYWORDS) ||
    listIncludesAny(input.technologies, WOOCOMMERCE_KEYWORDS) ||
    textIncludesAny(input.description, WOOCOMMERCE_KEYWORDS)
  ) {
    score += weights.woocommerce;
  }

  if (input.companySize && SMALL_MEDIUM_SIZES.some((s) => input.companySize!.toLowerCase().includes(s))) {
    score += weights.smallMediumAgency;
  }

  if (textIncludesAny(input.description, HIRING_KEYWORDS) || textIncludesAny(input.source, HIRING_KEYWORDS)) {
    score += weights.hiring;
  }

  if (textIncludesAny(input.description, REMOTE_KEYWORDS)) {
    score += weights.remoteFriendly;
  }

  if (listIncludesAny(input.technologies, SPECIALTY_TECH)) {
    score += weights.specialtyTech;
  }

  return Math.max(0, Math.min(100, score));
}

export function leadScoreLabel(score: number): { label: string; tone: "success" | "info" | "warning" | "neutral" } {
  if (score >= 85) return { label: "Excellent", tone: "success" };
  if (score >= 70) return { label: "Strong", tone: "info" };
  if (score >= 50) return { label: "Good", tone: "warning" };
  return { label: "Low", tone: "neutral" };
}
