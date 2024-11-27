// public/host.js

const socket = io();

// Join as host
socket.emit('host-join');

// Elements
const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const questionContainer = document.getElementById('question-container');
const finishedContainer = document.getElementById('finished-container');
const submissionInfo = document.getElementById('submission-info');

startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    socket.emit('new-question');  // Ask the server to emit the first question
});

nextButton.addEventListener('click', () => {
    socket.emit('next-question');  // Ask for the next question
});

// Receive new question from the server
socket.on('new-question', (question) => {
    questionContainer.innerHTML = `<h2>${question.question}</h2>`;
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('answer-button');
        //questionContainer.innerHTML += `<p>${index + 1}: ${answer.text}</p>`;
        questionContainer.appendChild(button);
    });

    nextButton.style.display = 'block';
    console.log("recieved question in host");
});

socket.on('quiz-finished', (playersData) => {
    // Hide quiz elements
    questionContainer.style.display = 'none';
    nextButton.style.display = 'none';
    submissionInfo.style.display = 'none';

    // Display the final scores
    finishedContainer.style.display = 'block';
    finishedContainer.innerHTML = '<h2>Final Scores</h2>';
    updateScores(playersData);
});


// Receive answers from players
socket.on('player-answer', (data) => {
    console.log(`Player ${data.name} answered: ${data.answer}, Correct: ${data.correct}`);
});

// Listen for updated scores from the server
socket.on('update-scores', (playersData) => {
    updateScores(playersData);
    // change text in button for next question
    nextButton.innerText = "Next Question";
});


function updateScores(playersData) {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '<h2>Scores</h2>';

    // Sort players by score in descending order
    playersData.sort((a, b) => b.score - a.score);

    playersData.forEach(player => {
        const p = document.createElement('p');
        p.innerText = `${player.name}: ${player.score}`;
        scoreboard.appendChild(p);
    });
}
// Display the number of submitted answers
socket.on('update-submissions', ({ submittedAnswers, totalPlayers }) => {
    const submissionInfo = document.getElementById('submission-info');
    submissionInfo.innerText = `Submitted Answers: ${submittedAnswers}/${totalPlayers}`;
});

socket.on('answer-breakdown', (data) => {
    // Clear the question container and add the question text
    questionContainer.innerHTML = `<h2>${data.question}</h2>`;

    // Create the container for bars
    const breakdownContainer = document.createElement('div');
    breakdownContainer.id = 'breakdown-container';

    const maxVotes = Math.max(...data.counts); // Get the highest vote count for scaling

    data.answers.forEach((answer, index) => {
        // Create a container for each bar
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        // Create the bar itself
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${(data.counts[index] / maxVotes) * 200}px`; // Scale height
        bar.style.backgroundColor = getAnswerColor(index);

        // Add vote count above the bar
        const countText = document.createElement('span');
        countText.innerText = data.counts[index];
        bar.appendChild(countText);

        // Add answer label below the bar
        const answerLabel = document.createElement('div');
        answerLabel.className = 'bar-label';
        answerLabel.innerText = answer.text;

        // Append elements to the container
        barContainer.appendChild(bar);
        barContainer.appendChild(answerLabel);
        breakdownContainer.appendChild(barContainer);
    });

    questionContainer.appendChild(breakdownContainer);

    // Update button text to "Show Scores"
    nextButton.innerText = 'Show Scores';
});

// Helper function to assign colors to answers
function getAnswerColor(index) {
    const colors = ['#d9534f', '#5bc0de', '#f0ad4e', '#5cb85c']; // Red, Blue, Yellow, Green
    return colors[index % colors.length];
}


socket.on('ready-next-question', () => {
    nextButton.innerText = 'Next Question';
    submissionInfo.innerText = '';
    socket.emit('new-question');  // Request the next question
});

