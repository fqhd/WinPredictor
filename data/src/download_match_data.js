import 'node-fetch';
import fs from 'fs'
import { config } from 'dotenv';
let API_KEYS;
let TIME_BETWEEN_REQUESTS = 1300;
const NUM_PLAYERS = 10000;
const MATCHES_PER_PLAYER = 20;
config();

export function apiCall(url) {
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			const data = await fetch(url);
			resolve(data);
		}, TIME_BETWEEN_REQUESTS);
	});
}

const queueIdMap = [];
queueIdMap[400] = 'Normal';
queueIdMap[420] = 'SoloDuo';
queueIdMap[430] = 'Blind';
queueIdMap[440] = 'Flex';
queueIdMap[450] = 'Aram';

class Game {
	constructor(match, matchID, rank) {
		this.baronTimer = 0;
		this.elderTimer = 0;
		this.state = {
			teams: [],
			time: 0,
			rank, // Iron Bronze Silver etc...
			queueId: queueIdMap[match.info.queueId], // Either Normal, SoloDuo, Flex, Blind, or Aram,
			matchID
		};
		for(let i = 0; i < 2; i++) {
			const team = {
				players: [],
				hasBaron: false,
				hasSoul: false,
				numDrakes: 0,
				hasElder: 0,
				numTurrets: 0,
				numInhibs: 0,
				baronCounter: 0,
				elderCounter: 0,
				numRifts: 0
			};
			for(let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				team.players.push({
					maxHealth: 0,
					currentHealth: 0,
					position: [0, 0],
					champion: match.info.participants[playerIndex].championName,
					mastery: 0, 
					totalGold: 0,
					alive: true,
					level: 1, // Initialize using frame
					kills: 0,
					deaths: 0,
					assists: 0,
					creepscore: 0,
					wardscore: 0,
					xp: 0 // Initialize using frame
				});
			}
			this.state.teams.push(team);
		}
	}

	async init(match, key) {
		for(let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				const encryptedSummonerID = match.info.participants[playerIndex].summonerId;
				const championID = match.info.participants[playerIndex].championId;
				const response = await apiCall(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerID}/by-champion/${championID}?api_key=${key}`)
				const json = await response.json();
				this.state.teams[i].players[j].mastery = json.championPoints;
			}
		}
	}

	update(frame) {
		for(let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				this.state.teams[i].players[i].maxHealth = frame.participantFrames[playerIndex.toString()].championStats.healthMax;
				this.state.teams[i].players[i].currentHealth = frame.participantFrames[playerIndex.toString()].championStats.health;
				this.state.teams[i].players[i].position[0] = frame.participantFrames[playerIndex.toString()].position.x;
				this.state.teams[i].players[i].position[1] = frame.participantFrames[playerIndex.toString()].position.y;
				this.state.teams[i].players[i].totalGold = frame.participantFrames[playerIndex.toString()].totalGold;
				this.state.teams[i].players[i].level = frame.participantFrames[playerIndex.toString()].level;
				this.state.teams[i].players[i].xp = frame.participantFrames[playerIndex.toString()].xp;
			}
		}
		// Loop through events and update stats
		for (const event of frame.events) {
			switch(event.type) {
				case 'CHAMPION_KILL':
					this.processChampkill(event);
					break;
				case 'ELITE_MONSTER_KILL':
					this.processMonsterKilla(event);
			}
		}
		
		for (const team of this.state.teams) {
			team.hasElder = false;
			team.hasBaron = false;
			if(team.baronCounter > 0) {
				team.hasBaron = true;
			}
			if(team.elderCounter > 0) {
				team.hasElder = true;
			}
			team.baronCounter -= 1;
			team.elderCounter -= 1;
		}
	}

	processChampkill(event) {
		const teamId = parseInt((event.killerId - 1) / 10);
		this.state.teams[teamId].players[(event.killerId - 1) % 5].kills += 1;
		const victimTeamId = parseInt((event.victimId - 1) / 10);
		this.state.teams[victimTeamId].players[(event.victimId - 1) % 5].deaths += 1;
		for(const assistId of event.assistingParticipantIds) {
			const assistTeamId = parseInt((assistId - 1) / 10);
			this.state.teams[assistTeamId].players[(assistId - 1) % 5].assists += 1;
		}
	}

	processMonsterKill(event) {
		const teamId = parseInt((event.killerId - 1) / 10);
		if(event.monsterType == 'DRAGON') {
			this.state.teams[teamId].numDrakes += 1;
			if(this.state.teams[teamId].numDrakes == 4) {
				this.state.teams[teamId].hasSoul = true;
			}
		}else if(event.monsterType == 'RIFTHERALD') {
			this.state.teams[teamId].numRifts += 1;
		}else if(event.monsterType == 'BARON_NASHOR') {
			this.state.teams[teamId].baronCounter = 3;
		}else if(event.monsterType == 'ELDER_DRAGON') {
			this.state.teams[teamId].elderCounter = 3;
		}
	}

	getState() {
		// This function will return the current state of the game
		let str = '';
		for(let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				str += this.state.teams[i].players[j].maxHealth + ',';
				str += this.state.teams[i].players[j].currentHealth + ',';
				str += this.state.teams[i].players[j].position[0] + ',';
				str += this.state.teams[i].players[j].position[1] + ',';
				str += this.state.teams[i].players[j].champion + ',';
				str += this.state.teams[i].players[j].mastery + ',';
				str += this.state.teams[i].players[j].totalGold + ',';
				str += this.state.teams[i].players[j].alive + ',';
				str += this.state.teams[i].players[j].level + ',';
				str += this.state.teams[i].players[j].kills + ',';
				str += this.state.teams[i].players[j].deaths + ',';
				str += this.state.teams[i].players[j].assists + ',';
				str += this.state.teams[i].players[j].creepscore + ',';
				str += this.state.teams[i].players[j].wardscore + ',';
				str += this.state.teams[i].players[j].xp + ',';
			}
			str += this.state.teams[i].hasBaron + ',';
			str += this.state.teams[i].hasSoul + ',';
			str += this.state.teams[i].numDrakes + ',';
			str += this.state.teams[i].hasElder + ',';
			str += this.state.teams[i].numTurrets + ',';
			str += this.state.teams[i].numInhibs + ',';
			str += this.state.teams[i].numRifts + ',';
		}
		str += this.state.time + ',';
		str += this.state.rank + ',';
		str += this.state.queueId + ',';
		str += this.state.matchID;
		return str;
	}
}

async function getMatchFromMatchID(matchID, key, gameID) {
	try {
		const response = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=${key}`);
		const json = await response.json();
		const game = new Game(json);
		const rows = [];
		// Calculate the number of frames are in this game
		
		for(let i = 0; i < frames.length; i++) {
			game.update(frames[i]);
			rows.push(game.getState());
		}
		
		// Return an array of frames
		return rows;
	} catch (e) {
		console.log(e);
		return '';
	}
}

async function getPlayerMatchIDs(summonerName, key) {
	console.log('checking player: ' + summonerName);
	summonerName = encodeURIComponent(summonerName);
	try {
		const response = await apiCall(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${key}`);
		const player = await response.json();
		if (player['id'] == undefined) {
			console.log('Error, summoner not found: ' + summonerName);
			console.log('Using key: ' + key);
			return [];
		}
		const puuid = player.puuid;
		const resp = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=${MATCHES_PER_PLAYER}&api_key=${key}`);
		const matchIDs = await resp.json();
		return matchIDs;
	} catch (error) {
		console.log('Error, summoner not found: ' + summonerName);
		return [];
	}
}

async function getMatchesFromTier(tier) {
	const players = await getPlayersFromTier(tier);
	const numPlayers = Math.min(players.length, NUM_PLAYERS);
	const batchSize = API_KEYS.length;
	const numBatches = parseInt(numPlayers / batchSize);
	let matches = [];
	for (let i = 0; i < numBatches; i++) {
		const promises = [];
		for (let j = 0; j < batchSize; j++) {
			promises.push(getPlayerMatchIDs(players[i * batchSize + j].summonerName, API_KEYS[j]));
		}
		const batch = await Promise.all(promises);
		matches = matches.concat(batch);
	}
	return matches;
}

async function getPlayersFromTier(tier) {
	if (tier == 'grandmaster') {
		try {
			console.log(`https://euw1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
			let response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
			let json = await response.json();
			const gmplayers = json.entries;
			response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
			json = await response.json();
			const chplayers = json.entries;
			return gmplayers.concat(chplayers);
		} catch (e) {
			console.log('Something fucked up');
		}
	} else if (tier == 'master') {
		const response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${process.env.RIOT_KEY}`);
		const json = await response.json();
		const players = json.entries;
		return players;
	} else {
		let players = [];
		for (let i = 0; i < parseInt(NUM_PLAYERS / 205); i++) {
			const response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier.toUpperCase()}/III?page=${i + 1}&api_key=${process.env.RIOT_KEY}`)
			const json = await response.json();
			players = players.concat(json);
		}
		return players;
	}
}

function getUniqueMatches(matches) {
	const uniqueMatches = new Set();
	for (let i = 0; i < matches.length; i++) {
		for (let j = 0; j < matches[i].length; j++) {
			uniqueMatches.add(matches[i][j]);
		}
	}
	return [...uniqueMatches];
}

async function processMatches(matches, tier) {
	const numMatches = matches.length;
	const batchSize = API_KEYS.length;
	const numBatches = parseInt(numMatches / batchSize);
	for (let i = 0; i < numBatches; i++) {
		console.log(`Processing ${i * batchSize} matches`);
		const promises = [];
		for (let j = 0; j < batchSize; j++) {
			promises.push(getMatchFromMatchID(matches[i * batchSize + j], API_KEYS[j], i * batchSize + j));
		}
		const results = await Promise.all(promises);
		for (let k = 0; k < results.length; k++) {
			fs.appendFileSync(`matches/${tier}_training_data.txt`, results[k] + '\n');
		}
	}
}

async function main() {
	try {
		API_KEYS = fs.readFileSync('keys.json', {
			encoding: 'utf-8'
		});
		API_KEYS = JSON.parse(API_KEYS);
	} catch (e) {
		console.log('Could not find keys.json');
		console.log('Create a file in the directory of the nodejs project called keys.json and add in a list of riotgames api keys(1 per line)');
		return;
	}
	if (API_KEYS.length == 0) {
		console.log('No API keys found, please add riot API keys to keys.json(20-30 should be enough), more api keys means faster download');
		return;
	}
	if (API_KEYS.length < 15) {
		console.log('Warning: Running on low number of API keys, download may take a while');
	}

	const tiers = ['grandmaster', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron'];

	for (let i = 0; i < tiers.length; i++) {
		const matches = getUniqueMatches(await getMatchesFromTier(tiers[i])); // This holds an array of batches of matches, where each batch is API_KEYS.length long
		await processMatches(matches, tiers[i]);
	}
}

// main();


(async () => {
	const key = 'RGAPI-814764a5-3365-4263-89df-f0b205329823';
	const response = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/EUW1_6418617833?api_key=${key}`);
	const match = await response.json();
	const game = new Game(match, 'EUW1_6418617833', 'Platinum');
	await game.init(match, key); // This must be called to fetch data about player mastery because Class constructors cannot be asynchronous so we cannot execute api calls in there
	console.log(game.getState());
})();