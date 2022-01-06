import { rootStore } from "co-share"
import { connectionMiddleware } from "co-share-socketio/server"
import { Server } from "socket.io"
import { RoomStore } from "co-share-peer/room"

const io = new Server({
    cors: {
        methods: ["GET", "POST"],
        credentials: true,
    },
})

rootStore.addStore(new RoomStore([]), "room")

io.use(connectionMiddleware(async (socket) => ({ id: socket.id })))

io.listen(8081)
