// public/player.js

const socket = io();

// Elements
const joinContainer = document.getElementById('join-container');
const quizTitle = document.getElementById('quiz-title');
const nameInput = document.getElementById('name-input');
const joinButton = document.getElementById('join-btn');
const waitingRoom = document.getElementById('waiting-room');
const questionContainer = document.getElementById('question-container');
const finishedContainer = document.getElementById('finished-container');

let playerName = '';

joinButton.addEventListener('click', () => {
    playerName = nameInput.value.trim();
    if (playerName) {
        socket.emit('player-join', playerName);
        joinContainer.style.display = 'none';
        quizTitle.style.display = 'none';
        waitingRoom.style.display = 'block';
    }
});

// Listen for new questions
socket.on('new-question', (question) => {
    waitingRoom.style.display = 'none';
    questionContainer.style.display = 'block';
    showQuestion(question);
});

// Listen for the 'quiz-finished' event
socket.on('quiz-finished', () => {
    // Hide the quiz container
    questionContainer.style.display = 'none';

    // Show the finished screen with a simple "Finished" message
    finishedContainer.style.display = 'block';
});

let timerInterval; // Define the interval globally to ensure proper cleanup

function showQuestion(question) {
    // Clear any existing intervals before setting up a new one
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    questionContainer.innerHTML = '';

    // Display the timer
    const timerElement = document.createElement('div');
    timerElement.id = 'timer';
    timerElement.style.fontSize = '24px';
    timerElement.style.marginBottom = '20px';
    questionContainer.appendChild(timerElement);

    let timeLeft = 5; // 15 seconds for each question
    timerElement.innerText = `Time left: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = `Time left: ${timeLeft}s`;
        console.log("timeleft = ", timeLeft);

        if (timeLeft <= 0) {
            clearInterval(timerInterval); // Ensure timer stops
            timerInterval = null; // Reset the interval variable
            questionContainer.innerHTML = '<h2>Time is up! Waiting for next question...</h2>';
            socket.emit('submit-answer', -1); // -1 indicates no answer
        }
    }, 1000);

    // Create answer buttons
    const shapes = ['▲', '■', '●', '◆'];

    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.innerText = shapes[index];
        button.classList.add('answer-button');
        button.addEventListener('click', () => {
            if (timerInterval) {
                clearInterval(timerInterval); // Stop the timer when an answer is submitted
                timerInterval = null; // Reset the interval variable
            }
            socket.emit('submit-answer', index);
            questionContainer.innerHTML = '<h2>Answer submitted! Waiting for next question...</h2>';
        });
        questionContainer.appendChild(button);
    });
}

// Handle the 'quiz-finished' event
socket.on('quiz-finished', () => {
    // Clear any existing intervals when the quiz ends
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    questionContainer.style.display = 'none';
    finishedContainer.style.display = 'block';
});
