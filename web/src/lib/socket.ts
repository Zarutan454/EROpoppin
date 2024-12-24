import { Server as HTTPServer } from 'http'
import { Socket as NetSocket } from 'net'
import { Server as IOServer } from 'socket.io'
import { NextApiResponse } from 'next'
import { prisma } from './prisma'

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface ResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export const initSocket = (res: ResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    return res.socket.server.io
  }

  const io = new IOServer(res.socket.server as any)
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('Client connected')

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId)
    })

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId)
    })

    socket.on('send-message', async (data: {
      content: string
      senderId: string
      receiverId: string
      roomId: string
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: data.senderId,
            receiverId: data.receiverId,
          },
        })

        io.to(data.roomId).emit('new-message', message)
      } catch (error) {
        console.error('Error sending message:', error)
      }
    })

    socket.on('typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-typing', { userId: data.userId })
    })

    socket.on('stop-typing', (data: { roomId: string; userId: string }) => {
      socket.to(data.roomId).emit('user-stop-typing', { userId: data.userId })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })
  })

  return io
}