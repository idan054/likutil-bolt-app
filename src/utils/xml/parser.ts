/**
 * Extracts the integer value from an XML response string
 */
export const extractIntFromXml = (xmlString: string): number | null => {
  try {
    const match = xmlString.match(/<int[^>]*>([^<]+)<\/int>/);
    if (!match) return null;
    return parseInt(match[1], 10);
  } catch (error) {
    console.error('[xml.parser] Failed to parse XML:', error);
    return null;
  }
};