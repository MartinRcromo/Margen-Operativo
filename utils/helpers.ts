
// A simple deep clone function for plain objects and arrays
export function cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    // This will handle plain objects, arrays, and their nested structures.
    // It doesn't handle functions, undefined, Dates, etc., but this app's state is JSON-serializable.
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.error("Could not deep clone object", obj, e);
        return obj; // fallback to shallow copy on error
    }
}

// Formatting functions
export const fmtRaw = (n?: number | null): string => {
    if (n === null || n === undefined || isNaN(n)) return "";
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
};

export const fmtM = (n?: number | null, displayMillions: boolean = true): string => {
    if (n === null || n === undefined || isNaN(n)) return "";
    if (!displayMillions) return fmtRaw(n);

    const m = n / 1_000_000;

    if (Math.abs(n) < 1_000_000) {
        // For values under 1M, show 2 decimal places. E.g., 500k -> 0,50 M
        return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(m) + " M";
    } else {
        // For values 1M and over, show 0 decimal places. E.g., 1.2M -> 1 M
        return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(m) + " M";
    }
};

export const pct2 = (x?: number | null): string => {
    if (x === null || x === undefined || isNaN(x)) return "";
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(x) + "%";
};
