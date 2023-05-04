import 'node-fetch';
import fs from 'fs'

let API_KEYS;
let TIME_BETWEEN_REQUESTS;
const NUM_PLAYERS = 5000;
let currentKey;
let currentKeyIndex = 0;
const MATCHES_PER_PLAYER = 50;

export function apiCall(url) {
	url += currentKey;
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			const data = await fetch(url);
			resolve(data);
		}, TIME_BETWEEN_REQUESTS);
	});
}

async function getMatchFromMatchID(matchID) {
	const response = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=`);
	const json = await response.json();
    let data = '';
    if(json['info'] == undefined) {
        return data;
    }
    json.info.participants.forEach(p => {
        data += p.championName + '\n';
    });
    data += json.info.participants[0].win;
	return data;
}

async function getPlayerMatchIDs(summonerName) {
	console.log('checking player: ' + summonerName);
	summonerName = encodeURIComponent(summonerName);
	try{
		const response = await apiCall(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=`);
		const player = await response.json();
        if(player['id'] == undefined) {
		    console.log('Error, summoner not found: ' + summonerName);
            return [];
        }
		const puuid = player.puuid;
		const resp = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${MATCHES_PER_PLAYER}&api_key=`);
		const matchIDs = await resp.json();
		return matchIDs;
	}catch(error){
		console.log('Error, summoner not found: ' + summonerName);
		return [];
	}
}

async function main() {
    API_KEYS = fs.readFileSync('keys.txt', {
        encoding: 'utf-8'
    }).split('\n');
    currentKey = API_KEYS[0];
    TIME_BETWEEN_REQUESTS = 1300 / API_KEYS.length;
    const response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=`);
    const players = await response.json();
    const numPlayers = Math.min(NUM_PLAYERS, players.entries.length);
    console.log(`Processing ${numPlayers} players`);
    const uniqueMatches = new Set();
    for (let i = 0; i < numPlayers; i++) {
        const matches = await getPlayerMatchIDs(players.entries[i].summonerName);

        matches.forEach(element => {
            uniqueMatches.add(element);
        });
        currentKeyIndex++;
        currentKey = API_KEYS[currentKeyIndex % API_KEYS.length];
    }

    const uniqueMatchesArray = [...uniqueMatches];
    for(let i = 0; i < uniqueMatchesArray.length; i++) {
        const matchData = await getMatchFromMatchID(uniqueMatchesArray[i]);
        if(matchData == '') {
            continue;
        }
        fs.writeFileSync('matches/' + i + '.txt', matchData);
        currentKeyIndex++;
        currentKey = API_KEYS[currentKeyIndex % API_KEYS.length];
        console.log(i);
    }
}

main();