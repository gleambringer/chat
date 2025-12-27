const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active users
const users = new Map();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        users.set(socket.id, username);
        
        // Broadcast to others that a user joined
        socket.broadcast.emit('message', {
            type: 'system',
            text: `${username} joined the gleam.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // Send welcome message to the user who joined
        socket.emit('message', {
            type: 'system',
            text: `Welcome, ${username}!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (msg) => {
        const username = users.get(socket.id) || 'Anonymous';
        
        const messageData = {
            user: username,
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'user'
        };

        // Send to everyone including sender
        io.emit('message', messageData);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('message', {
                type: 'system',
                text: `${username} left the gleam.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            users.delete(socket.id);
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
