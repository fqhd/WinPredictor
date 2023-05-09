import * as tf from '@tensorflow/tfjs';
import champ2vec from './champ2vec.json'

export default async function predict(champions) {
    const model = await tf.loadLayersModel('/model/model.json');
    let inputs = [];
    for(const champ of champions) {
        inputs = inputs.concat(champ2vec[champ]);
    }
    const X = tf.tensor([inputs]);
    const result = model.predict(X);
    const prediction = await result.data();
    return prediction[0];
}