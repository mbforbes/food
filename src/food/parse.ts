/**
 * @returns a number OR null if the quantity could not be parsed
 */
function getQuantity(s: string): number {
    if (QUANT_MAP.has(s)) {
        return QUANT_MAP.get(s);
    }
    let candidate = parseFloat(s);
    if (isNaN(candidate)) {
        return null;
    }
    return candidate;
}

/**
 * @returns a unit string OR null if unit not recognized
 */
function getUnit(s: string): string {
    if (KNOWN_UNITS.has(s)) {
        return s;
    }
    return null;
}

/**
 * @returns [quantity, unit, thing]
 */
function getQUT(pieces: string[]): [number, string, string] {
    // edge case: not enough (just one str)
    if (pieces.length < 2) {
        return [1, 'x', pieces.join(' ')];
    }

    // edge case: only two things: can't have unit
    if (pieces.length == 2) {
        let quantity = getQuantity(pieces[0]);
        if (quantity == null) {
            // if no quantity specified, return the whole name
            return [1, 'x', pieces.join(' ')];
        } else {
            // good quantity specified; use it
            return [quantity, 'x', pieces[1]];
        }
    }

    // "normal" case: possibly quantity, possibly unit
    let quantity = getQuantity(pieces[0]);
    if (quantity == null) {
        // if no quantity specified, return the whole name
        return [1, 'x', pieces.join(' ')];
    }
    // we have a quantity. see whether a unit.
    let unit = getUnit(pieces[1])
    if (unit == null) {
        // unit not known, but we have a quantity. include index 1 in name.
        return [quantity, 'x', pieces.slice(1).join(' ')];
    }
    // we have quantity AND unit. woohoo!
    return [quantity, unit, pieces.slice(2).join(' ')];
}
