import requests
import urllib3
urllib3.disable_warnings()
import tensorflow as tf
import pandas as pd

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

def process_game_state(state):
	pass
		


# model = tf.keras.models.load_model('live-model.h5')

data = requests.get('https://127.0.0.1:2999/liveclientdata/allgamedata', verify=False)
parsed_data = data.json()

print(parsed_data['allPlayers'][0]['championName'])
print(parsed_data['allPlayers'][0]['position'])