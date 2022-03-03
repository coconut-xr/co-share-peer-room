import { NextRouter, useRouter } from "next/router"
import { useMemo, useRef, useState } from "react"
import { RoomRootStore } from "co-share-peer-room"
import ReactLoading from "react-loading"

export function RoomSelector({
    children,
    rootStore,
}: {
    rootStore: RoomRootStore
    children: (roomId: string) => JSX.Element
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const child = useMemo(
        () => (typeof router.query.roomId === "string" ? children(router.query.roomId) : undefined),
        [router]
    )
    if (child == null) {
        return (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center flex-column">
                <div className="d-flex flex-column rounded shadow p-3">
                    <CreateGame rootStore={rootStore} router={router} />
                    <hr/>
                    <div className="d-flex flex-row">
                        <input className="me-3" ref={inputRef} placeholder="##########"></input>
                        <button
                            onClick={() =>
                                router.push(
                                    {
                                        query: {
                                            roomId: inputRef.current!.value,
                                        },
                                    },
                                    undefined,
                                    { shallow: true }
                                )
                            }
                            className="btn btn-secondary">
                            Join Room
                        </button>
                    </div>
                </div>
            </div>
        )
    } else {
        return child
    }
}

export function CreateGame({ rootStore, router }: { rootStore: RoomRootStore; router: NextRouter }) {
    const [state, setState] = useState<{ type: "loading" } | { type: "error"; message: string } | undefined>(undefined)
    if (state == null || state.type === "error") {
        return (
            <button
                className="btn btn-primary"
                onClick={() => {
                    setState({ type: "loading" })
                    rootStore.createRoom().subscribe({
                        next: (roomId) =>
                            router.push(
                                {
                                    query: {
                                        roomId,
                                    },
                                },
                                undefined,
                                { shallow: true }
                            ),
                        error: (error) => setState({ type: "error", message: error.message }),
                    })
                }}>
                Create Room
            </button>
        )
    }
    return <ReactLoading width={35} height={35} type="spin" color="#fff" />
}
