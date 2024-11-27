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
let playerAnswers = {}; // Key: socket.id, Value: answer index
let currentQuestionIndex = 0;

const fs = require('fs');
const path = require('path');

// Load questions from JSON file
let questions = [];
try {
    const questionsPath = path.join(__dirname, './public/data/questions.json');
    const questionsData = fs.readFileSync(questionsPath, 'utf8');
    questions = JSON.parse(questionsData);
    console.log('Questions loaded successfully.');
} catch (error) {
    console.error('Error loading questions:', error.message);
    process.exit(1); // Exit the app if questions cannot be loaded
}


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

        // Store the player's answer
        playerAnswers[socket.id] = answerIndex;

        // Notify the host about the number of submitted answers
        const totalPlayers = Object.keys(players).length;
        const submittedAnswers = Object.keys(playerAnswers).length;
        io.to('host').emit('update-submissions', { submittedAnswers, totalPlayers });
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
    });

    // server.js

    socket.on('next-question', () => {
        // If we are showing the breakdown, proceed to the scoreboard
        if (socket.showingBreakdown) {
            socket.showingBreakdown = false;
    
            // Prepare players' scores
            const playersData = Object.values(players).map(player => ({
                name: player.name,
                score: player.score
            }));
    
            // Send updated scores to the host
            io.to('host').emit('update-scores', playersData);
    
            // Check if there are more questions
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                // Reset player answers for the next question
                playerAnswers = {};
                io.to('host').emit('ready-next-question');
            } else {
                io.emit('quiz-finished');  // Inform players
                io.to('host').emit('quiz-finished', playersData);
            }
        } else {
            // First, send the breakdown of answers
            const question = questions[currentQuestionIndex];
            const answerCounts = question.answers.map(() => 0);
    
            // Count how many players chose each answer
            Object.values(playerAnswers).forEach(answerIndex => {
                answerCounts[answerIndex]++;
            });
    
            // Send the breakdown to the host
            io.to('host').emit('answer-breakdown', {
                question: question.question,
                answers: question.answers,
                counts: answerCounts
            });
    
            socket.showingBreakdown = true;
        }
    });
    

});
