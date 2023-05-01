import 'node-fetch';
import fs from 'fs';

const API_KEYS = [
    'RGAPI-c04fa41b-3656-4ae1-ba51-123e260170b9',
    'RGAPI-4a4b5d71-6ec8-4d6f-b7f8-5f6d619abf7c',
    'RGAPI-bf86297a-4e87-4f18-bdb1-7f2b7d411dd9',
    'RGAPI-4abcfef7-018e-4db1-bf61-619ddb255a02',
    'RGAPI-0d13537a-a826-4962-9415-67d538939fc3',
    'RGAPI-564e6025-86b9-47d5-be0e-5085c4dae004',
    'RGAPI-02d562a2-2603-4e94-b6fb-01e76821e5be',
    'RGAPI-3a8292c4-df0e-442c-8b30-ee0f1b4e94c7',
    'RGAPI-a7797db3-c43a-481a-8447-df55208c92ca',
    'RGAPI-d0eb947e-0c80-417a-b89c-7db0b9ccc560',
    'RGAPI-2327169b-0cc8-45b7-a552-82b5d0b8346e',
    'RGAPI-ceaca646-6937-4d70-af61-a89916948029',
    'RGAPI-3e53c938-4c97-455d-bccf-aec920d25d69',
    'RGAPI-be1eae45-2d89-4b64-9d70-3cde0e707357',
    'RGAPI-bd0fb793-25c0-43a1-98ea-56de3c5af0ad',
    'RGAPI-586d1229-0486-4db9-b7d4-3c13699c40ae',
    'RGAPI-6530f73c-572c-4836-806c-9fb2b9537ee7'
];

const TIME_BETWEEN_REQUESTS = 1300 / API_KEYS.length;
let currentKeyIndex = 0;
let currentKey = API_KEYS[0];
const MATCHES_PER_PLAYER = 50;

function apiCall(url) {
	url += currentKey;
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			const data = await fetch(url);
			resolve(data);
		}, TIME_BETWEEN_REQUESTS);
	});
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
    const f = ;

    console.log(f);
}

main();