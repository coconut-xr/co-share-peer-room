import { connectionMiddleware } from "co-share-socketio/server"
import { Server } from "socket.io"
import { rootStore } from ".."
import { createServer } from "http"

const io = new Server({
    cors: {
        methods: ["GET", "POST"],
        credentials: true,
    },
})

io.use(connectionMiddleware(async (socket) => ({ id: socket.id }), rootStore))

const server = createServer((req, res) => {
    res.writeHead(404)
    res.end()
})

io.listen(server)

server.listen((process.env.PORT as any) ?? 8080)

console.log(`running on port "${process.env.PORT}"`)
