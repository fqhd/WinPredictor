import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  prediction: number
}

export default function predictionHandler(req: NextApiRequest, res: NextApiResponse<Data>) {


  res.status(200).json({ prediction: 0 })
}
