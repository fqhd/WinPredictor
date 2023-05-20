import pandas as pd
import tensorflow as tf
import pickle

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

def process_match(match):
	champs = match.split(',')
	vec = []
	for i in range(10):
		champ_vec = get_champ_vec(champs[i])
		for e in champ_vec:
			vec.append(e)
	if(champs[10] == 'true'):
		vec.append(1)
	else:
		vec.append(0)
	return vec

ranks = ['grandmaster', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron']

for name in ranks:
	with open('data/matches/' + name + '_training_data.txt', 'r') as f, open('data/matches/' + name + '.ds', 'wb') as f_out:
		inputs = []
		labels = []
		matches = f.read().split('\n')
		droppedCount = 0
		for i in range(len(matches)):
			try:
				match_vec = process_match(matches[i])
				inputs.append(match_vec[:-1])
				labels.append(match_vec[-1])
			except:
				droppedCount+=1
			if i % 10000 == 0:
				prog = int(i/len(matches)*100)
				print(f'Progress: {prog}%')
		print(f'Dropped Games: {droppedCount}')
		training_data = tf.constant(inputs, dtype='float32'), tf.constant(labels)
		pickle.dump(training_data, f_out)