import 'node-fetch';
import { config } from 'dotenv';
import fs from 'fs'
config();

let API_KEYS;

const NUM_PLAYERS = 150000;
const MATCHES_PER_PLAYER = 50;

async function getMatchFromMatchID(matchID) {
	const response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=${process.env.RIOT_KEY}`);
	const json = await response.json();
    let data = '';
    if(json['info'] == undefined) {
        return data;
    }
    json.info.participants.forEach(p => {
        data += p.championName + ',';
    });
    data += json.info.participants[0].win;
	return data;
}

async function getPlayerMatchIDs(summonerName) {
	console.log('checking player: ' + summonerName);
	summonerName = encodeURIComponent(summonerName);
	try{
		const response = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${process.env.RIOT_KEY}`);
		const player = await response.json();
        if(player['id'] == undefined) {
		    console.log('Error, summoner not found: ' + summonerName);
            return [];
        }
		const puuid = player.puuid;
		const resp = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${MATCHES_PER_PLAYER}&api_key=${process.env.RIOT_KEY}`);
		const matchIDs = await resp.json();
		return matchIDs;
	}catch(error){
		console.log('Error, summoner not found: ' + summonerName);
		return [];
	}
}

async function getMatchesFromPlayers(players) {

}

async function getPlayersFromTier(tier) {
    if(tier == 'grandmaster') {
        let response = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
        let json = await response.json();
        const gmplayers = json.entries;
        response = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
        json = await response.json();
        const chplayers = json.entries;
        return gmplayers.concat(chplayers);
    }else if(tier == 'master') {
        const response = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
        const json = await response.json();
        const players = json.entries;
        return players;
    }else{
        let players = [];
        for(let i = 1; i < 51; i++) {
            const response = await fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier.toUpperCase()}/III?page=${i}&api_key=${process.env.RIOT_KEY}`)
            const json = await response.json();
            players = players.concat(json);
        }
        return players;
    }
}

async function getMatchesFromTier(tier) {

}

async function main() {
    /*
    try {
        API_KEYS = fs.readFileSync('keys.json', {
            encoding: 'utf-8'
        });
        API_KEYS = JSON.parse(API_KEYS);
    }catch(e) {
        console.log('Could not find keys.json');
        console.log('Create a file in the directory of the nodejs project called keys.json and add in a list of riotgames api keys(1 per line)');
        return;
    }
    if(API_KEYS.length == 0) {
        console.log('No API keys found, please add riot API keys to keys.json(20-30 should be enough), more api keys means faster download');
        return;
    }
    if(API_KEYS.length < 15) {
        console.log('Warning: Running on low number of API keys, download may take a while');
    }
    */

    const players = await getPlayersFromTier('diamond');
    console.log(players.length);

    /*
    
    
    const tiers = ['challenger', 'grandmaster', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron'];

    for(let i = 0; i < tiers.length; i++) {
        const uniqueMatches = getMatchesFromTier(tiers[i]);
        const uniqueMatchesArray = [...uniqueMatches];
        for(let i = 0; i < uniqueMatchesArray.length; i++) {
            const matchData = await getMatchFromMatchID(uniqueMatchesArray[i]);
            if(matchData == '') {
                continue;
            }
            fs.appendFileSync('matches/training_data.txt', matchData + '\n');
        }
    }

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
    */

    
}

main();