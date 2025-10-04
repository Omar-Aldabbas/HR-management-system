import { safeFetch } from "./helper/safeFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const res = await safeFetch("analytics.php", "getCompanyAnalytics");
  if (!res.success) return;

  const { attendance = [], employees = [], tasks = [], leaves = [], productivity = [], gender = [], hires = [] } = res;

  const createChart = (id, config) => {
    const el = document.getElementById(id);
    if (el) new Chart(el, config);
  };

  const bar = (id, labels, data, color = "#2563eb") =>
    createChart(id, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: color, borderRadius: 6 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

  const doughnut = (id, labels, data) =>
    createChart(id, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              "#2563eb",
              "#16a34a",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
              "#f472b6",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "right" } },
      },
    });

  const line = (id, labels, data, color = "#7c3aed") =>
    createChart(id, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: color,
            backgroundColor: color + "33",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

  if (attendance.length)
    bar(
      "attendanceChart",
      attendance.map((a) => a.department),
      attendance.map((a) => a.present)
    );

  if (employees.length)
    bar(
      "employeeChart",
      employees.map((e) => e.department),
      employees.map((e) => e.total)
    );

  if (tasks.length)
    doughnut(
      "taskChart",
      tasks.map((t) => t.status),
      tasks.map((t) => t.total)
    );

  if (leaves.length)
    doughnut(
      "leaveChart",
      leaves.map((l) => l.leave_type),
      leaves.map((l) => l.total)
    );

  if (productivity.length)
    bar(
      "productivityChart",
      productivity.map((p) => p.department),
      productivity.map((p) => p.completion_rate)
    );

  if (gender.length)
    doughnut(
      "genderChart",
      gender.map((g) => g.gender),
      gender.map((g) => g.total)
    );

  if (hires.length)
    line(
      "hiresChart",
      hires.map((h) => h.month),
      hires.map((h) => h.hires)
    );

  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.addEventListener("click", () => history.back());
});
