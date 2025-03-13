// DOM Elements
const display = document.getElementById('input');
const historyDisplay = document.getElementById('history');
const historyList = document.getElementById('history-list');
const buttons = document.querySelectorAll('.btn');
const themeIcon = document.getElementById('theme-icon');
const calculator = document.querySelector('.calculator');
const body = document.body;

// Calculator state
let currentInput = '0';
let previousInput = '';
let calculationHistory = '';
let result = null;
let lastOperation = '';
let decimalAdded = false;
let degreeMode = true;
let memoryValue = 0;
let lastAnswer = 0;
let isInverseMode = false;
let calculationsHistory = [];
const MAX_HISTORY_ITEMS = 10;

// Initialize the calculator
function init() {
    bindEvents();
    loadHistory();
    renderHistoryList();
    handleOrientationChange();
}

// Load history from localStorage
function loadHistory() {
    const savedHistory = localStorage.getItem('calculationsHistory');
    if (savedHistory) {
        try {
            calculationsHistory = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Error parsing saved history:', e);
            calculationsHistory = [];
        }
    }
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem('calculationsHistory', JSON.stringify(calculationsHistory));
}

// Add calculation to history
function addToHistory(expression, result) {
    // Format the result to avoid extremely long numbers
    let formattedResult = result;
    if (typeof result === 'number') {
        // If the number is very large or has many decimal places, format it
        if (Math.abs(result) > 1e10 || (result.toString().includes('.') && result.toString().split('.')[1].length > 10)) {
            formattedResult = parseFloat(result.toPrecision(10));
        }
    }

    calculationsHistory.unshift({
        expression: expression,
        result: formattedResult,
        timestamp: new Date().toISOString()
    });
    
    // Limit history to MAX_HISTORY_ITEMS
    if (calculationsHistory.length > MAX_HISTORY_ITEMS) {
        calculationsHistory = calculationsHistory.slice(0, MAX_HISTORY_ITEMS);
    }
    
    saveHistory();
    renderHistoryList();
}

// Render history list
function renderHistoryList() {
    historyList.innerHTML = '';
    
    calculationsHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = `${item.expression} = ${item.result}`;
        historyItem.addEventListener('click', () => {
            currentInput = item.result.toString();
            updateDisplay();
        });
        historyList.appendChild(historyItem);
    });
}

// Handle orientation change
function handleOrientationChange() {
    // Check if we're on a mobile device
    if (window.matchMedia("(max-width: 768px)").matches) {
        // Listen for orientation changes
        window.addEventListener('resize', adjustLayoutForOrientation);
        // Initial check
        adjustLayoutForOrientation();
    }
}

// Adjust layout based on orientation
function adjustLayoutForOrientation() {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const buttonsContainer = document.querySelector('.buttons');
    const memoryFunctions = document.querySelector('.memory-functions');
    
    if (isLandscape && window.innerHeight < 500) {
        // Landscape mode on small screens
        buttonsContainer.style.gridTemplateColumns = 'repeat(10, 1fr)';
        memoryFunctions.style.gridTemplateColumns = 'repeat(10, 1fr)';
        document.querySelector('[data-action="equals"]').style.gridColumn = 'span 1';
    } else {
        // Portrait mode or larger screens
        buttonsContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
        memoryFunctions.style.gridTemplateColumns = 'repeat(5, 1fr)';
        document.querySelector('[data-action="equals"]').style.gridColumn = 'span 2';
    }
}

// Bind all event listeners
function bindEvents() {
    buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick);
    });

    document.querySelectorAll('.memory-btn').forEach(button => {
        button.addEventListener('click', handleMemoryOperation);
    });

    themeIcon.addEventListener('click', toggleTheme);
    
    // Add keyboard support
    document.addEventListener('keydown', handleKeyboardInput);
}

// Handle keyboard input
function handleKeyboardInput(e) {
    // Prevent default actions for some keys
    if (['+', '-', '*', '/', '=', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Map keyboard keys to calculator actions
    switch (e.key) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            handleNumberInput(e.key);
            break;
        case '.':
        case ',':
            handleDecimalInput();
            break;
        case '+':
            handleOperatorInput('add');
            break;
        case '-':
            handleOperatorInput('subtract');
            break;
        case '*':
            handleOperatorInput('multiply');
            break;
        case '/':
            handleOperatorInput('divide');
            break;
        case '=':
        case 'Enter':
            calculateResult();
            break;
        case 'Escape':
        case 'Delete':
        case 'Backspace':
            clearCalculator();
            break;
        case '(':
            currentInput += '(';
            break;
        case ')':
            currentInput += ')';
            break;
        case '%':
            calculatePercentage();
            break;
    }
    
    updateDisplay();
}

// Handle button clicks
function handleButtonClick(e) {
    const button = e.target;
    const action = button.dataset.action;
    const buttonText = button.innerText;

    // If button is a number
    if (button.classList.contains('number')) {
        handleNumberInput(buttonText);
    }
    // If button is a decimal point
    else if (action === 'decimal') {
        handleDecimalInput();
    }
    // If button is an operator
    else if (button.classList.contains('operator')) {
        handleOperatorInput(action);
    }
    // If button is a function
    else if (button.classList.contains('function') || button.classList.contains('trig')) {
        handleFunctionInput(action, buttonText);
    }

    updateDisplay();
}

// Handle number input
function handleNumberInput(number) {
    if (currentInput === '0' || currentInput === 'Error') {
        currentInput = number;
    } else {
        currentInput += number;
    }
}

// Handle decimal input
function handleDecimalInput() {
    if (!decimalAdded) {
        currentInput += '.';
        decimalAdded = true;
    }
}

// Handle operator input
function handleOperatorInput(action) {
    const operations = {
        'add': '+',
        'subtract': '-',
        'multiply': '×',
        'divide': '÷'
    };

    if (currentInput === 'Error') {
        return;
    }

    const operator = operations[action];
    
    if (currentInput !== '0') {
        previousInput = currentInput;
        calculationHistory = currentInput + ' ' + operator + ' ';
        currentInput = '0';
        decimalAdded = false;
    } else if (previousInput !== '') {
        calculationHistory = previousInput + ' ' + operator + ' ';
    }
}

// Handle function input
function handleFunctionInput(action, buttonText) {
    switch (action) {
        case 'clear':
            clearCalculator();
            break;
        case 'equals':
            calculateResult();
            break;
        case 'deg-rad':
            toggleDegreeMode(buttonText);
            break;
        case 'sin':
            calculateTrigFunction('sin');
            break;
        case 'cos':
            calculateTrigFunction('cos');
            break;
        case 'tan':
            calculateTrigFunction('tan');
            break;
        case 'log':
            calculateLogarithm(10);
            break;
        case 'ln':
            calculateLogarithm(Math.E);
            break;
        case 'sqrt':
            calculateSquareRoot();
            break;
        case 'power':
            handlePowerInput();
            break;
        case 'factorial':
            calculateFactorial();
            break;
        case 'pi':
            insertConstant(Math.PI);
            break;
        case 'e':
            insertConstant(Math.E);
            break;
        case 'percent':
            calculatePercentage();
            break;
        case 'inverse':
            toggleInverseMode();
            break;
        case 'open-bracket':
            currentInput += '(';
            break;
        case 'close-bracket':
            currentInput += ')';
            break;
        case 'exp':
            currentInput += 'e+';
            break;
        case 'ans':
            insertLastAnswer();
            break;
    }
}

// Clear calculator
function clearCalculator() {
    currentInput = '0';
    previousInput = '';
    calculationHistory = '';
    result = null;
    decimalAdded = false;
}

// Calculate result
function calculateResult() {
    if (currentInput === 'Error') {
        return;
    }

    try {
        // Prepare the expression for evaluation
        let expression = calculationHistory + currentInput;
        let evalExpression = expression.replace(/×/g, '*').replace(/÷/g, '/');
        evalExpression = evalExpression.replace(/(\d+)e\+(\d+)/g, '$1*10**$2');
        
        // Evaluate the expression
        result = eval(evalExpression);
        
        if (!isFinite(result)) {
            throw new Error('Division by zero or overflow');
        }
        
        // Update history and current input
        historyDisplay.textContent = expression + ' =';
        
        // Add to calculation history
        addToHistory(expression, result);
        
        currentInput = result.toString();
        lastAnswer = result;
        calculationHistory = '';
        decimalAdded = currentInput.includes('.');
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Toggle degree/radian mode
function toggleDegreeMode(buttonText) {
    if (buttonText === 'Deg') {
        degreeMode = false;
        document.querySelector('[data-action="deg-rad"]').innerText = 'Rad';
    } else {
        degreeMode = true;
        document.querySelector('[data-action="deg-rad"]').innerText = 'Deg';
    }
}

// Calculate trigonometric functions
function calculateTrigFunction(func) {
    if (currentInput === 'Error') {
        return;
    }

    try {
        let value = parseFloat(currentInput);
        
        // Convert to radians if in degree mode
        if (degreeMode && func !== 'ln' && func !== 'log') {
            value = value * (Math.PI / 180);
        }
        
        let result;
        
        if (isInverseMode) {
            switch (func) {
                case 'sin':
                    result = Math.asin(value);
                    break;
                case 'cos':
                    result = Math.acos(value);
                    break;
                case 'tan':
                    result = Math.atan(value);
                    break;
            }
            
            // Convert back to degrees if in degree mode
            if (degreeMode) {
                result = result * (180 / Math.PI);
            }
        } else {
            switch (func) {
                case 'sin':
                    result = Math.sin(value);
                    break;
                case 'cos':
                    result = Math.cos(value);
                    break;
                case 'tan':
                    result = Math.tan(value);
                    break;
            }
        }
        
        // Add to calculation history
        const funcName = document.querySelector(`[data-action="${func}"]`).innerText;
        const expression = `${funcName}(${currentInput})`;
        addToHistory(expression, result);
        
        currentInput = result.toString();
        decimalAdded = true;
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Calculate logarithm
function calculateLogarithm(base) {
    if (currentInput === 'Error') {
        return;
    }

    try {
        const value = parseFloat(currentInput);
        
        if (value <= 0) {
            throw new Error('Invalid input for logarithm');
        }
        
        let result;
        let funcName;
        
        if (isInverseMode) {
            // Calculate power instead of logarithm
            result = Math.pow(base, value);
            funcName = base === 10 ? '10^' : 'e^';
        } else {
            // Calculate logarithm
            result = base === 10 ? Math.log10(value) : Math.log(value);
            funcName = base === 10 ? 'log' : 'ln';
        }
        
        // Add to calculation history
        const expression = `${funcName}(${currentInput})`;
        addToHistory(expression, result);
        
        currentInput = result.toString();
        decimalAdded = true;
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Calculate square root
function calculateSquareRoot() {
    if (currentInput === 'Error') {
        return;
    }

    try {
        const value = parseFloat(currentInput);
        
        if (value < 0 && !isInverseMode) {
            throw new Error('Cannot calculate square root of negative number');
        }
        
        let result;
        let expression;
        
        if (isInverseMode) {
            // Calculate square instead of square root
            result = Math.pow(value, 2);
            expression = `(${currentInput})²`;
        } else {
            // Calculate square root
            result = Math.sqrt(value);
            expression = `√(${currentInput})`;
        }
        
        // Add to calculation history
        addToHistory(expression, result);
        
        currentInput = result.toString();
        decimalAdded = true;
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Handle power input
function handlePowerInput() {
    if (currentInput === 'Error') {
        return;
    }
    
    previousInput = currentInput;
    calculationHistory = currentInput + ' ^ ';
    currentInput = '0';
    decimalAdded = false;
}

// Calculate factorial
function calculateFactorial() {
    if (currentInput === 'Error') {
        return;
    }

    try {
        const num = parseInt(currentInput);
        
        if (num < 0 || !Number.isInteger(num)) {
            throw new Error('Factorial only defined for positive integers');
        }
        
        let result = 1;
        for (let i = 2; i <= num; i++) {
            result *= i;
        }
        
        // Add to calculation history
        const expression = `${currentInput}!`;
        addToHistory(expression, result);
        
        currentInput = result.toString();
        decimalAdded = false;
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Insert constant (pi or e)
function insertConstant(constant) {
    if (currentInput === '0' || currentInput === 'Error') {
        currentInput = constant.toString();
    } else {
        currentInput += constant.toString();
    }
    decimalAdded = true;
}

// Calculate percentage
function calculatePercentage() {
    if (currentInput === 'Error') {
        return;
    }

    try {
        const value = parseFloat(currentInput);
        const result = value / 100;
        
        // Add to calculation history
        const expression = `${currentInput}%`;
        addToHistory(expression, result);
        
        currentInput = result.toString();
        decimalAdded = true;
    } catch (error) {
        currentInput = 'Error';
        console.error('Calculation error:', error);
    }
}

// Toggle inverse mode
function toggleInverseMode() {
    isInverseMode = !isInverseMode;
    
    // Update button text to reflect inverse mode
    const sinBtn = document.querySelector('[data-action="sin"]');
    const cosBtn = document.querySelector('[data-action="cos"]');
    const tanBtn = document.querySelector('[data-action="tan"]');
    const logBtn = document.querySelector('[data-action="log"]');
    const lnBtn = document.querySelector('[data-action="ln"]');
    const sqrtBtn = document.querySelector('[data-action="sqrt"]');
    
    if (isInverseMode) {
        sinBtn.innerText = 'sin⁻¹';
        cosBtn.innerText = 'cos⁻¹';
        tanBtn.innerText = 'tan⁻¹';
        logBtn.innerText = '10^x';
        lnBtn.innerText = 'e^x';
        sqrtBtn.innerText = 'x²';
    } else {
        sinBtn.innerText = 'sin';
        cosBtn.innerText = 'cos';
        tanBtn.innerText = 'tan';
        logBtn.innerText = 'log';
        lnBtn.innerText = 'ln';
        sqrtBtn.innerText = '√';
    }
}

// Insert last answer
function insertLastAnswer() {
    if (currentInput === '0' || currentInput === 'Error') {
        currentInput = lastAnswer.toString();
    } else {
        currentInput += lastAnswer.toString();
    }
    decimalAdded = lastAnswer.toString().includes('.');
}

// Handle memory operations
function handleMemoryOperation(e) {
    const action = e.target.dataset.action;
    
    switch (action) {
        case 'memory-clear':
            memoryValue = 0;
            break;
        case 'memory-recall':
            currentInput = memoryValue.toString();
            decimalAdded = currentInput.includes('.');
            break;
        case 'memory-add':
            memoryValue += parseFloat(currentInput);
            break;
        case 'memory-subtract':
            memoryValue -= parseFloat(currentInput);
            break;
        case 'memory-store':
            memoryValue = parseFloat(currentInput);
            break;
    }
    
    updateDisplay();
}

// Toggle theme
function toggleTheme() {
    calculator.classList.toggle('dark-theme');
    body.classList.toggle('dark');
    
    if (body.classList.contains('dark')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// Update display
function updateDisplay() {
    display.textContent = currentInput;
    historyDisplay.textContent = calculationHistory;
}

// Clear history
function clearHistory() {
    calculationsHistory = [];
    saveHistory();
    renderHistoryList();
}

// Initialize the calculator
init(); 