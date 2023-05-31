import pandas as pd
import pickle
import tensorflow as tf

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
	games_df = pd.read_csv('data/matches/master_training_data.csv', names=get_column_names())

	row = games_df.iloc[0]
	with open('data/matches/' + rank + '.ds', 'wb') as f_out:
		inputs = []
		labels = []
		for index, row in games_df.iterrows():
			frame_vec = process_frame(row)
			inputs.append(frame_vec[:-1])
			labels.append(frame_vec[-1])
			if index % 10000 == 0:
				prog = int(index/len(games_df)*100)
				print(f'Progress: {prog}%')
		training_data = tf.constant(inputs, dtype='float32'), tf.constant(labels)
		pickle.dump(training_data, f_out)

def get_column_names():
	names = []
	for i in range(2):
		for j in range(5):
			playerID = str(i) + ',' + str(j)
			names.append('MaxHealth' + playerID)
			names.append('CurrentHealth' + playerID)
			names.append('PositionX' + playerID)
			names.append('PositionY' + playerID)
			names.append('Champion' + playerID)
			names.append('Mastery' + playerID)
			names.append('TotalGold' + playerID)
			names.append('Level' + playerID)
			names.append('Kills' + playerID)
			names.append('Deaths' + playerID)
			names.append('Assists' + playerID)
			names.append('Creepscore' + playerID)
			names.append('XP' + playerID)
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
