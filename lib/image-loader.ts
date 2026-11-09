/**
 * Custom Next.js image loader with malicious pattern blocking and NSFW detection
 * Validates image URLs against known malicious patterns, suspicious domains, and NSFW content
 */
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';

// Initialize profanity filter for NSFW content detection
const profanityFilter = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Malicious patterns to block - focused on high-confidence threats
const MALICIOUS_PATTERNS = {
  // Block obvious malicious TLDs (check domain part, not end of URL)
  suspiciousTlds: /^https?:\/\/[^\/]*\.(tk|ml|ga|cf)(?:\/|$)/i,

  // Block URLs with obvious redirect parameters (more specific)
  suspiciousParams: /[?&](redirect|goto|r)=https?:/i,

  // Block suspicious file extensions in image URLs
  suspiciousExtensions: /\.(exe|bat|cmd|com|pif|scr|vbs|jar|app)$/i,

  // Block suspicious protocols (non-http/https)
  suspiciousProtocols: /^(?!https?:\/\/)/i,

  // Block obvious malicious subdomains (more specific)
  maliciousSubdomains: /^https?:\/\/(?:malware|virus|phishing|scam|hack)\./i,
};

// NSFW detection patterns
const NSFW_PATTERNS = {
  // Known adult content domains (major ones)
  adultDomains:
    /^https?:\/\/(?:[^\/]*\.)?(?:pornhub|xvideos|xhamster|redtube|youporn|tube8|spankbang|xnxx|chaturbate|cam4|livejasmin|stripchat|onlyfans|manyvids|clips4sale|iwantclips|fansly|justforfans)\.com/i,

  // Adult content TLDs and domain patterns
  adultTlds: /^https?:\/\/[^\/]*\.(?:xxx|sex|porn|adult)(?:\/|$)/i,

  // NSFW keywords in URLs (common explicit terms that should be blocked)
  nsfwKeywords: /(?:nsfw|pin[-_\s]?up|hentai|ecchi|lewd|r18|xxx|explicit)/i,

  // Image hosting sites often used for adult content with specific patterns
  suspiciousImageHosts:
    /^https?:\/\/(?:[^\/]*\.)?(?:imgur|imagebam|imagetwist|imgbox|postimg|imgbb|imageban|picbay)\.(?:com|org|net).*(?:nude|nsfw|adult|sex|porn|xxx)/i,

  // Social media adult content patterns
  socialAdultPatterns:
    /^https?:\/\/(?:[^\/]*\.)?(?:reddit\.com\/r\/(?:nsfw|gonewild|realgirls|nude|sex|porn)(?:\/|$)|twitter\.com\/.*(?:nude|nsfw|sex|porn)|instagram\.com\/.*(?:nude|nsfw|adult))/i,

  // File hosting with adult keywords
  fileHostingAdult:
    /^https?:\/\/(?:[^\/]*\.)?(?:mediafire|mega|dropbox|drive\.google)\.(?:com|nz).*(?:nude|nsfw|adult|sex|porn|xxx)/i,
};

// Additional security checks - relaxed
const SECURITY_CHECKS = {
  // Minimum URL length to prevent single character attacks
  minUrlLength: 8,

  // Maximum URL length to prevent buffer overflow attempts
  maxUrlLength: 4096,
};

/**
 * Checks if URL contains NSFW content patterns
 * @param url - The URL to check
 * @returns True if URL appears to contain NSFW content
 */
function containsNsfwContent(url: string): boolean {
  // Check against all NSFW patterns
  for (const [patternName, pattern] of Object.entries(NSFW_PATTERNS)) {
    if (pattern.test(url)) {
      console.warn(`Blocked NSFW content - Pattern: ${patternName}, URL: ${url}`);
      return true;
    }
  }

  // Check URL for profanity/NSFW keywords using obscenity package
  // Only check if URL is a string and not empty. Separators become spaces first: obscenity's
  // leetspeak transformer reads "/" as "l", which turns path segments into false matches
  // (since 0.4.5 it blocked every chain-registry Solana logo URL).
  if (
    typeof url === 'string' &&
    url.length > 0 &&
    profanityFilter.hasMatch(url.replace(/[/\\._\-?=&#:]+/g, ' '))
  ) {
    console.warn(`Blocked NSFW content - Profanity detected in URL: ${url}`);
    return true;
  }

  return false;
}

/**
 * Validates a URL against malicious patterns and NSFW content
 * @param url - The URL to validate
 * @returns True if URL is safe, false if potentially malicious or NSFW
 */
function isUrlSafe(url: string | null | undefined): boolean {
  // Basic validation
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check URL length
  if (url.length < SECURITY_CHECKS.minUrlLength || url.length > SECURITY_CHECKS.maxUrlLength) {
    return false;
  }

  // Allow local relative paths (start with /)
  if (url.startsWith('/')) {
    // Local paths are generally safe, just check for obvious malicious extensions
    if (MALICIOUS_PATTERNS.suspiciousExtensions.test(url)) {
      console.warn(`Blocked local file with suspicious extension: ${url}`);
      return false;
    }
    return true;
  }

  // Check for NSFW content patterns
  if (containsNsfwContent(url)) {
    return false;
  }

  // For external URLs, check for high-confidence malicious patterns only
  for (const [patternName, pattern] of Object.entries(MALICIOUS_PATTERNS)) {
    if (pattern.test(url)) {
      console.warn(`Blocked potentially malicious URL - Pattern: ${patternName}, URL: ${url}`);
      return false;
    }
  }

  // Validate external URL format
  try {
    new URL(url);
    return true;
  } catch (error) {
    console.warn(`Invalid URL format: ${url}`);
    return false;
  }
}

/**
 * Parameters for the image loader function
 */
interface ImageLoaderParams {
  /** Source URL of the image */
  src: string;
  /** Image width for optimization */
  width: number;
  /** Image quality (defaults to 75) */
  quality?: number;
}

/**
 * Custom Next.js image loader with security validation and NSFW detection
 * @param params - Loader parameters
 * @returns Validated image URL or fallback
 */
export default function imageLoader({ src, width, quality = 75 }: ImageLoaderParams): string {
  // Validate the source URL
  if (!isUrlSafe(src)) {
    // Determine the type of blocking for better error messaging
    const isNsfw = containsNsfwContent(src);

    if (isNsfw) {
      console.error(`Blocked NSFW image URL: ${src}`);
      // Return a specific fallback for NSFW content
      return '/blocked-nsfw-placeholder.svg';
    } else {
      console.error(`Blocked malicious image URL: ${src}`);
      // Return the general malicious content fallback
      return '/blocked-image-placeholder.svg';
    }
  }

  // For valid URLs, add optimization parameters
  if (src.startsWith('http')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    return url.toString();
  }

  // Fallback to the original source for non-HTTP paths (e.g., local)
  return src;
}

/**
 * Enhanced validation function for use in forms or components
 * @param url - The URL to validate
 * @returns {isValid: boolean, reason?: string} - Validation result with reason
 */
export function validateImageUrl(url: string): { isValid: boolean; reason?: string } {
  // Do basic URL safety check
  if (!isUrlSafe(url)) {
    const isNsfw = containsNsfwContent(url);
    return {
      isValid: false,
      reason: isNsfw ? 'NSFW content detected in URL' : 'URL appears malicious or invalid',
    };
  }

  return { isValid: true };
}

/**
 * Sanitize image URL for form data - removes NSFW/problematic images silently
 * @param url - The URL to sanitize
 * @returns string - Returns empty string if image should be excluded, otherwise returns the URL
 */
export function sanitizeImageUrl(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }

  const validation = validateImageUrl(url.trim());

  if (!validation.isValid) {
    console.warn(`Image excluded from form data: ${validation.reason} - ${url}`);
    return '';
  }

  return url.trim();
}
