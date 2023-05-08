import champions from "./champions.json"

function ChampionBox({ champion, onClick, isSelected }) {
    const classList = ["champ-select-icon"]

    if(isSelected) classList.push("champ-select-selected")

    return (
        <img
            key={`select-${champion}`}
            src={"/champ_icons/" + champions[champion]}
            className={classList.join(" ")}
            onClick={onClick}
        />
    )
}

export default function ChampionSelector({ filter, selectedChampions, setSelectedChampions }) {

    return (
        <div className="champ-select">
            {Object.keys(champions).filter(champion => champion.replace(" ", "").toLowerCase().includes(filter.replace(" ", "").toLowerCase())).map(champion => <ChampionBox champion={champion} key={`${champion}-select`} isSelected={selectedChampions.includes(champion)}
            onClick={() => {
                if(selectedChampions.includes(champion)) setSelectedChampions(selectedChampions.filter(champ => champ != champion))
                else {
                    if(selectedChampions.length == 10) return 
                    setSelectedChampions([...selectedChampions, champion])
                }
            }}
            />)}
        </div>
    )
}