import pandas as pd
import pickle
import tensorflow as tf
import random

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
	

def process_rank(rank):
	games_df = pd.read_csv(f'data/matches/{rank}_training_data.csv', names=get_column_names())

	row = games_df.iloc[0]

	
	with open('data/matches/' + rank + '.ds', 'wb') as f_out:
		frame_vecs = []
		for index, row in games_df.iterrows():
			frame_vec = process_frame(row)
			frame_vecs.append(frame_vec)
			if index % 10000 == 0:
				prog = int(index/len(games_df)*100)
				print(f'Progress: {prog}%')
		random.shuffle(frame_vecs)
		data = {
			'training': ([], []),
			'testing': []
		}
		for i in range(51):
			data['testing'].append(([], []))
		for frame_vec in frame_vecs[:-10000]:
			data['training'][0].append(frame_vec[:-1])
			data['training'][1].append(frame_vec[-1])
		for frame_vec in frame_vecs[-10000:]:
			time_in_minutes = int(frame_vec[-2] / 60000)
			time_in_minutes = min(time_in_minutes, 50)
			data['testing'][time_in_minutes][0].append(frame_vec[:-1])
			data['testing'][time_in_minutes][1].append(frame_vec[-1])
		tensor_data = {
			'testing': []
		}
		tensor_data['training'] = tf.constant(data['training'][0], dtype='float32'), tf.constant(data['training'][1], dtype='int32')
		for i in range(51):
			tensor_data['testing'].append((
				tf.constant(data['testing'][i][0], dtype='float32'),
				tf.constant(data['testing'][i][1], dtype='int32')
			))
		pickle.dump(tensor_data, f_out)

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

rank = input('Enter Rank to Process: ')
process_rank(rank)
