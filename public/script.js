const socket = io();

// UI Elements
const loginOverlay = document.getElementById('login-overlay');
const loginInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageContainer = document.getElementById('messages');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let username = '';
let particles = [];
let mouse = { x: -1000, y: -1000 };

// Login Logic
loginBtn.addEventListener('click', () => {
    const val = loginInput.value.trim();
    if (val) {
        // Simple name validation (Max 15 characters to match HTML attribute)
        if (val.length > 15) {
            loginInput.value = "";
            loginInput.placeholder = "Name too long!";
            return;
        }
        username = val;
        loginOverlay.style.display = 'none';
        socket.emit('join', username);
    }
});

loginInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

// Message Handling
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('chatMessage', text);
        messageInput.value = '';
        messageInput.focus();
    }
});

socket.on('message', (msg) => {
    appendMessage(msg);
});

function appendMessage(msg) {
    const div = document.createElement('div');
    
    if (msg.type === 'system') {
        div.className = 'system-msg';
        div.textContent = msg.text;
    } else {
        const isOutgoing = msg.user === username;
        div.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;
        
        div.innerHTML = `
            <div class="message-info">
                <span class="message-user">${msg.user}</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        `;
    }
    
    messageContainer.appendChild(div);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Gleam Background Animation
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = Math.random() > 0.4 ? '#9d174d' : '#ffffff';
        this.opacity = Math.random() * 0.3 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
            const force = (150 - distance) / 150;
            this.x -= (dx / distance) * force * 2;
            this.y -= (dy / distance) * force * 2;
        }

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
    }
}

function createParticles() {
    const count = (canvas.width * canvas.height) / 8000;
    particles = [];
    for (let i = 0; i < count; i++) particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    initCanvas();
    createParticles();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Initialization
initCanvas();
createParticles();
animate();
