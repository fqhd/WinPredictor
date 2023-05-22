import tensorflow as tf
import pandas as pd

df = pd.read_csv('champions.csv')

def get_champ():
    name = input('Enter champion name:')
    if name in df.values:
        return name
    else:
        print('Error, name does not exist')
        return get_champ()

def get_team(name):
    print(f'Enter champs for {name} team')
    champs = []
    for i in range(5):
        champs.append(get_champ())
    return champs

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

def is_valid_input(r):
    if r.isnumeric():
         if int(r) >= 1 and int(r) <= 9:
              return True
    return False

def pick_rank():
    ranks = ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Iron']
    for i, r in enumerate(ranks):
        print(f'{i+1}) {r}')
    rIdx = input('Select a rank:')
    while not is_valid_input(rIdx):
        print('Invalid rank, try again')
        rIdx = input('Select a rank:')
    return ranks[int(rIdx)-1]


def predict_game():
    rank = pick_rank()
    team1 = get_team('blue')
    team2 = get_team('red')
    inputs = []
    for i in team1:
        inputs += get_champ_vec(i)
    for j in team2:
        inputs += get_champ_vec(j)
    print('Rank:', rank)
    print('Inputs:', inputs)

predict_game()