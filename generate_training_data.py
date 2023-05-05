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

def process_match(match_index):
    with open('data/matches/' + str(match_index) + '.txt', 'r') as f:
        rows = f.read().split('\n')
        vec = []
        for j in range(10):
            champ_vec = get_champ_vec(rows[j])
            for e in champ_vec:
                vec.append(e)
        if rows[10] == 'true':
            vec.append(1)
        else:
            vec.append(0)
        return vec


a = 0
for i in range(150000):
    a += process_match(i)[0]