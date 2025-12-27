const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// The password is set via environment variable on Render
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gleam_default_secret";

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Data can be a string (username) or an object {username, password}
        const username = typeof data === 'object' ? data.username : data;
        const password = typeof data === 'object' ? data.password : '';
        
        socket.username = username || 'Anonymous';
        
        // Check if user is an admin
        socket.isAdmin = (password === ADMIN_PASSWORD);

        socket.broadcast.emit('message', {
            user: 'System',
            text: `${socket.username} has entered the gleam.`,
            type: 'system'
        });
    });

    socket.on('chatMessage', (msg) => {
        io.emit('message', {
            user: socket.username,
            text: msg,
            isAdmin: socket.isAdmin,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            io.emit('message', {
                user: 'System',
                text: `${socket.username} has faded away.`,
                type: 'system'
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Gleam Chat server running on port ${PORT}`);
});
