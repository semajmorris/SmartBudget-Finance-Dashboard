const openBtn = document.getElementById("openFormBtn");
const closeBtn = document.getElementById("closeFormBtn");
const modal = document.getElementById("transactionModal");
const form = document.getElementById("transactionForm");

const table = document.getElementById("transactionTable");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");
const savingsEl = document.getElementById("savings");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let spendingChart;

openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
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

function deleteTransaction(index) {
    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateDashboard();
}

updateDashboard();