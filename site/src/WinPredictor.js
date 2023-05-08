import * as tf from '@tensorflow/tfjs';

export default async function predict(champions) {
    const model = await tf.loadLayersModel('/model/model.json');
    const X = tf.ones([1, 170]);
    const result = model.predict(X);
    result.print();
}