/**
 * Formats a date string in various formats
 */

export const formatDate = (dateStr: string, format: 'full' | 'short' | 'medium' = 'medium'): string => {
    const date = new Date(dateStr);
    
    switch (format) {
        case 'full':
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'short':
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        case 'medium':
        default:
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
    }
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Get demo date for testing (Feb 9, 2026)
 */
export const getDemoDate = (): string => {
    return '2026-02-09';
};

/**
 * Compare two date strings
 */
export const compareDates = (date1: string, date2: string): number => {
    return date1.localeCompare(date2);
};
