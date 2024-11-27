// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));

const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Store connected players
let players = {};
let currentQuestionIndex = 0;

// Sample questions (for now, you can add more)
const questions = [
    {
        question: "What is 2 + 2?",
        answers: [
            { text: "4", correct: true },
            { text: "22", correct: false },
            { text: "5", correct: false },
            { text: "2", correct: false }
        ]
    },
    {
        question: "What is the capital of France?",
        answers: [
            { text: "Berlin", correct: false },
            { text: "Madrid", correct: false },
            { text: "Paris", correct: true },
            { text: "Rome", correct: false }
        ]
    }
];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle player joining
    socket.on('player-join', (name) => {
        players[socket.id] = { name: name, score: 0 };
        console.log(`${name} joined the game.`);
    });

    // Handle player disconnect
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log(`${players[socket.id].name} disconnected.`);
            delete players[socket.id];
        }
    });


    socket.on('submit-answer', (answerIndex) => {
        const question = questions[currentQuestionIndex];
        const isCorrect = question.answers[answerIndex].correct;

        // Update player score if correct
        if (isCorrect) {
            players[socket.id].score += 1;
        }

        // Broadcast the answer to the host
        io.to('host').emit('player-answer', {
            id: socket.id,
            name: players[socket.id].name,
            answer: question.answers[answerIndex].text,
            correct: isCorrect
        });

        // Send updated scores to the host
        const playersData = Object.values(players).map(player => ({
            name: player.name,
            score: player.score
        }));
        io.to('host').emit('update-scores', playersData);
    });


    // Handle host joining
    socket.on('host-join', () => {
        socket.join('host');
        console.log('Host has joined.');
    });

    // Handle broadcasting new question to players
    socket.on('new-question', () => {
        const question = questions[currentQuestionIndex];
        io.emit('new-question', question);  // Broadcast the question to all players
        io.to('host').emit('new-question', question);  // Send to host for display
    });

    // server.js

    socket.on('next-question', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            io.emit('new-question', questions[currentQuestionIndex]);
        } else {
            // Prepare players' scores
            const playersData = Object.values(players).map(player => ({
                name: player.name,
                score: player.score
            }));
            console.log(playersData);
            io.emit('quiz-finished');  // Inform players
            // Send final scores to the host
            io.to('host').emit('quiz-finished', playersData);
            
        }
    });

});
