const openBtn = document.getElementById("openFormBtn");
const closeBtn = document.getElementById("closeFormBtn");
const modal = document.getElementById("transactionModal");
const form = document.getElementById("transactionForm");

const table = document.getElementById("transactionTable");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const savingsEl = document.getElementById("savings");
const alertMessage = document.getElementById("alertMessage");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let goals = JSON.parse(localStorage.getItem("goals")) || [];
let spendingChart;

const budgets = {
    Food: 500,
    Transportation: 300,
    Entertainment: 200
};

openBtn.onclick = () => {
    modal.style.display = "flex";
};

closeBtn.onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const transaction = {
        name: document.getElementById("transactionName").value,
        category: document.getElementById("transactionCategory").value,
        type: document.getElementById("transactionType").value,
        amount: Number(document.getElementById("transactionAmount").value),
        date: new Date().toLocaleDateString()
    };

    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    form.reset();
    modal.style.display = "none";

    updateDashboard();
});

function updateDashboard() {
    table.innerHTML = "";

    let income = 0;
    let expenses = 0;
    let categoryTotals = {};

    transactions.forEach((transaction, index) => {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;

            categoryTotals[transaction.category] =
                (categoryTotals[transaction.category] || 0) + transaction.amount;
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${transaction.name}</td>
            <td>${transaction.category}</td>
            <td>${transaction.date}</td>
            <td class="${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"}$${transaction.amount.toFixed(2)}
            </td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction(${index})">
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });

    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    balanceEl.textContent = `$${balance.toFixed(2)}`;
    incomeEl.textContent = `$${income.toFixed(2)}`;
    expensesEl.textContent = `$${expenses.toFixed(2)}`;
    savingsEl.textContent = `${savingsRate}%`;

    updateChart(categoryTotals);
    updateBudgetProgress(categoryTotals);
    updateAlerts(income, expenses, categoryTotals);
    renderGoals();
}

function updateChart(categoryTotals) {
    const ctx = document.getElementById("spendingChart");

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels.length ? labels : ["No expenses yet"],
            datasets: [{
                data: data.length ? data : [1],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }
            }
        }
    });
}

function updateBudgetProgress(categoryTotals) {
    const foodSpent = categoryTotals.Food || 0;
    const transportationSpent = categoryTotals.Transportation || 0;
    const entertainmentSpent = categoryTotals.Entertainment || 0;

    updateSingleBudget("food", foodSpent, budgets.Food);
    updateSingleBudget("transportation", transportationSpent, budgets.Transportation);
    updateSingleBudget("entertainment", entertainmentSpent, budgets.Entertainment);
}

function updateSingleBudget(category, spent, limit) {
    const percent = Math.min((spent / limit) * 100, 100);

    const text = document.getElementById(`${category}Text`);
    const bar = document.getElementById(`${category}Bar`);

    text.textContent = `$${spent.toFixed(2)} / $${limit}`;
    bar.style.width = `${percent}%`;

    if (percent >= 90) {
        bar.style.background = "#ff5a5a";
    } else if (percent >= 70) {
        bar.style.background = "#ffd166";
    } else {
        bar.style.background = "linear-gradient(90deg, #8aff80, #38d86a)";
    }
}

function updateAlerts(income, expenses, categoryTotals) {
    let alerts = [];

    if (income === 0 && expenses === 0) {
        alertMessage.textContent = "No alerts yet. Your budget is looking good.";
        return;
    }

    if (expenses > income) {
        alerts.push("Warning: Your expenses are higher than your income.");
    }

    Object.keys(budgets).forEach((category) => {
        const spent = categoryTotals[category] || 0;
        const limit = budgets[category];
        const percent = (spent / limit) * 100;

        if (percent >= 100) {
            alerts.push(`${category} budget has reached or passed its limit.`);
        } else if (percent >= 80) {
            alerts.push(`${category} budget is getting close to the limit.`);
        }
    });

    if (alerts.length === 0) {
        alertMessage.textContent = "No alerts yet. Your budget is looking good.";
    } else {
        alertMessage.textContent = alerts.join(" ");
    }
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

    const goal = {
        name,
        target,
        saved
    };

    goals.push(goal);
    localStorage.setItem("goals", JSON.stringify(goals));

    document.getElementById("goalName").value = "";
    document.getElementById("goalTarget").value = "";
    document.getElementById("goalSaved").value = "";

    renderGoals();
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

            <button class="delete-btn" onclick="deleteGoal(${index})">
                Delete Goal
            </button>
        `;

        goalsList.appendChild(goalCard);
    });
}

function deleteGoal(index) {
    goals.splice(index, 1);
    localStorage.setItem("goals", JSON.stringify(goals));
    renderGoals();
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateDashboard();
}

updateDashboard();