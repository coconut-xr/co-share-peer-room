import { connectionMiddleware } from "co-share-socketio/server"
import { Server } from "socket.io"
import { rootStore } from ".."

const io = new Server({
    cors: {
        methods: ["GET", "POST"],
        credentials: true,
    },
})

io.use(connectionMiddleware(async (socket) => ({ id: socket.id }), rootStore))

console.log(`running on port "${process.env.PORT}"`)

io.listen((process.env.PORT as any) ?? 8080)
