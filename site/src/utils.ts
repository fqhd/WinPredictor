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

export function DarkOverlayImage(imageUrl: string, overlayAlpha: number = 0.7) {
    return `linear-gradient(rgba(0, 0, 0, ${overlayAlpha}) 100%, rgba(0, 0, 0, ${overlayAlpha}) 0%), url(${imageUrl})`
}