import { getAllGames } from "@/src/database/core";
import { NextApiRequest, NextApiResponse } from "next";

export default async function getTrainedGamesHandler(req: NextApiRequest, res: NextApiResponse<number| string>) {
    if(req.method != "GET") return res.status(405).json("method not allowed")

    return res.status(200).json(await getAllGames(undefined, true) as number)
}