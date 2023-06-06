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
				'soul': False,
				'drakes': 0,
				'turrets': 11,
				'inhibCounters': []
			})

	def update(self, player_data, event_data):
		event_data = event_data['Events']
		now_time = time.time()
		time_diff = now_time - self.last_time
		self.last_time = now_time
		for team in self.teams:
			for i in range(len(team['players'])):
				team['players'][i]['champion'] = player_data[i]['championName']
				team['players'][i]['level'] = player_data[i]['level']
				team['players'][i]['kills'] = player_data[i]['scores']['kills']
				team['players'][i]['deaths'] = player_data[i]['scores']['deaths']
				team['players'][i]['assists'] = player_data[i]['scores']['assists']
				team['players'][i]['creepscore'] = player_data[i]['scores']['creepScore']
			for i in range(len(team['inhibCounters'])):
				team['inhibCounters'][i] -= time_diff
		for event in event_data:
			if event['EventName'] == 'TurretKilled':
				teamId = int(event['TurretKilled'][8]) - 1
				self.teams[teamId]['turrets'] -= 1
			elif event['EventName'] == 'InhibKilled':
				teamId = int(event['InhibKilled'][10]) - 1
				self.teams[teamId]['inhibCounters'].append(60*3)
			elif event['EventName'] == 'DragonKill':
				if event['EventName']['DragonType'] == 'Elder':
					teamId = self.champions_map[event['KillerName']]
					for player in self.teams[teamId]['players']:
						player['elderTimer'] = 60*3
				else:
					teamId = self.champions_map[event['KillerName']]
					self.teams[teamId]['drakes'] += 1
					if self.teams[teamId]['drakes'] == 4:
						self.teams[teamId]['soul'] = True
			elif event['EventName'] == 'BaronKill':
				teamId = self.champions_map[event['KillerName']]
				for player in self.teams[teamId]['players']:
					player['baronTimer'] = 60*3
		print(self.teams[0]['turrets'])
		print(self.teams[1]['turrets'])


		


# model = tf.keras.models.load_model('live-model.h5')

player_data = requests.get('https://127.0.0.1:2999/liveclientdata/playerlist', verify=False)
event_data = requests.get('https://127.0.0.1:2999/liveclientdata/eventdata', verify=False)
player_data = player_data.json()
event_data = event_data.json()


game = Game()
game.update(player_data, event_data)

def get_column_names():
	names = []
	for i in range(2):
		for j in range(5):
			playerID = str(i) + ',' + str(j)
			names.append('Champion' + playerID)
			names.append('Level' + playerID)
			names.append('Kills' + playerID)
			names.append('Deaths' + playerID)
			names.append('Assists' + playerID)
			names.append('Creepscore' + playerID)
			names.append('Baron' + playerID)
			names.append('Elder' + playerID)
		names.append('Soul' + str(i))
		names.append('Drakes' + str(i))
		names.append('Turrets' + str(i))
		names.append('Inhibs' + str(i))
		names.append('Rifts' + str(i))
	names.append('Time')
	names.append('Win')
	return names