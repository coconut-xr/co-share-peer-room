import { useIncommingPeerStreams, useOutgoingPeerStream } from "co-share-peer/react"
import { Suspense, useCallback, useMemo, useState } from "react"
import { Instance, Options } from "simple-peer"
import { Connection, RootStore } from "co-share"
import { useMediaDevices, useSelectDefaultMediaDevice } from "co-media"
import { MediaDevicesControl, Stream } from "../components"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import MD from "../content/stream.md"
import { SocketIOConnection } from "co-share-socketio/react"
import { useStoreSubscription } from "co-share/react"
import { Socket } from "socket.io-client"
import { RoomStore, rootStore } from "co-share-peer-room"
import { useRoom } from "co-share-peer-room/react"
import ReactLoading from "react-loading"
import { RoomSelector } from "../components/room-selector"

export default function Index() {
    return (
        <div className="d-flex flex-column fullscreen">
            <Header selectedIndex={1} />
            <div className="d-flex flex-column justify-content-stretch container-lg">
                <div style={{ height: "calc(90vh - 176px)" }} className="d-flex flex-row-responsive border mt-3">
                    <Environment />
                </div>
                <div className="p-3 flex-basis-0 flex-grow-1">
                    <MD />
                </div>
            </div>
            <Footer />
        </div>
    )
}

const optionsC1: Options = {
    initiator: true,
}
const optionsC2: Options = {}

function generateUserData(instance: Instance) {
    return { instance }
}

function socketUserData(socket: Socket) {
    return { id: socket.id }
}

const url = typeof global.window === "undefined" ? "" : `https://cspr-provider.azurewebsites.net`

export function Environment() {
    return (
        <SocketIOConnection providedRootStore={rootStore} userData={socketUserData} fallback="Connecting ..." url={url}>
            <RoomSelector rootStore={rootStore}>
                {(roomId) => (
                    <Suspense fallback={<ReactLoading width={35} height={35} type="spin" color="#fff" />}>
                        <ConnectingPage roomId={roomId} />
                    </Suspense>
                )}
            </RoomSelector>
        </SocketIOConnection>
    )
}

function ConnectingPage({ roomId }: { roomId: string }) {
    const store = useStoreSubscription(
        roomId,
        1000,
        (clients: Array<string>) => new RoomStore(clients),
        undefined,
        rootStore
    )
    const p2pRootStore = useMemo(() => new RootStore(new Map()), [store])
    const connections = useRoom(
        store,
        p2pRootStore,
        useCallback(
            (id) => ({
                initiator: id > store.mainLink.connection.userData.id,
            }),
            [store.mainLink.connection.userData.id]
        ),
        generateUserData
    )

    return (
        <Notice connectionAmount={connections.length}>
            <Suspense fallback={null}>
                <ConnectedPage connections={connections} />
            </Suspense>
        </Notice>
    )
}

function Notice({ children, connectionAmount }: { connectionAmount: number; children: JSX.Element }) {
    const [confirmed, setConfirmed] = useState(false)

    if (confirmed) {
        return children
    } else {
        return (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center flex-column">
                <div className="d-flex flex-column rounded shadow p-3">
                    <h5>You are joining a room with {connectionAmount} users.</h5>
                    <button onClick={() => setConfirmed(true)} className="btn btn-primary">
                        Ok
                    </button>
                </div>
            </div>
        )
    }
}

function ConnectedPage({ connections }: { connections: Array<Connection> }) {
    const [outgroundAudioStream, setOutgroundAudioStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundVideoStream, setOutgroundVideoStream] = useState<MediaStream | undefined>(undefined)
    const [outgroundScreenStream, setOutgroundScreenStream] = useState<MediaStream | undefined>(undefined)

    const outgoingStreams = useMemo(
        () => [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream].filter(filterNull),
        [outgroundAudioStream, outgroundVideoStream, outgroundScreenStream]
    )

    const devices = useMediaDevices()

    const audioInput = useSelectDefaultMediaDevice("audioinput", devices)
    const videoInput = useSelectDefaultMediaDevice("videoinput", devices)
    const screenCapture = useSelectDefaultMediaDevice("screencapture", devices)

    return (
        <div className="d-flex flex-grow-1 flex-column overflow-hidden flex-basis-0">
            <div className="d-flex flex-grow-1 flex-basis-0 flex-row overflow-hidden justify-content-around overflow-hidden">
                {connections.map((connection) => (
                    <SlaveStreamPage
                        key={connection.userData.id}
                        connection={connection}
                        outgoingStreams={outgoingStreams}
                    />
                ))}
            </div>
            <div className="d-flex flex-row align-items-center justify-content-center">
                <MediaDevicesControl
                    audioInput={audioInput}
                    videoInput={videoInput}
                    screenCapture={screenCapture}
                    setAudioStream={setOutgroundAudioStream}
                    setVideoStream={setOutgroundVideoStream}
                    setScreenStream={setOutgroundScreenStream}
                />
            </div>
        </div>
    )
}

function SlaveStreamPage({
    outgoingStreams,
    connection,
}: {
    outgoingStreams: Array<MediaStream>
    connection: Connection
}) {
    //TODO: we only start listening to the stream changes on here, but we should start listening right at the beginning when we establish the connection
    const incommingStreams = useIncommingPeerStreams(connection.userData.peer)
    useOutgoingPeerStream(connection.userData.peer, outgoingStreams)

    return (
        <div className="d-flex flex-grow-1 flex-basis-0 flex-column overflow-hidden justify-content-around overflow-hidden">
            {incommingStreams.map((stream) => (
                <Stream key={stream.id} stream={stream} />
            ))}
            <h5 className="text-center">{connection.userData.id}</h5>
        </div>
    )
}

function filterNull<T>(val: T | undefined): val is T {
    return val != null
}
