import { useState } from "react";
import ChampionSelector from "./ChampionSelector";
import champions from "./champions.json"

const lanes = ["top.png", "jungle.png", "mid.png", "bot.png", "support.png"]

export default function App() {
  const [filter, setFilter] = useState("");
  const [selectedChampions, setSelectedChampions] = useState([]);
  const [pred, setPred] = useState(0.2231);
  // {selectedChampions.slice(0, 5).map(champion => (
  // <img className="champ-select-icon" src={"/champ_icons/" + champions[champion]} key={`${champion}-showcase`} />
  // ))}
  return (
    <div className="body">
      <div className="champ-show">
        {(lanes).map((lane, index) => (
          <img className="champ-select-icon" src={selectedChampions.at(index) ? "/champ_icons/" + champions[selectedChampions.at(index)] : "/lanes/" + lane} key={`${selectedChampions.at(index)}-${index}-${lane}-showcase`} />
        ))}
      </div>
      <div className="champ-area">
        <div>
          <p>Your mother told me that you have {(pred*100).toFixed(2)}% of getting bitches.</p>
          <input className="champ-filter" type="text" placeholder="Search for champions" onChange={(e) => setFilter(e.target.value)} />

          <button className="domagicstuffbutton" onClick={() => {
            // magic
            setPred(Math.random())
          }}>Hello</button>
        </div>
        <ChampionSelector filter={filter} selectedChampions={selectedChampions} setSelectedChampions={setSelectedChampions} />
      </div>
      <div className="champ-show">
        {(lanes).map((lane, index) => (
          <img className="champ-select-icon" src={selectedChampions.at(index + 5) ? "/champ_icons/" + champions[selectedChampions.at(index + 5)] : "/lanes/" + lane} key={`${selectedChampions.at(index + 5)}-${lane}-${index + 5}-showcase`} />
        ))}
      </div>
    </div>
  )
}