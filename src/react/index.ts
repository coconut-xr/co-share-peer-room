import { Connection, RootStore, StoreLink } from "co-share"
import { useEffect, useState } from "react"
import { RoomStore } from ".."
import { Subscription } from "rxjs"
import { filter, map } from "rxjs/operators"
import { connectPeer } from "co-share-peer"
import { Instance, Options } from "simple-peer"

export function useRoom(
    room: RoomStore,
    rootStore: RootStore,
    generateOptions: (clientId: string) => Options,
    generateUserData?: (instance: Instance) => any
): Array<Connection> {
    const [connections, setConnections] = useState<Array<Connection>>([])
    useEffect(() => {
        const entries: Array<[Connection, StoreLink]> = []

        const remove = (removedClientId: string) => {
            //disconnect client & remove
            const index = entries.findIndex(([connection]) => connection.userData.id === removedClientId)
            if (index === -1) {
                return
            }
            const link = entries[index][1]
            link.close()
            entries.splice(index, 1)
            setConnections(entries.map(([connection]) => connection))
        }

        const add = async (addedClientId: string) => {
            //connect client & add
            const options = generateOptions(addedClientId)
            const entry = await connectPeer(
                options,
                () =>
                    room.signalObservable.pipe(
                        filter(([id]) => id === addedClientId),
                        map(([, msg]) => msg)
                    ),
                (msg) => room.signal(msg, addedClientId),
                async () => {
                    remove(addedClientId)
                    await add(addedClientId)
                },
                (instance) => ({
                    id: addedClientId,
                    ...(generateUserData != null ? generateUserData(instance) : {}),
                }),
                rootStore
            )
            entries.push(entry)
            setConnections(entries.map(([connection]) => connection))
        }

        //reset
        setConnections((a) => (a.length > 0 ? [] : a))

        //connect all clients
        room.clients.forEach(add)

        const subscription = new Subscription()
        subscription.add(room.addClientObservable.subscribe(add))
        subscription.add(room.removeClientObservable.subscribe(remove))

        return () => {
            subscription.unsubscribe()
            entries.forEach(([, link]) => link.close())
        }
    }, [room, rootStore, generateOptions, generateUserData])
    return connections
}
