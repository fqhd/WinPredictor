import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras import optimizers
from tensorflow.keras import losses
import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
print(tf.config.list_physical_devices('GPU'))

# Constants
BATCH_SIZE = 32
LR = 1e-6

df = pd.read_csv('champions.csv')
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
        if champs[10] == 'true':
            vec.append(1)
        else:
            vec.append(0)
        return vec

def process_ds_element(x):
    return (tf.cast(x[:-1], 'float32'), tf.cast(x[-1], 'float32'))

def get_dataset():
    tmp = []
    with open('data/matches/training_data.txt', 'r') as f:
        matches = f.read().split('\n')
        global NUM_GAMES
        NUM_GAMES = len(matches)
        for match in matches:
            try:
                tmp.append(process_match(match))
            except:
                NUM_GAMES-=1
    ds = tf.data.Dataset.from_tensor_slices(tmp)
    ds = ds.map(process_ds_element)
    ds = ds.cache()
    ds = ds.shuffle(NUM_GAMES)
    ds = ds.batch(BATCH_SIZE)
    ds = ds.prefetch(tf.data.AUTOTUNE)
    print(f'Using {NUM_GAMES} matches for training')
    return ds

print('Loading dataset, this may take a while...')
ds = get_dataset()

# Partition Dataset
train_size = int(len(ds)*0.7)
val_size = int(len(ds)*0.2)
test_size = len(ds) - (train_size + val_size)

train = ds.take(train_size)
val = ds.skip(train_size).take(val_size)
test = ds.skip(train_size+val_size).take(test_size)

print(train_size, val_size, test_size)

def create_model():
    model = keras.Sequential()
    model.add(layers.Dense(170, activation='relu', input_dim=170))
    model.add(layers.Dense(64, activation='relu'))
    model.add(layers.Dense(16, activation='relu'))
    model.add(layers.Dense(1))
    return model

model = create_model()

model.summary()

loss = losses.BinaryCrossentropy(from_logits=True)
optimizer = optimizers.Adam(learning_rate=LR)

model.compile(loss=loss, optimizer=optimizer, metrics=[tf.metrics.BinaryAccuracy(threshold=0.0)])

model.fit(train, validation_data=val, epochs=10000)

loss, accuracy = model.evaluate(test)
print('Loss:', loss)
print('Accuracy:', accuracy)

model.save('win_predictor.h5')