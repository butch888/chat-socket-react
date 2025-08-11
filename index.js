import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Разрешить доступ с любого источника
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  let typingUsers = {};

  socket.on('chat message', (msg) => {
    console.log(`message: ${msg}`);
    io.emit('chat message', msg);
    // При отправке сообщения убираем пользователя из списка печатающих
    delete typingUsers[socket.id];
    io.emit('typing', Object.values(typingUsers));
  });

  socket.on('typing', (userName) => {
    // Добавляем пользователя в список печатающих
    typingUsers[socket.id] = userName;
    io.emit('typing', Object.values(typingUsers));
  });

  socket.on('stop typing', () => {
    // Удаляем пользователя из списка печатающих
    delete typingUsers[socket.id];
    io.emit('typing', Object.values(typingUsers));
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    // При отключении убираем пользователя из списка печатающих
    delete typingUsers[socket.id];
    io.emit('typing', Object.values(typingUsers));
  });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
