import { safeFetch } from "./helper/safeFetch.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loading = document.getElementById("loading");
  const container = document.getElementById("analytics-content");
  const attendanceCanvas = document.getElementById("attendanceChart");
  const tasksCanvas = document.getElementById("tasksChart");
  const leavesCanvas = document.getElementById("leavesChart");
  const performanceCanvas = document.getElementById("performanceChart");

  loading.style.display = "block";
  const res = await safeFetch("analytics.php", "getEmployeeAnalytics");
  loading.style.display = "none";

  if (!res.success) {
    container.innerHTML = `<p class="text-red-500 text-center">${
      res.message || "Failed to load analytics."
    }</p>`;
    return;
  }

  const attendance = res.attendance || [];
  const tasks = res.tasks || [];
  const leaves = res.leaves || [];
  const performance = res.performance || [];

  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#1e293b",
          font: { family: "Inter, sans-serif", size: 13 },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#334155",
          font: { family: "Inter, sans-serif", size: 12 },
        },
        grid: { color: "#e2e8f0" },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#334155",
          font: { family: "Inter, sans-serif", size: 12 },
        },
        grid: { color: "#e2e8f0" },
      },
    },
  };

  function barChart(canvas, labels, datasets) {
    if (!canvas) return;
    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: { labels, datasets },
      options: {
        ...chartConfig,
        plugins: { ...chartConfig.plugins, legend: { position: "bottom" } },
      },
    });
  }

  function doughnutChart(canvas, labels, data) {
    if (!canvas) return;
    new Chart(canvas.getContext("2d"), {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            borderWidth: 2,
            borderColor: "#fff",
            backgroundColor: [
              "#2563eb",
              "#16a34a",
              "#f59e0b",
              "#ef4444",
              "#7c3aed",
              "#0ea5e9",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#1e293b",
              font: { family: "Inter, sans-serif", size: 13 },
              usePointStyle: true,
              padding: 15,
            },
          },
        },
      },
    });
  }

  function lineChart(canvas, labels, data) {
    if (!canvas) return;
    new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data,
            borderColor: "#7c3aed",
            backgroundColor: "#7c3aed33",
            fill: true,
            borderWidth: 3,
            pointRadius: 4,
            tension: 0.4,
          },
        ],
      },
      options: {
        ...chartConfig,
        plugins: { legend: { display: false } },
        elements: { line: { borderJoinStyle: "round" } },
      },
    });
  }

  if (attendance.length) {
    const labels = attendance.map((r) => r.month);
    const present = attendance.map((r) => parseInt(r.present || 0));
    const total = attendance.map((r) => parseInt(r.total || 0));
    barChart(attendanceCanvas, labels, [
      {
        label: "Present",
        data: present,
        backgroundColor: "#2563eb",
        borderRadius: 6,
      },
      {
        label: "Total",
        data: total,
        backgroundColor: "#7c3aed55",
        borderRadius: 6,
      },
    ]);
  }

  if (tasks.length) {
    const labels = tasks.map((r) => r.status);
    const values = tasks.map((r) => parseInt(r.total || 0));
    doughnutChart(tasksCanvas, labels, values);
  }

  if (leaves.length) {
    const labels = leaves.map((r) => r.leave_type || "Other");
    const values = leaves.map((r) => parseInt(r.total || 0));
    doughnutChart(leavesCanvas, labels, values);
  }

  if (performance.length) {
    const labels = performance.map((r) => r.month);
    const values = performance.map((r) => parseInt(r.completed || 0));
    lineChart(performanceCanvas, labels, values);
  }
});
