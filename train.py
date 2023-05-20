import pickle
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras import losses
from tensorflow.keras import optimizers
import tensorboard
print(tf.config.list_physical_devices('GPU'))

BATCH_SIZE = 32
LR = 1e-5

def get_training_data(rank):
	with open(f'data/matches/{rank}.ds', 'rb') as f:
		training_data = pickle.load(f)
	train_len = int(training_data[0].shape[0] * 0.99)

	train_x = training_data[0][:train_len]
	train_y = training_data[1][:train_len]

	test_x = training_data[0][train_len:]
	test_y = training_data[1][train_len:]
	return (train_x, train_y), (test_x, test_y)

def create_model():
	model = keras.Sequential()
	model.add(layers.Dense(256, activation='relu', kernel_initializer='he_uniform', bias_initializer='zeros', input_dim=170))
	model.add(layers.Dense(128, activation='relu', kernel_initializer='he_uniform', bias_initializer='zeros'))
	model.add(layers.Dense(64, activation='relu', kernel_initializer='he_uniform', bias_initializer='zeros'))
	model.add(layers.Dense(16, activation='relu', kernel_initializer='he_uniform', bias_initializer='zeros'))
	model.add(layers.Dense(1))
	return model

def compile_and_fit(model, name, training_data):
	(train_x, train_y), _ = training_data
	optimizer = optimizers.Adam(learning_rate=LR)
	loss = losses.MeanAbsoluteError()
	model.compile(loss=loss, optimizer=optimizer)
	model.fit(train_x, train_y, batch_size=BATCH_SIZE, validation_split=0.01, epochs=200, callbacks=[TensorBoard(log_dir=f'logs/{name}')])

def train_model_rank(rank):
	data = get_training_data(rank)
	model = create_model()
	compile_and_fit(model, rank, data)

def main():
	ranks = ['grandmaster', 'master', 'diamond', 'platinum', 'gold', 'silver', 'bronze', 'iron']
	for rank in ranks:
		train_model_rank(rank)

main()