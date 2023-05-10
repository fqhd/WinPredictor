import type { NextApiRequest, NextApiResponse } from 'next'
import * as tf from "@tensorflow/tfjs"
import champVector from "../../src/champVector.json"

const predLimit = {
  uses: 0,
  lastClear: new Date()
}

type Data = {
  prediction: number
}

export default async function predictionHandler(req: NextApiRequest, res: NextApiResponse<Data | string>) {
  if (req.method != "GET") {
    return res.status(405).json("method not allowed")
  }

  const champQuery: string | undefined = req.query.champions as string | undefined
  if (!champQuery) return res.status(400).json("bad request")
  const champions = champQuery.replace(" ", "").split(",")

  if (champions.length != 10) return res.status(400).json("bad request")

  for (let champion of champions) {
    if (!(champion in champVector)) {
      return res.status(400).json(`champion ${champion} not found`)
    }
  }

  const msTimeDiff = new Date().getTime() - predLimit.lastClear.getTime()

  if(msTimeDiff < 60000 && predLimit.uses >= 50) {
    return res.status(429).json(`too many requests, try again in ${(60 - msTimeDiff/1000).toFixed(1)}s`)
  }

  predLimit.uses++
  if(msTimeDiff > 60000) {
    predLimit.lastClear = new Date()
    predLimit.uses = 0
  }

  const model = await tf.loadLayersModel(`http://${req.headers.host}/model/v1.json`);

  let inputs: number[] = [];
  for (const champ of champions) {
    // @ts-ignore
    inputs = inputs.concat(champVector[champ]);
  }

  const X = tf.tensor([inputs]);
  const result = model.predict(X);

  // @ts-ignore
  const prediction = (await result.data()).at(0);

  res.status(200).json({ prediction })
}
