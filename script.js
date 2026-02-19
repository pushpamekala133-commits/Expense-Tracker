// Initialize variables
let transactions = [];
let currentFilter = 'all';

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const typeInput = document.getElementById('type');
const typeButtons = document.querySelectorAll('.type-btn');
const transactionsList = document.getElementById('transactionsList');
const totalBalance = document.getElementById('totalBalance');
const totalIncome = document.getElementById('totalIncome');
const totalExpense = document.getElementById('totalExpense');
const filterBtns = document.querySelectorAll('.filter-btn');
const searchBox = document.getElementById('searchBox');
const clearAllBtn = document.getElementById('clearAllBtn');

// Statistics elements
const totalCount = document.getElementById('totalCount');
const incomeCount = document.getElementById('incomeCount');
const expenseCount = document.getElementById('expenseCount');
const expenseRatio = document.getElementById('expenseRatio');

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    renderTransactions();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    transactionForm.addEventListener('submit', addTransaction);

    // Type button selection
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            typeInput.value = btn.dataset.type;
        });
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTransactions();
        });
    });

    // Search functionality
    searchBox.addEventListener('input', renderTransactions);

    // Clear all transactions
    clearAllBtn.addEventListener('click', clearAllTransactions);
}

// Load transactions from localStorage
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add a new transaction
function addTransaction(e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const type = typeInput.value;

    // Validation
    if (!description || !amount || !category) {
        alert('Please fill in all fields!');
        return;
    }

    if (amount <= 0) {
        alert('Amount must be greater than 0!');
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now(),
        description: description,
        amount: type === 'income' ? amount : -amount,
        category: category,
        type: type,
        date: new Date().toLocaleString()
    };

    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    updateSummary();

    // Reset form
    transactionForm.reset();
    typeButtons[0].classList.add('active');
    typeButtons[1].classList.remove('active');
    typeInput.value = 'income';
    descriptionInput.focus();
}

// Delete a transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactions();
        updateSummary();
    }
}

// Clear all transactions
function clearAllTransactions() {
    if (transactions.length === 0) {
        alert('No transactions to clear!');
        return;
    }

    if (confirm('Are you sure you want to delete all transactions? This cannot be undone!')) {
        transactions = [];
        saveTransactions();
        renderTransactions();
        updateSummary();
    }
}

// Calculate totals
function calculateTotals() {
    const amounts = transactions.map(t => t.amount);
    
    const total = amounts.reduce((acc, item) => acc + item, 0);
    
    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0);
    
    const expense = amounts
        .filter(item => item < 0)
        .reduce((acc, item) => acc + item, 0);

    return { total, income, expense };
}

// Update summary section
function updateSummary() {
    const { total, income, expense } = calculateTotals();

    totalBalance.textContent = formatCurrency(total);
    totalIncome.textContent = formatCurrency(income);
    totalExpense.textContent = formatCurrency(Math.abs(expense));

    // Update statistics
    const numIncome = transactions.filter(t => t.type === 'income').length;
    const numExpense = transactions.filter(t => t.type === 'expense').length;
    const expensePercentage = income > 0 ? Math.round((Math.abs(expense) / income) * 100) : 0;

    totalCount.textContent = transactions.length;
    incomeCount.textContent = numIncome;
    expenseCount.textContent = numExpense;
    expenseRatio.textContent = expensePercentage + '%';

    // Update balance colors
    if (total >= 0) {
        totalBalance.style.color = '#10b981';
    } else {
        totalBalance.style.color = '#ef4444';
    }
}

// Render transactions
function renderTransactions() {
    const searchTerm = searchBox.value.toLowerCase();
    
    let filteredTransactions = transactions.filter(t => {
        // Filter by type (all, income, expense)
        if (currentFilter !== 'all' && t.type !== currentFilter) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm && !t.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => b.id - a.id);

    transactionsList.innerHTML = '';

    if (filteredTransactions.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<i class="fas fa-inbox"></i><p>No transactions found.</p>';
        transactionsList.appendChild(emptyState);
        return;
    }

    filteredTransactions.forEach(transaction => {
        const transactionItem = createTransactionElement(transaction);
        transactionsList.appendChild(transactionItem);
    });

    updateSummary();
}

// Create transaction element
function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = `transaction-item ${transaction.type}`;

    const icon = transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up';
    const categoryIcon = getCategoryIcon(transaction.category);

    div.innerHTML = `
        <div class="transaction-info">
            <div class="transaction-icon">
                <i class="fas ${categoryIcon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${escapeHtml(transaction.description)}</div>
                <div class="transaction-category">${transaction.category}</div>
                <div class="transaction-date">${transaction.date}</div>
            </div>
        </div>
        <div class="transaction-amount">
            ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
        </div>
        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">
            <i class="fas fa-trash"></i> Delete
        </button>
    `;

    return div;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        // Income
        'salary': 'fa-briefcase',
        'freelance': 'fa-laptop',
        'investment': 'fa-chart-line',
        'bonus': 'fa-gift',
        'other-income': 'fa-plus-circle',
        
        // Expenses
        'groceries': 'fa-shopping-cart',
        'utilities': 'fa-lightbulb',
        'rent': 'fa-home',
        'entertainment': 'fa-film',
        'transportation': 'fa-car',
        'healthcare': 'fa-hospital',
        'dining': 'fa-utensils',
        'shopping': 'fa-shopping-bag',
        'education': 'fa-book',
        'other-expense': 'fa-minus-circle'
    };
    return icons[category] || 'fa-circle';
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
