import mongoose from "mongoose";
import GameModel, { GameType } from "./types/Game";

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is a required field in .env")
}

mongoose.connect(process.env.MONGO_URI)

export async function addGame(rank: GameType['rank'], gameUrl: string) {
    const doc = new GameModel({
        rank,
        gameUrl
    })

    await doc.save()
}

export async function getAllGames(rank: GameType['rank'] | undefined = undefined, count: boolean = false) {
    if (!count) {
        return await GameModel.find(rank ? { rank } : {})
    }

    return await GameModel.count(rank ? { rank } : {})
}

export async function getGameByURL(gameUrl: string) {
    return await GameModel.findOne({ gameUrl })
}