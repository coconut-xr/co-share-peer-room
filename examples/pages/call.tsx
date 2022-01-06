import { useRoom, useIncommingPeerStreams, useOutgoingPeerStream } from "co-share-peer/react"
import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Instance } from "simple-peer"
import { Connection, RootStore } from "co-share"
import { MediaDevicesControl } from "../src/media-devices"
import { StreamType, useMediaDevices, useSelectDefaultMediaDevice, useStreamType } from "co-media"
import { Error } from "@material-ui/icons"
import { SocketIOConnection } from "co-share-socketio/react"
import { useStoreSubscription } from "co-share/react"
import { RoomStore } from "co-share-peer/room"
import { Socket } from "socket.io-client"

function generateUserData(instance: Instance) {
    return { instance }
}

function socketUserData(socket: Socket) {
    return { id: socket.id }
}

const url = typeof global.window === "undefined" ? "" : `${window.location.protocol}//${window.location.hostname}:8081`

export default function Index() {
    return (
        <SocketIOConnection userData={socketUserData} fallback="Connecting ..." url={url}>
            <Suspense fallback={"Loading ..."}>
                <ConnectingPage />
            </Suspense>
        </SocketIOConnection>
    )
}

function ConnectingPage() {
    const store = useStoreSubscription("room", 1000, (clients: Array<string>) => new RoomStore(clients))
    const rootStore = useMemo(() => new RootStore(new Map()), [store])
    const connections = useRoom(
        store,
        rootStore,
        useCallback(
            (id) => ({
                initiator: id > store.mainLink.connection.userData.id,
            }),
            [store.mainLink.connection.userData.id]
        ),
        generateUserData
    )

    return (
        <Suspense fallback={null}>
            <ConnectedPage connections={connections} />
        </Suspense>
    )
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
        <div className="fullscreen d-flex flex-column">
            <div className="d-flex flex-grow-1 flex-row flex-wrap justify-content-around overflow-hidden">
                {connections.map((connection) => (
                    <ConnectionPage
                        outgoingStreams={outgoingStreams}
                        key={connection.userData.id}
                        connection={connection}
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

function ConnectionPage({
    outgoingStreams,
    connection,
}: {
    outgoingStreams: Array<MediaStream>
    connection: Connection
}) {
    const incommingStreams = useIncommingPeerStreams(connection.userData.peer)

    useOutgoingPeerStream(connection.userData.peer, outgoingStreams)

    return (
        <div className="d-flex flex-column p-3 m-3 border rounded overflow-hidden flex-grow-1">
            <h3>{connection.userData.id}</h3>
            <div className="d-flex flex-row flex-grow-1 flex-column overflow-hidden">
                {incommingStreams.map((stream) => (
                    <Stream key={stream.id} stream={stream} />
                ))}
            </div>
        </div>
    )
}

export function Stream({ stream }: { stream: MediaStream }): JSX.Element {
    const type = useStreamType(stream)
    const ref = useRef<HTMLVideoElement | null>(null)
    useLayoutEffect(() => {
        if (ref.current != null) {
            ref.current.srcObject = stream
            ref.current.play()
        }
    }, [stream])
    switch (type) {
        case StreamType.AUDIO:
            return <audio ref={ref} />
        case StreamType.VIDEO:
            return (
                <video
                    style={{ minHeight: 0, minWidth: 0 }}
                    playsInline
                    className="flex-grow-1 flex-basis-0"
                    ref={ref}
                />
            )
        default:
            ref.current = null
            return <Error />
    }
}

function filterNull<T>(val: T | undefined): val is T {
    return val != null
}
