class Game {
    teams = new Array();
    lastTime = 0;
    constructor() {
        this.lastTime = Date.now();
        for (let i = 0; i < 2; i++) {
            let players = new Array();
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
                inhibTimers: []
            });
        }
    }
    async update() {
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
            for (let j = 0; j < 5; j++) {
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['championName'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['summonerName'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['level'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['scores']['kills'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['scores']['deaths'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['scores']['assists'];
                this.teams[i]['players'][j]['champion'] = playerData[i * 5 + j]['scores']['creepScore'];
                this.teams[i]['players'][j]['baronTimer'] -= timeDiff;
                this.teams[i]['players'][j]['elderTimer'] -= timeDiff;
            }
            for (let j = 0; j < this.teams[i]['inhibTimers'].length; j++) {
                this.teams[i]['inhibTimers'][j] -= timeDiff;
                if (this.teams[i]['inhibTimers'][j] < 0) {
                    this.teams[i]['inhibTimers'] = this.teams[i]['inhibTimers'].splice(j, 1);
                }
            }
        }
        for (const event of events) {
            if (event['EventName'] == 'TurretKilled') {
                const teamId = parseInt(event['TurretKilled'][8]) - 1;
                this.teams[teamId]['turrets'] -= 1;
            }
            else if (event['EventName'] == 'InhibKilled') {
                const teamId = parseInt(event['InhibKilled'][10]) - 1;
                this.teams[teamId]['inhibTimers'].push(60 * 3);
            }
            else if (event['EventName'] == 'DragonKill') {
                if (event['DragonType'] == 'Elder') {
                    const teamId = this.get_player_teamId(event['KillerName']);
                    for (const player of )
                        ;
                }
            }
        }
    }
    printGameState() {
    }
    getGameState() {
    }
}
