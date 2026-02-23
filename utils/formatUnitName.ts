/**
 * Format unit names with proper Romanian singular/plural forms
 * @param quantity - The quantity to determine singular/plural
 * @param unitName - The unit name from the database
 * @returns Formatted unit name in Romanian
 */
export function formatUnitName(quantity: number, unitName?: string): string {
  if (!unitName) {
    // Default to bucată/bucăți if no unit name
    return quantity === 1 ? 'bucată' : 'bucăți';
  }

  // Normalize the unit name to lowercase for comparison
  const normalized = unitName.toLowerCase().trim();

  // Handle common unit names with proper Romanian pluralization
  switch (normalized) {
    case 'bucată':
    case 'bucata':
    case 'buc':
    case 'piece':
    case 'set':
      return quantity === 1 ? 'bucată' : 'bucăți';
    
    case 'kilogram':
    case 'kg':
      return 'kg';
    
    case 'gram':
    case 'g':
      return 'g';
    
    case 'litru':
    case 'liter':
    case 'l':
      return quantity === 1 ? 'litru' : 'litri';
    
    case 'mililitru':
    case 'ml':
      return 'ml';
    
    case 'metru':
    case 'meter':
    case 'm':
      return quantity === 1 ? 'metru' : 'metri';
    
    case 'centimetru':
    case 'cm':
      return 'cm';
    
    case 'pachet':
    case 'package':
      return quantity === 1 ? 'pachet' : 'pachete';
    
    case 'cutie':
    case 'box':
      return quantity === 1 ? 'cutie' : 'cutii';
    
    default:
      // For unknown units, return as-is (might be already in Romanian)
      return unitName;
  }
}

/**
 * Get short unit name (for compact display)
 */
export function getShortUnitName(unitName?: string): string {
  if (!unitName) return 'buc';

  const normalized = unitName.toLowerCase().trim();

  switch (normalized) {
    case 'bucată':
    case 'bucata':
    case 'piece':
    case 'set':
      return 'buc';
    case 'kilogram':
      return 'kg';
    case 'gram':
      return 'g';
    case 'litru':
    case 'liter':
      return 'l';
    case 'mililitru':
      return 'ml';
    case 'metru':
    case 'meter':
      return 'm';
    case 'centimetru':
      return 'cm';
    default:
      return unitName;
  }
}
