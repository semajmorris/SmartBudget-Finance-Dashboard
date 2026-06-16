const openBtn = document.getElementById("openFormBtn");
const closeBtn = document.getElementById("closeFormBtn");
const modal = document.getElementById("transactionModal");
const form = document.getElementById("transactionForm");

const table = document.getElementById("transactionTable");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const safeToSpendEl = document.getElementById("safeToSpend");
const budgetScoreEl = document.getElementById("budgetScore");
const budgetScoreText = document.getElementById("budgetScoreText");
const alertMessage = document.getElementById("alertMessage");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [
    { name: "Emergency Fund", target: 10000, saved: 0 },
    { name: "Tuition Fund", target: 3000, saved: 0 }
];

let spendingChart;
let flowChart;

const budgets = {
    Food: 500,
    Transportation: 300,
    Entertainment: 200,
    Shopping: 250
};

openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const transaction = {
        name: document.getElementById("transactionName").value,
        type: document.getElementById("transactionType").value,
        category: document.getElementById("transactionCategory").value,
        amount: Number(document.getElementById("transactionAmount").value),
        date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);

    if (transaction.type === "goal") {
        updateGoalSavings(transaction.category, transaction.amount);
    }

    saveData();
    form.reset();
    modal.style.display = "none";
    updateDashboard();
});

function updateDashboard() {
    table.innerHTML = "";

    let income = 0;
    let expenses = 0;
    let goalSavings = 0;
    let categoryTotals = {};

    transactions.forEach((transaction, index) => {
        if (transaction.type === "income") income += transaction.amount;

        if (transaction.type === "expense") {
            expenses += transaction.amount;
            categoryTotals[transaction.category] =
                (categoryTotals[transaction.category] || 0) + transaction.amount;
        }

        if (transaction.type === "goal") goalSavings += transaction.amount;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${transaction.name}</td>
            <td>${formatType(transaction.type)}</td>
            <td>${transaction.category}</td>
            <td>${transaction.date}</td>
            <td class="${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"}$${transaction.amount.toFixed(2)}
            </td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction(${index})">Delete</button>
            </td>
        `;

        table.appendChild(row);
    });

    const balance = income - expenses - goalSavings;
    const safeToSpend = Math.max(balance, 0);

    balanceEl.textContent = `$${balance.toFixed(2)}`;
    incomeEl.textContent = `$${income.toFixed(2)}`;
    expensesEl.textContent = `$${expenses.toFixed(2)}`;
    safeToSpendEl.textContent = `$${safeToSpend.toFixed(2)}`;

    updateBudgetScore(income, expenses, goalSavings, safeToSpend);
    updateBudgetProgress(categoryTotals);
    updateCharts(categoryTotals, income, expenses, goalSavings);
    updateAlerts(income, expenses, goalSavings, categoryTotals);
    renderGoals();
}

function formatType(type) {
    if (type === "income") return "Income";
    if (type === "expense") return "Expense";
    if (type === "goal") return "Goal Savings";
}

function updateBudgetScore(income, expenses, goalSavings, safeToSpend) {
    let score = 100;

    if (income === 0) {
        score = 100;
    } else {
        const expenseRatio = expenses / income;

        if (expenseRatio > 1) score -= 40;
        else if (expenseRatio > 0.8) score -= 25;
        else if (expenseRatio > 0.6) score -= 15;

        if (goalSavings < income * 0.05) score -= 10;
        if (safeToSpend < income * 0.1) score -= 20;
    }

    score = Math.max(score, 0);

    budgetScoreEl.textContent = `${score}/100`;

    if (score >= 85) budgetScoreText.textContent = "Excellent money flow";
    else if (score >= 70) budgetScoreText.textContent = "Healthy budget";
    else if (score >= 50) budgetScoreText.textContent = "Needs attention";
    else budgetScoreText.textContent = "High risk of overspending";
}

function updateBudgetProgress(categoryTotals) {
    updateSingleBudget("food", categoryTotals.Food || 0, budgets.Food);
    updateSingleBudget("transportation", categoryTotals.Transportation || 0, budgets.Transportation);
    updateSingleBudget("entertainment", categoryTotals.Entertainment || 0, budgets.Entertainment);
    updateSingleBudget("shopping", categoryTotals.Shopping || 0, budgets.Shopping);
}

function updateSingleBudget(category, spent, limit) {
    const percent = Math.min((spent / limit) * 100, 100);

    document.getElementById(`${category}Text`).textContent =
        `$${spent.toFixed(2)} / $${limit}`;

    const bar = document.getElementById(`${category}Bar`);
    bar.style.width = `${percent}%`;

    if (percent >= 90) bar.style.background = "#ff5c7a";
    else if (percent >= 70) bar.style.background = "#ffd166";
    else bar.style.background = "linear-gradient(90deg, #8aff80, #4dd4ff)";
}

function updateCharts(categoryTotals, income, expenses, goalSavings) {
    updateSpendingChart(categoryTotals);
    updateFlowChart(income, expenses, goalSavings);
}

function updateSpendingChart(categoryTotals) {
    const ctx = document.getElementById("spendingChart");
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (spendingChart) spendingChart.destroy();

    spendingChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels.length ? labels : ["No expenses yet"],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ["#8aff80", "#4dd4ff", "#ff5c7a", "#ffd166", "#b388ff"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            }
        }
    });
}

function updateFlowChart(income, expenses, goalSavings) {
    const ctx = document.getElementById("flowChart");
    const safeToSpend = Math.max(income - expenses - goalSavings, 0);

    if (flowChart) flowChart.destroy();

    flowChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Income", "Expenses", "Goals", "Safe to Spend"],
            datasets: [{
                label: "Budget Flow",
                data: [income, expenses, goalSavings, safeToSpend],
                backgroundColor: ["#8aff80", "#ff5c7a", "#4dd4ff", "#ffd166"],
                borderRadius: 12
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,.08)" }
                },
                y: {
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,.08)" }
                }
            }
        }
    });
}

function updateAlerts(income, expenses, goalSavings, categoryTotals) {
    let alerts = [];

    if (income === 0 && expenses === 0 && goalSavings === 0) {
        alertMessage.textContent = "No alerts yet. Your budget is looking good.";
        return;
    }

    if (expenses > income) alerts.push("Your expenses are higher than your income.");

    if (goalSavings > income * 0.5 && income > 0) {
        alerts.push("You are saving a lot toward goals. Make sure you still have enough for essentials.");
    }

    Object.keys(budgets).forEach((category) => {
        const spent = categoryTotals[category] || 0;
        const limit = budgets[category];
        const percent = (spent / limit) * 100;

        if (percent >= 100) alerts.push(`${category} budget reached the limit.`);
        else if (percent >= 80) alerts.push(`${category} budget is close to the limit.`);
    });

    alertMessage.textContent = alerts.length
        ? alerts.join(" ")
        : "No alerts yet. Your budget is looking good.";
}

function calculateAllowance() {
    const income = Number(document.getElementById("allowanceIncome").value);
    const bills = Number(document.getElementById("allowanceBills").value);
    const savings = Number(document.getElementById("allowanceSavings").value);

    const allowance = income - bills - savings;

    document.getElementById("allowanceResult").textContent =
        `$${allowance.toFixed(2)}`;
}

function addGoal() {
    const name = document.getElementById("goalName").value;
    const target = Number(document.getElementById("goalTarget").value);
    const saved = Number(document.getElementById("goalSaved").value);

    if (!name || target <= 0) {
        alert("Please enter a goal name and valid target amount.");
        return;
    }

    goals.push({ name, target, saved });
    saveData();

    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalSaved").value = "";

    updateDashboard();
}

function updateGoalSavings(goalName, amount) {
    let goal = goals.find(g => g.name === goalName);

    if (goal) {
        goal.saved += amount;
    } else {
        goals.push({
            name: goalName,
            target: 1000,
            saved: amount
        });
    }
}

function renderGoals() {
    const goalsList = document.getElementById("goalsList");
    goalsList.innerHTML = "";

    goals.forEach((goal, index) => {
        const percent = Math.min((goal.saved / goal.target) * 100, 100);

        const goalCard = document.createElement("div");
        goalCard.classList.add("goal-card");

        goalCard.innerHTML = `
            <h4>${goal.name}</h4>
            <p>$${goal.saved.toFixed(2)} of $${goal.target.toFixed(2)} saved</p>
            <p class="goal-progress-text">${percent.toFixed(0)}% complete</p>

            <div class="bar">
                <div style="width:${percent}%"></div>
            </div>

            <br>

            <input type="number" id="goalUpdate${index}" placeholder="Add more to this goal">

            <button onclick="addToGoal(${index})">Update Goal</button>
            <button class="delete-btn" onclick="deleteGoal(${index})">Delete Goal</button>
        `;

        goalsList.appendChild(goalCard);
    });
}

function addToGoal(index) {
    const input = document.getElementById(`goalUpdate${index}`);
    const amount = Number(input.value);

    if (amount <= 0) {
        alert("Enter an amount to add.");
        return;
    }

    goals[index].saved += amount;

    transactions.push({
        name: goals[index].name,
        type: "goal",
        category: goals[index].name,
        amount: amount,
        date: new Date().toLocaleDateString()
    });

    saveData();
    updateDashboard();
}

function deleteGoal(index) {
    goals.splice(index, 1);
    saveData();
    updateDashboard();
}

function deleteTransaction(index) {
    const transaction = transactions[index];

    if (transaction.type === "goal") {
        const goal = goals.find(g => g.name === transaction.category);

        if (goal) {
            goal.saved -= transaction.amount;
            if (goal.saved < 0) goal.saved = 0;
        }
    }

    transactions.splice(index, 1);
    saveData();
    updateDashboard();
}

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("goals", JSON.stringify(goals));
}

updateDashboard();