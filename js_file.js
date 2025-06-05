// Global variables
let questionBank = {};
let currentUserType = '';
let currentTopic = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let showResult = false;
let score = 0;
let progress = {
    questionsAnswered: 0,
    correctAnswers: 0,
    categories: {}
};

const userTypes = [
    {
        id: 'councillor',
        title: 'Aspiring Councillor',
        description: 'Master local government, community leadership, and council procedures. Learn about mandatory training requirements, governance structures, and effective community engagement.',
        color: '#3B82F6'
    },
    {
        id: 'campaignManager',
        title: 'Campaign Manager',
        description: 'Understand modern campaign strategy, digital campaigning, electoral law, and compliance. Learn about targeting, messaging, and the latest developments in political advertising.',
        color: '#10B981'
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadQuestions();
        initializeEventListeners();
        populateCategories();
        showScreen('home-screen');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        alert('Failed to load quiz data. Please refresh the page.');
    }
});

// Load questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questionBank = await response.json();
    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}

// Initialize event listeners
function initializeEventListeners() {
    // Navigation buttons
    document.getElementById('start-journey-btn').addEventListener('click', () => showScreen('categories-screen'));
    document.getElementById('back-to-home').addEventListener('click', () => showScreen('home-screen'));
    document.getElementById('back-to-categories').addEventListener('click', () => showScreen('categories-screen'));
    
    // Quiz buttons
    document.getElementById('submit-answer').addEventListener('click', handleSubmitAnswer);
    document.getElementById('next-question').addEventListener('click', handleNextQuestion);
    
    // Results buttons
    document.getElementById('try-again').addEventListener('click', handleTryAgain);
    document.getElementById('choose-new-path').addEventListener('click', handleChooseNewPath);
}

// Show specific screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Populate categories screen
function populateCategories() {
    populateUserTypeCard('councillor');
    populateUserTypeCard('campaignManager');
}

// Populate individual user type card
function populateUserTypeCard(userType) {
    const topics = Object.keys(questionBank[userType] || {});
    let totalQuestions = 0;
    
    // Calculate total questions
    topics.forEach(topic => {
        totalQuestions += questionBank[userType][topic]?.length || 0;
    });
    
    // Update question count
    const countElement = document.getElementById(`${userType === 'councillor' ? 'councillor' : 'campaign-manager'}-count`);
    if (countElement) {
        countElement.textContent = totalQuestions;
    }
    
    // Populate topics list
    const topicsContainer = document.getElementById(`${userType === 'councillor' ? 'councillor' : 'campaign-manager'}-topics`);
    if (topicsContainer) {
        topicsContainer.innerHTML = '';
        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-item';
            topicElement.innerHTML = `
                <span class="topic-name">${topic}</span>
                <span class="topic-count">${questionBank[userType][topic]?.length || 0} questions</span>
            `;
            topicsContainer.appendChild(topicElement);
        });
    }
    
    // Populate topic buttons
    const topicButtonsContainer = document.getElementById(`${userType === 'councillor' ? 'councillor' : 'campaign-manager'}-topic-buttons`);
    if (topicButtonsContainer) {
        topicButtonsContainer.innerHTML = '';
        topics.forEach(topic => {
            const button = document.createElement('button');
            button.className = 'topic-btn';
            button.innerHTML = `
                ${topic} Focus (${questionBank[userType][topic]?.length || 0} Questions)
                <span class="arrow-icon">→</span>
            `;
            button.addEventListener('click', () => startQuiz(userType, topic));
            topicButtonsContainer.appendChild(button);
        });
    }
    
    // Add event listener for main quiz button
    const mainButton = document.querySelector(`.primary-btn[data-type="${userType}"]`);
    if (mainButton) {
        mainButton.addEventListener('click', () => startQuiz(userType, ''));
    }
}

// Start quiz with specific parameters
async function startQuiz(userType, topic = '') {
    currentUserType = userType;
    currentTopic = topic;
    
    showScreen('loading-screen');
    
    try {
        const questions = await getQuestions(userType, topic);
        if (questions.length === 0) {
            alert('No questions available for this selection.');
            showScreen('categories-screen');
            return;
        }
        
        currentQuestions = questions;
        currentQuestionIndex = 0;
        score = 0;
        selectedAnswer = null;
        showResult = false;
        progress = {
            questionsAnswered: 0,
            correctAnswers: 0,
            categories: {}
        };
        
        showScreen('quiz-screen');
        displayQuestion();
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert('Failed to load quiz questions. Please try again.');
        showScreen('categories-screen');
    }
}

// Get questions based on user type and topic
async function getQuestions(userType, topic = '') {
    let availableQuestions = [];
    
    if (questionBank[userType]) {
        if (topic && questionBank[userType][topic]) {
            // Specific topic questions
            availableQuestions = [...questionBank[userType][topic]];
        } else {
            // All questions for this user type
            Object.values(questionBank[userType]).forEach(topicQuestions => {
                if (Array.isArray(topicQuestions)) {
                    availableQuestions = [...availableQuestions, ...topicQuestions];
                }
            });
        }
    }
    
    // Shuffle and return subset
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20); // 20 questions per quiz
}

// Display current question
function displayQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResults();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    
    // Update question counter and progress
    document.getElementById('current-question-num').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = currentQuestions.length;
    
    const progressPercentage = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercentage}%`;
    
    // Update category and score
    document.getElementById('question-category').textContent = question.category || (currentTopic || 'Mixed Topics');
    const currentScorePercentage = currentQuestionIndex > 0 ? Math.round((score / currentQuestionIndex) * 100) : 0;
    document.getElementById('current-score').textContent = currentScorePercentage;
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Create answer options
    const answersContainer = document.getElementById('answers-section');
    answersContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-option';
        button.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span class="option-text">${option}</span>
        `;
        button.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(button);
    });
    
    // Reset UI state
    selectedAnswer = null;
    showResult = false;
    document.getElementById('explanation-section').style.display = 'none';
    document.getElementById('submit-answer').style.display = 'inline-block';
    document.getElementById('submit-answer').disabled = true;
    document.getElementById('next-question').style.display = 'none';
}

// Handle answer selection
function selectAnswer(answerIndex) {
    if (showResult) return;
    
    selectedAnswer = answerIndex;
    
    // Update UI
    document.querySelectorAll('.answer-option').forEach((option, index) => {
        option.classList.remove('selected');
        if (index === answerIndex) {
            option.classList.add('selected');
        }
    });
    
    document.getElementById('submit-answer').disabled = false;
}

// Handle answer submission
function handleSubmitAnswer() {
    if (selectedAnswer === null || showResult) return;
    
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;
    showResult = true;
    
    if (isCorrect) {
        score++;
    }
    
    // Update progress
    progress.questionsAnswered++;
    progress.correctAnswers += isCorrect ? 1 : 0;
    progress.categories[question.category] = (progress.categories[question.category] || 0) + (isCorrect ? 1 : 0);
    
    // Update answer options appearance
    document.querySelectorAll('.answer-option').forEach((option, index) => {
        option.disabled = true;
        if (index === question.correct) {
            option.classList.add('correct');
            option.innerHTML += '<span class="option-icon">✓</span>';
        } else if (index === selectedAnswer && index !== question.correct) {
            option.classList.add('incorrect');
            option.innerHTML += '<span class="option-icon">✗</span>';
        }
    });
    
    // Show explanation
    const explanationSection = document.getElementById('explanation-section');
    const explanationHeader = document.getElementById('explanation-header');
    const explanationText = document.getElementById('explanation-text');
    
    explanationHeader.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect';
    explanationText.textContent = question.explanation;
    explanationSection.style.display = 'block';
    
    // Update buttons
    document.getElementById('submit-answer').style.display = 'none';
    document.getElementById('next-question').style.display = 'inline-block';
    document.getElementById('next-question').textContent = 
        currentQuestionIndex < currentQuestions.length - 1 ? 'Next Question →' : 'View Results →';
}

// Handle next question
function handleNextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showResults();
    }
}

// Show results screen
function showResults() {
    const percentage = Math.round((score / currentQuestions.length) * 100);
    
    // Determine result type and update UI accordingly
    let resultType, icon, title, subtitle, scoreClass;
    
    if (percentage >= 80) {
        resultType = 'excellent';
        icon = '🏆';
        title = 'Excellent Work!';
        subtitle = 'You have a strong understanding of UK politics';
        scoreClass = 'excellent';
    } else if (percentage >= 60) {
        resultType = 'good';
        icon = '🎯';
        title = 'Good Progress!';
        subtitle = 'You\'re developing solid political knowledge';
        scoreClass = 'good';
    } else {
        resultType = 'needs-improvement';
        icon = '📚';
        title = 'Keep Learning!';
        subtitle = 'There\'s room for improvement - practice more';
        scoreClass = 'needs-improvement';
    }
    
    // Update results display
    document.getElementById('results-icon').textContent = icon;
    document.getElementById('results-title').textContent = title;
    document.getElementById('results-subtitle').textContent = subtitle;
    
    document.getElementById('final-score').textContent = `${score}/${currentQuestions.length}`;
    document.getElementById('percentage-score').textContent = `${percentage}% Correct`;
    
    document.getElementById('quiz-topic').textContent = currentTopic ? `Topic: ${currentTopic}` : 'Mixed Topics';
    document.getElementById('quiz-user-type').textContent = userTypes.find(t => t.id === currentUserType)?.title || '';
    
    // Update score bar
    const scoreFill = document.getElementById('score-fill');
    scoreFill.className = `score-fill ${scoreClass}`;
    setTimeout(() => {
        scoreFill.style.width = `${percentage}%`;
    }, 100);
    
    // Update performance stats
    document.getElementById('questions-answered').textContent = currentQuestions.length;
    document.getElementById('correct-answers').textContent = score;
    document.getElementById('success-rate').textContent = `${percentage}%`;
    
    // Show mentor suggestion if needed
    const mentorSuggestion = document.getElementById('mentor-suggestion');
    if (percentage < 70) {
        mentorSuggestion.style.display = 'block';
    } else {
        mentorSuggestion.style.display = 'none';
    }
    
    showScreen('results-screen');
}

// Handle try again
function handleTryAgain() {
    startQuiz(currentUserType, currentTopic);
}

// Handle choose new path
function handleChooseNewPath() {
    currentUserType = '';
    currentTopic = '';
    currentQuestions = [];
    currentQuestionIndex = 0;
    selectedAnswer = null;
    showResult = false;
    score = 0;
    progress = {
        questionsAnswered: 0,
        correctAnswers: 0,
        categories: {}
    };
    showScreen('categories-screen');
}

// Utility function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Error handling for failed requests
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// Service worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            }, function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}