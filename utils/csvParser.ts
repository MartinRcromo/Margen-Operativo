export function detectDelimiter(line: string): string {
    const semi = (line.match(/;/g) || []).length;
    const comma = (line.match(/,/g) || []).length;
    return semi >= comma ? ";" : ",";
}

export function splitCSVLine(line: string, delim: string): string[] {
    const res = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQ && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQ = !inQ;
            }
        } else if (ch === delim && !inQ) {
            res.push(cur);
            cur = "";
        } else {
            cur += ch;
        }
    }
    res.push(cur);
    return res;
}

export function parseCSV(text: string): any[] {
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim() !== "");
    if (!lines.length) return [];
    const delim = detectDelimiter(lines[0]);
    const out = [];
    const header = splitCSVLine(lines[0], delim).map(h => h.trim());
    for (let i = 1; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i], delim);
        const obj: { [key: string]: string } = {};
        for (let c = 0; c < header.length; c++) {
            obj[header[c]] = (cols[c] ?? "").trim();
        }
        out.push(obj);
    }
    return out;
}
