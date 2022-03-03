import { RootStore, Request } from "co-share"
import { RoomStore } from "."
import { of } from "rxjs"
import { v4 as uuid } from "uuid"

export class RoomRootStore extends RootStore {
    createRoom: Request<this, [], string> = Request.create(this, "createGame", (origin) => {
        if (origin == null) {
            return this.createRoom.publishTo(this.mainLink)
        }
        const id = uuid()
        this.addStore(new RoomStore([]), id)
        return of(id)
    })
}

export const rootStore = new RoomRootStore(new Map())
