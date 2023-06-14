import requests
import urllib3
urllib3.disable_warnings()
import tensorflow as tf
import pandas as pd
import time

df = pd.read_csv('champions.csv')

# Returns the vectorized form of a champion based on the recorded values in the champions.csv file
def get_champ_vec(champ_name):
	arr = []
	row = df.loc[df['Champion'] == champ_name].iloc[0]
	for i in range(1, 16):
		if i == 7:
			if row[i] == 1:
				arr.append(1)
				arr.append(0)
				arr.append(0)
			elif row[i] == 2:
				arr.append(0)
				arr.append(1)
				arr.append(0)
			elif row[i] == 3:
				arr.append(0)
				arr.append(0)
				arr.append(1)
		else:
			arr.append(row[i] / 10)
	return arr

def process_frame(frame):
	vec = []
	for e in frame:
		if(e == True):
			vec.append(1)
		elif(e == False):
			vec.append(0)
		elif(type(e) == str):
			vec += get_champ_vec(e)
		else:
			vec.append(e)
	return vec

class Game():
	def __init__(self):
		self.teams = []
		self.last_time = time.time()
		for i in range(2):
			players = []
			for j in range(5):
				players.append({
					'baronTimer': 0,
					'elderTimer': 0
				})
			self.teams.append({
				'players': players,
				'drakes': 0,
				'turrets': 11,
				'inhibTimers': []
			})

	def update(self, player_data, event_data):
		event_data = event_data['Events']
		now_time = time.time()
		time_diff = now_time - self.last_time
		self.last_time = now_time
		for i in range(2):
			for j in range(5):
				self.teams[i]['players'][j]['champion'] = player_data[i*5+j]['championName']
				self.teams[i]['players'][j]['summonerName'] = player_data[i*5+j]['summonerName']
				self.teams[i]['players'][j]['level'] = player_data[i*5+j]['level']
				self.teams[i]['players'][j]['kills'] = player_data[i*5+j]['scores']['kills']
				self.teams[i]['players'][j]['deaths'] = player_data[i*5+j]['scores']['deaths']
				self.teams[i]['players'][j]['assists'] = player_data[i*5+j]['scores']['assists']
				self.teams[i]['players'][j]['creepscore'] = player_data[i*5+j]['scores']['creepScore']
				self.teams[i]['players'][j]['baronTimer'] -= time_diff
				self.teams[i]['players'][j]['elderTimer'] -= time_diff
			for i in range(len(self.teams[i]['inhibTimers'])):
				self.teams[i]['inhibTimers'][i] -= time_diff
				if(self.teams[i]['inhibTimers'][i] < 0):
					del self.teams[i]['inhibTimers'][i]
		for event in event_data:
			if event['EventName'] == 'TurretKilled':
				teamId = int(event['TurretKilled'][8]) - 1
				self.teams[teamId]['turrets'] -= 1
			elif event['EventName'] == 'InhibKilled':
				teamId = int(event['InhibKilled'][10]) - 1
				self.teams[teamId]['inhibTimers'].append(60*3)
			elif event['EventName'] == 'DragonKill':
				if event['DragonType'] == 'Elder':
					teamId = self.get_player_teamId(event['KillerName'])
					for player in self.teams[teamId]['players']:
						player['elderTimer'] = 60*3
				else:
					teamId = self.get_player_teamId(event['KillerName'])
					self.teams[teamId]['drakes'] += 1
			elif event['EventName'] == 'BaronKill':
				teamId = self.get_player_teamId(event['KillerName'])
				for player in self.teams[teamId]['players']:
					player['baronTimer'] = 60*3
	
	def get_player_teamId(self, summonerName):
		for i in range(2):
			for j in range(5):
				if self.teams[i]['players'][j]['summonerName'] == summonerName:
					return i
		return 0

	def get_state(self):
		i = 0
		for team in self.teams:
			i += 1
			print(f'--- Team {i} ---')
			print('Turrets:', team['turrets'])
			print('Inhibs:', 3 - len(team['inhibTimers']))
			print('Dragons:', team['drakes'])
			for player in team['players']:
				print('Champion:', player['champion'])
				print('Has baron:', player['baronTimer'] > 0)
				print('Has elder:', player['elderTimer'] > 0)
				print('Level:', player['level'])
				print('K:', player['kills'])
				print('D:', player['deaths'])
				print('A:', player['assists'])
				print('CS:', player['creepscore'])


# model = tf.keras.models.load_model('live-model.h5')

player_data = requests.get('https://127.0.0.1:2999/liveclientdata/playerlist', verify=False)
event_data = requests.get('https://127.0.0.1:2999/liveclientdata/eventdata', verify=False)
player_data = player_data.json()
event_data = event_data.json()


game = Game()
game.update(player_data, event_data)
game.get_state()
