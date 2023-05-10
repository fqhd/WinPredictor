export function FilterChampion(filter: string, champion: string) {
    return champion
        .replace(" ", "")
        .toLowerCase()
        .includes(
            filter
                .toLowerCase()
                .replace(" ", "")
        )
}