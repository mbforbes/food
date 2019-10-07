function sortedMapKeys(m: Map<string, number>): string[] {
    let flattened: string[] = [];

    for (let key of m.keys()) {
        flattened.push(key);
    }

    return flattened.sort((a, b) => {
        return JSON.parse(a).thing.localeCompare(JSON.parse(b).thing)
    });
}


function incrementCounter<K>(map: Map<K, number>, key: K): void {
    let val = 1;
    if (map.has(key)) {
        val = map.get(key) + 1;
    }
    map.set(key, val);
}
