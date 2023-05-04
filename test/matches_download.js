import { apiCall } from "../src/download_match_data";

describe('Download Player Matches', () => {
    it('throw error with bad api call', async () => {
        const key = 'MLKSDJF';
        const response = await apiCall('https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/6EgerFMQ5CzC2y-WAOxcIT4OsFdL8rOk0hEsAVxVJVQXbF3p-KZ-VKTNDL9DUbp66MOPZt5H9G1eSg?api_key=', key);
        expect(response.status).toBe(200);
    });

    it('handle empty api key');
    it('return proper value with good call and good api key');

});