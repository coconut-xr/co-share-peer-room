import { Action, Store, StoreLink, Subscriber } from "co-share"
import { Subject } from "rxjs"

export class RoomStore extends Store {
    public subscriber: Subscriber<RoomStore, [Array<string>]> = Subscriber.create(
        RoomStore,
        (connection, accept, deny) => {
            if (this.clients.length >= this.maxClients) {
                deny(`too many clients in this room`)
            } else {
                this.addClient(connection.userData.id)
                accept(this.clients.filter((id) => id != connection.userData.id))
            }
        }
    )

    public clients: Array<string>
    public signalObservable = new Subject<[string, any]>()
    public addClientObservable = new Subject<string>()
    public removeClientObservable = new Subject<string>()

    constructor(clients: Array<string>, private readonly maxClients: number = 10) {
        super()
        this.clients = clients
    }

    public signal = Action.create(this, "signal", (origin, message: any, receiverId?: string, senderId?: string) => {
        //the following routing algorithm assumes a star topology
        if (origin == null) {
            this.signal.publishTo({ to: "one", one: this.mainLink }, message, receiverId)
        } else if (origin.connection.userData.id === receiverId) {
            if (senderId != null) {
                this.signalObservable.next([senderId, message])
            }
        } else {
            const link = Array.from(this.linkSet).find((link) => link.connection.userData.id === receiverId)
            if (link == null) {
                throw new Error(`unable to find connection with receiver id ${receiverId}`)
            }
            this.signal.publishTo({ to: "one", one: link }, message, receiverId, origin.connection.userData.id)
        }
    })

    public onLink(link: StoreLink): void {}

    private addClient = Action.create(this, "addClient", (origin, clientId: string) => {
        this.clients = [...this.clients, clientId]
        this.addClientObservable.next(clientId)
        this.addClient.publishTo(origin == null ? { to: "all" } : { to: "all-except-one", except: origin }, clientId)
    })

    private removeClient = Action.create(this, "removeClient", (origin, clientId: string) => {
        this.clients = this.clients.filter((id) => id !== clientId)
        this.removeClientObservable.next(clientId)
        this.removeClient.publishTo(origin == null ? { to: "all" } : { to: "all-except-one", except: origin }, clientId)
    })

    public onUnlink(link: StoreLink): void {
        this.removeClient(link.connection.userData.id)
    }
}
