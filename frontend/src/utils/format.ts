export const formatNaira = (price: number): string => {
    if (price >= 1000000) {
        // Check if it's a whole million (e.g., 2000000 -> 2M, 2500000 -> 2.5M)
        const millions = price / 1000000;
        // Format with up to 1 decimal place if needed, ensuring no trailing .0
        const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
        return `₦${formatted}M`;
    }

    // Format with thousand separators
    return `₦${price.toLocaleString('en-NG')}`;
};
