class Game {

	private teams: Array<Object> = new Array<Object>();
	private lastTime: number = 0;

	constructor() {
		this.lastTime = Date.now();
		for (let i = 0; i < 2; i++) {
			const players = new Array();
			for (let j = 0; j < 5; j++) {
				players.push({
					'baronTimer': 0,
					'elderTimer': 0
				});
			}
			this.teams.push({
				players,
				'drakes': 0,
				'turrets': 11,
				'numRifts': 0,
				'inhibTimers': []
			});
		}
	}

	private async syncStateWithActiveGame() {
		// Make the two requests here
		/*
		Python:
		player_data = requests.get('https://127.0.0.1:2999/liveclientdata/playerlist', verify=False)
		event_data = requests.get('https://127.0.0.1:2999/liveclientdata/eventdata', verify=False)
		player_data = player_data.json()
		event_data = event_data.json()
		*/
		let eventData = {
			'Events': []
		};
		let playerData = {};

		const events = eventData['Events'];
		const nowTime = Date.now();
		const timeDiff = nowTime - this.lastTime;
		this.lastTime = nowTime;

		for (let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				this.teams[i]['players'][j]['champion'] = playerData[i*5+j]['championName'];
				this.teams[i]['players'][j]['summonerName'] = playerData[i*5+j]['summonerName'];
				this.teams[i]['players'][j]['level'] = playerData[i*5+j]['level'];
				this.teams[i]['players'][j]['kills'] = playerData[i*5+j]['scores']['kills'];
				this.teams[i]['players'][j]['deaths'] = playerData[i*5+j]['scores']['deaths'];
				this.teams[i]['players'][j]['assists'] = playerData[i*5+j]['scores']['assists'];
				this.teams[i]['players'][j]['creepScore'] = playerData[i*5+j]['scores']['creepScore'];
				this.teams[i]['players'][j]['baronTimer'] -= timeDiff;
				this.teams[i]['players'][j]['elderTimer'] -= timeDiff;
			}
			for(let j = 0; j < this.teams[i]['inhibTimers'].length; j++) {
				this.teams[i]['inhibTimers'][j] -= timeDiff;
				if(this.teams[i]['inhibTimers'][j] < 0) {
					this.teams[i]['inhibTimers'] = this.teams[i]['inhibTimers'].splice(j, 1);
				}
			}
		}
		for (const event of events) {
			if (event['EventName'] == 'TurretKilled') {
				const teamId = parseInt(event['TurretKilled'][8]) - 1;
				this.teams[teamId]['turrets'] -= 1;
			}else if(event['EventName'] == 'InhibKilled') {
				const teamId = parseInt(event['InhibKilled'][10]) - 1;
				this.teams[teamId]['inhibTimers'].push(60*3);
			}else if(event['EventName'] == 'DragonKill') {
				if (event['DragonType'] == 'Elder') {
					const teamId = this.get_player_teamId(event['KillerName']);
					for(const player of this.teams[teamId]['players']) {
						player['elderTimer'] = 60*3;
					}
				}else{
					const teamId = this.get_player_teamId(event['KillerName']);
					this.teams[teamId]['drakes'] += 1;
				}
			}else if(event['EventName'] == 'BaronKill') {
				const teamId = this.get_player_teamId(event['KillerName']);
				for (const player of this.teams[teamId]['players']) {
					player['baronTimer'] = 60*3;
				}
			}
		}
	}

	private get_player_teamId(summonerName: string) {
		for(let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				if(this.teams[i]['players'][j]['summonerName'] == summonerName) {
					return i;
				}
			}
		}
		return 0;
	}

	public printGameState() {
		for(let i = 0; i < 2; i++) {
			console.log(`--- Team ${i} ---`);
			console.log(`Turrets: ${this.teams[i]['turrets']}`);
			console.log(`Inhibs: ${3 - this.teams[i]['inhibTimers'].length}`);
			console.log(`Dragons: ${this.teams[i]['drakes']}`);
			for(let j = 0; j < 5; j++) {
				const player = this.teams[i]['players'][j];
				console.log(`Champion: ${player['champion']}`);
				console.log(`Has baron: ${player['baronTimer'] > 0}`);
				console.log(`Has elder: ${player['elderTimer'] > 0}`);
				console.log(`Level: ${player['level']}`);
				console.log(`K: ${player['kills']}`);
				console.log(`D: ${player['deaths']}`);
				console.log(`A: ${player['assists']}`);
				console.log(`CS: ${player['creepScore']}`);
			}
		}
	}

	public async getGameState() {
		await this.syncStateWithActiveGame();

		const frame = new Array();

		for(let i = 0; i < 2; i++) {
			for(let j = 0; j < 5; j++) {
				const player = this.teams[i]['players'][j];
				console.log(`Champion: ${player['champion']}`);
				console.log(`Level: ${player['level']}`);
				console.log(`K: ${player['kills']}`);
				console.log(`D: ${player['deaths']}`);
				console.log(`A: ${player['assists']}`);
				console.log(`CS: ${player['creepScore']}`);
				console.log(`Has baron: ${player['baronTimer'] > 0}`);
				console.log(`Has elder: ${player['elderTimer'] > 0}`);
			}
			frame.push(this.teams[i]['drakes'] == 4);
			frame.push(this.teams[i]['drakes']);
			frame.push(this.teams[i]['turrets']);
			frame.push(3 - this.teams[i]['inhibTimers'].length);
			frame.push(this.teams[i]['numRifts']);
		}
	}
}