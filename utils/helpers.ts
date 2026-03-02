
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
export const toNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const cleaned = val.replace(/\./g, '').replace(',', '.');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
    }
    return 0;
};

export const fmtRaw = (n?: number | null): string => {
    if (n === null || n === undefined || isNaN(n)) return "";
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
};

export const fmtM = (n?: number | null | string, displayMillions: boolean = true): string => {
    const num = typeof n === 'string' ? parseFloat(n.replace(/\./g, '').replace(',', '.')) : n;
    if (num === null || num === undefined || isNaN(num)) return "";
    if (!displayMillions) return fmtRaw(num);

    const m = num / 1_000_000;

    // Use es-AR locale to get dot as thousands separator, with no decimal places.
    return new Intl.NumberFormat("es-AR", { 
        maximumFractionDigits: 0 
    }).format(m) + " M";
};

export const fmtPrice = (n?: number | null): string => {
    if (n === null || n === undefined || isNaN(n)) return "";
    return new Intl.NumberFormat("es-AR", { 
        style: 'currency', 
        currency: 'ARS',
        maximumFractionDigits: 0 
    }).format(n);
};

export const pct2 = (x?: number | null): string => {
    if (x === null || x === undefined || isNaN(x)) return "";
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(x) + "%";
};

export function getWorkingDaysPreviousMonth(): number {
    const now = new Date();
    // Get the first day of the current month
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Subtract one day to get the last day of the previous month
    const lastDayPrevMonth = new Date(firstDayCurrentMonth.getTime() - 1);
    
    const year = lastDayPrevMonth.getFullYear();
    const month = lastDayPrevMonth.getMonth(); // 0-indexed
    
    let workingDays = 0;
    const daysInMonth = lastDayPrevMonth.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
    }
    
    return workingDays || 20; // Fallback to 20 if calculation fails
}
