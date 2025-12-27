const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route to serve the chat interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining the chat
    socket.on('join', (username) => {
        socket.username = username || 'Anonymous';
        // Broadcast to others that a user joined
        socket.broadcast.emit('message', {
            user: 'System',
            text: `${socket.username} has entered the gleam.`,
            type: 'system'
        });
    });

    // Handle incoming messages
    socket.on('chatMessage', (msg) => {
        io.emit('message', {
            user: socket.username,
            text: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('message', {
                user: 'System',
                text: `${socket.username} has faded away.`,
                type: 'system'
            });
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Gleam Chat server running on port ${PORT}`);
});
