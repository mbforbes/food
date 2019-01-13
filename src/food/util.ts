function sortedMapKeys(m: Map<string, number>): string[] {
    let flattened: string[] = [];

    for (let key of m.keys()) {
        flattened.push(key);
    }

    return flattened.sort((a, b) => {
        return JSON.parse(a).thing.localeCompare(JSON.parse(b).thing)
    });
}
