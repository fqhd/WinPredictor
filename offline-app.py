import tensorflow as tf
import pandas as pd
import ranks

class OfflinePredictor:
	def __init__(self):
		self.models = {}
		for rank in ranks.ranks:
			self.models[rank] = tf.keras.models.load_model(f'models/{rank}.h5')
		self.df = pd.read_csv('champions.csv')

	def get_champ(self, champs_to_exclude, role):
		name = input(f'Enter {role}:')
		if not name in self.df.values:
			print('Champion does not exist')
			return self.get_champ(champs_to_exclude, role)
		elif name in champs_to_exclude:
			print('Champion is already taken')
			return self.get_champ(champs_to_exclude, role)
		return name

	def get_game_champs(self):
		print(f'Enter champs for blue team')
		champs = []
		roles = ['TOP', 'JGL', 'MID', 'ADC', 'SUP']
		for i in range(5):
			champs.append(self.get_champ(champs_to_exclude=champs, role=roles[i]))
		print(f'Enter champs for red team')
		for i in range(5):
			champs.append(self.get_champ(champs_to_exclude=champs, role=roles[i]))
		return champs

	def get_champ_vec(self, champ_name):
		arr = []
		row = self.df.loc[self.df['Champion'] == champ_name].iloc[0]
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

	def is_valid_input(self, r):
		if r.isnumeric():
			if int(r) >= 1 and int(r) <= 9:
				return True
		return False

	def pick_rank(self):
		for i, r in enumerate(ranks.ranks):
			print(f'{i+1}) {r}')
		rIdx = input('Select a rank:')
		while not self.is_valid_input(rIdx):
			print('Invalid rank, try again')
			rIdx = input('Select a rank:')
		return ranks.ranks[int(rIdx)-1]

	def run(self):
		rank = self.pick_rank()
		champs = self.get_game_champs()
		inputs = []
		for i in champs:
			inputs += self.get_champ_vec(i)
		print('Rank:', rank)
		print('Inputs:', inputs)

predictor = OfflinePredictor()
predictor.run()