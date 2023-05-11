export default class RateLimitManager {
    private uses: number
    private lastClear: Date
    private maxUses: number
    private clearInterval: number

    constructor(maxUses: number, clearIntervalInSeconds: number) {
        this.uses = 0
        this.lastClear = new Date()
        this.maxUses = maxUses
        this.clearInterval = clearIntervalInSeconds*1000
    }

    public getTimeDifference() {
        return (new Date().getTime() - this.lastClear.getTime())/1000
    }

    public addUse(): boolean {
        const timeDifference = this.getTimeDifference()
        if(this.uses >= this.maxUses && timeDifference < 60) {
            return false
        } else if(timeDifference >= 60) {
            this.lastClear = new Date()
            this.uses = 0
        }

        this.uses++

        return true
    }

    public getUses() {
        return this.uses
    }

}