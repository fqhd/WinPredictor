import 'node-fetch';
import fs from 'fs'
let API_KEYS;
let TIME_BETWEEN_REQUESTS = 1300;
const NUM_PLAYERS = 2000;
const MATCHES_PER_PLAYER = 20;
const MAX_MATCHES = 10;
const MAX_MATCH_AGE = 7 * 24 * 60 * 60 * 1000;

export function apiCall(url) {
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			try {
				const data = await fetch(url);
				resolve(data);
			}catch(e) {
				reject(e);
			}
		}, TIME_BETWEEN_REQUESTS);
	});
}

class Game {
	constructor(match, matchID) {
		this.state = {
			teams: [],
			win: match.info.participants[0].win,
			time: 0,
			matchID
		};
		for (let i = 0; i < 2; i++) {
			const team = {
				players: [],
				numDrakes: 0,
				numTurrets: 11,
				inhibCounters: [],
				numRifts: 0
			};
			for (let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				team.players.push({
					baronTimer: 0,
					elderTimer: 0,
					maxHealth: 0,
					currentHealth: 0,
					position: [0, 0],
					champion: match.info.participants[playerIndex].championName,
					mastery: 0,
					totalGold: 0,
					level: 1,
					kills: 0,
					deaths: 0,
					assists: 0,
					creepscore: 0,
					xp: 0
				});
			}
			this.state.teams.push(team);
		}
	}

	async init(match, key) {
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				const encryptedSummonerID = match.info.participants[playerIndex].summonerId;
				const championID = match.info.participants[playerIndex].championId;
				const response = await apiCall(`https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerID}/by-champion/${championID}?api_key=${key}`)
				handleResponse(response, key);
				const json = await response.json();
				this.state.teams[i].players[j].mastery = json.championPoints;
			}
		}
	}

	update(frame) {
		this.state.time = frame.timestamp;
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 5; j++) {
				const playerIndex = i * 5 + j;
				this.state.teams[i].players[j].maxHealth = frame.participantFrames[(playerIndex + 1).toString()].championStats.healthMax;
				this.state.teams[i].players[j].currentHealth = frame.participantFrames[(playerIndex + 1).toString()].championStats.health;
				this.state.teams[i].players[j].position[0] = frame.participantFrames[(playerIndex + 1).toString()].position.x;
				this.state.teams[i].players[j].position[1] = frame.participantFrames[(playerIndex + 1).toString()].position.y;
				this.state.teams[i].players[j].totalGold = frame.participantFrames[(playerIndex + 1).toString()].totalGold;
				this.state.teams[i].players[j].level = frame.participantFrames[(playerIndex + 1).toString()].level;
				this.state.teams[i].players[j].xp = frame.participantFrames[(playerIndex + 1).toString()].xp;
				this.state.teams[i].players[j].creepscore = frame.participantFrames[(playerIndex + 1).toString()].minionsKilled + frame.participantFrames[(playerIndex + 1).toString()].jungleMinionsKilled;
			}
		}
		// Loop through events and update stats
		for (const event of frame.events) {
			switch (event.type) {
				case 'CHAMPION_KILL':
					this.processChampKill(event);
					break;
				case 'ELITE_MONSTER_KILL':
					this.processMonsterKill(event);
				case 'BUILDING_KILL':
					this.processBuildingKill(event);
					break;
			}
		}

		for (const team of this.state.teams) {
			for(const player of team.players) {
				player.baronTimer -= 1;
				player.elderTimer -= 1;
			}
			for(let i = 0; i < team.inhibCounters.length; i++) {
				team.inhibCounters[i] -= 1;
				if(team.inhibCounters[i] == 0) { 
					team.inhibCounters.splice(i, 1);
				}
			}
		}
	}

	processChampKill(event) {
		const teamId = parseInt((event.killerId - 1) / 5);
		if(event.killerId > 0){
			this.state.teams[teamId].players[(event.killerId - 1) % 5].kills += 1;
		}
		const victimTeamId = parseInt((event.victimId - 1) / 5);
		this.state.teams[victimTeamId].players[(event.victimId - 1) % 5].deaths += 1;
		this.state.teams[victimTeamId].players[(event.victimId - 1) % 5].baronTimer = 0;
		this.state.teams[victimTeamId].players[(event.victimId - 1) % 5].elderTimer = 0;
		if (event.assistingParticipantIds) {
			for (const assistId of event.assistingParticipantIds) {
				const assistTeamId = parseInt((assistId - 1) / 5);
				this.state.teams[assistTeamId].players[(assistId - 1) % 5].assists += 1;
			}
		}
	}

	processBuildingKill(event) {
		if(event.buildingType == 'TOWER_BUILDING') {
			this.state.teams[event.teamId/100-1].numTurrets -= 1;
		}else if(event.buildingType == 'INHIBITOR_BUILDING') {
			this.state.teams[event.teamId/100-1].inhibCounters.push(6);
		}
	}

	processMonsterKill(event) {
		const teamId = parseInt((event.killerId - 1) / 5);
		if (event.monsterType == 'DRAGON') {
			this.state.teams[teamId].numDrakes += 1;
			if (this.state.teams[teamId].numDrakes == 4) {
				this.state.teams[teamId].hasSoul = true;
			}
		} else if (event.monsterType == 'RIFTHERALD') {
			this.state.teams[teamId].numRifts += 1;
		} else if (event.monsterType == 'BARON_NASHOR') {
			for(const player of this.state.teams[teamId].players) {
				player.baronTimer = 4;
			}
		} else if (event.monsterType == 'ELDER_DRAGON') {
			for(const player of this.state.teams[teamId].players) {
				player.elderTimer = 4;
			}
		}
	}

	getState() {
		// This function will return the current state of the game
		let str = '';
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < 5; j++) {
				str += this.state.teams[i].players[j].maxHealth + ',';
				str += this.state.teams[i].players[j].currentHealth + ',';
				str += this.state.teams[i].players[j].position[0] + ',';
				str += this.state.teams[i].players[j].position[1] + ',';
				str += this.state.teams[i].players[j].champion + ',';
				str += this.state.teams[i].players[j].mastery + ',';
				str += this.state.teams[i].players[j].totalGold + ',';
				str += this.state.teams[i].players[j].level + ',';
				str += this.state.teams[i].players[j].kills + ',';
				str += this.state.teams[i].players[j].deaths + ',';
				str += this.state.teams[i].players[j].assists + ',';
				str += this.state.teams[i].players[j].creepscore + ',';
				str += this.state.teams[i].players[j].xp + ',';
				str += (this.state.teams[i].players[j].baronTimer > 0) + ',';
				str += (this.state.teams[i].players[j].elderTimer > 0) + ',';
			}
			str += (this.state.teams[i].numDrakes == 4) + ',';
			str += this.state.teams[i].numDrakes + ',';
			str += this.state.teams[i].numTurrets + ',';
			str += (3 - this.state.teams[i].inhibCounters.length) + ',';
			str += this.state.teams[i].numRifts + ',';
		}
		str += this.state.time + ',';
		str += this.state.matchID + ',';
		str += this.state.win + '\n';
		return str;
	}
}

async function getMatchFromMatchID(matchID, key) {
	try {
		const rows = [];

		let match = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchID}?api_key=${key}`);
		handleResponse(match, key);
		match = await match.json();

		const timeSinceMatch = Date.now() - match.info.gameStartTimestamp;
		if(timeSinceMatch >= MAX_MATCH_AGE) {
			return rows;
		}
		const game = new Game(match, matchID);
		await game.init(match, key); // This must be called to fetch data about player mastery because Class constructors cannot be asynchronous so we cannot execute api calls in there
		let timeline = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/${matchID}/timeline?api_key=${key}`);
		handleResponse(timeline, key);
		if(timeline.status != 200) {
			const error = getErrorFromStatusCode(timeline.status, key);
			throw error;
		}
		timeline = await timeline.json();
		for (const frame of timeline.info.frames) {
			game.update(frame);
			rows.push(game.getState());
		}

		// Return an array of frames
		return rows;
	} catch (e) {
		console.log(e);
		return [];
	}
}

async function getPlayerMatchIDs(summonerName, key) {
	console.log('checking player: ' + summonerName);
	summonerName = encodeURIComponent(summonerName);
	try {
		const response = await apiCall(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${key}`);
		handleResponse(response, key);
		const player = await response.json();
		if (player['id'] == undefined) {
			console.log('Error, summoner not found: ' + summonerName);
			console.log('Using key: ' + key);
			return [];
		}
		const puuid = player.puuid;
		const resp = await apiCall(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=${MATCHES_PER_PLAYER}&api_key=${key}`);
		handleResponse(resp, key);
		const matchIDs = await resp.json();
		return matchIDs;
	} catch (e) {
		console.log('Error, summoner not found: ' + summonerName);
		console.log(e);
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
	const key = API_KEYS[0];
	if (tier == 'grandmaster') {
		try {
			let response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
			handleResponse(response, key);
			let json = await response.json();
			const gmplayers = json.entries;
			response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
			handleResponse(response, key);
			json = await response.json();
			const chplayers = json.entries;
			return gmplayers.concat(chplayers);
		} catch (e) {
			console.log(e);
		}
	} else if (tier == 'master') {
		const response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5?api_key=${key}`);
		handleResponse(response, key);
		const json = await response.json();
		const players = json.entries;
		return players;
	} else {
		let players = [];
		for (let i = 0; i < parseInt(NUM_PLAYERS / 205); i++) {
			const response = await apiCall(`https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier.toUpperCase()}/III?page=${i + 1}&api_key=${key}`)
			handleResponse(response, key);
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
	let scannedMatches = 0;
	for (let i = 0; i < numBatches; i++) {
		console.log(`Processing ${(i+1) * batchSize} matches`);
		const promises = [];
		for (let j = 0; j < batchSize; j++) {
			promises.push(getMatchFromMatchID(matches[i * batchSize + j], API_KEYS[j]));
		}
		const results = await Promise.all(promises);
		for (let k = 0; k < results.length; k++) {
			scannedMatches++;
			for(const line of results[k]) {
				fs.appendFileSync(`matches/${tier}_training_data.csv`, line);
			}
			if(scannedMatches >= MAX_MATCHES) {
				return;
			}
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

	const tiers = ['master', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron'];

	for (let i = 0; i < tiers.length; i++) {
		const matches = getUniqueMatches(await getMatchesFromTier(tiers[i])); // This holds an array of batches of matches, where each batch is API_KEYS.length long
		await processMatches(matches, tiers[i]);
	}
}

main();

function getErrorFromStatusCode(code, key) {
	switch(code) {
		case 400:
				return new Error('Bad request(syntax error in request), using key: ' + key);
		case 401:
				return new Error('Unauthorized request(no api key provided), using key: ' + key);
		case 403:
				return new Error('Forbidden request(invalid endpoint or invalid api key), using key: ' + key);
		case 404:
				return new Error('API Endpoint not found, using key: ' + key);
		case 415:
				return new Error('Unsupported media type, using key: ' + key);
		case 429:
				return new Error('Rate limit exceeded, using key: ' + key);
		case 500:
			return new Error('Internal server error, using key: ' + key);
		case 503:
			return new Error('Service Unavailable, using key: ' + key);
		default:
			return new Error('Unknown code provided: ' + code);
	}

}

function handleResponse(resp, key) {
	if(resp.status != 200) {
		const error = getErrorFromStatusCode(resp.status, key);
		throw error;
	}
}
