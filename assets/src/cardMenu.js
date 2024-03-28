const menuItems = [
  { menuItem: "aboutMenuItem", menuContent: "about" },
  { menuItem: "baseStatsMenuItem", menuContent: "baseStats" },
  { menuItem: "evolutionMenuItem", menuContent: "evolution" },
  { menuItem: "movesMenuItem", menuContent: "moves" },
];
let chart;

// eslint-disable-next-line no-unused-vars
function stopPropagation(event) {
  event.stopPropagation();
}

// eslint-disable-next-line no-unused-vars
function toggleMenu(index, event) {
  event.stopPropagation();
  resetMenu();
  document.getElementById(menuItems[index].menuItem).classList.add("active");
  document.getElementById(menuItems[index].menuContent).classList.remove("d_none");
}

function resetMenu() {
  document.getElementById("aboutMenuItem").classList.remove("active");
  document.getElementById("baseStatsMenuItem").classList.remove("active");
  document.getElementById("evolutionMenuItem").classList.remove("active");
  document.getElementById("movesMenuItem").classList.remove("active");

  document.getElementById("about").classList.add("d_none");
  document.getElementById("baseStats").classList.add("d_none");
  document.getElementById("evolution").classList.add("d_none");
  document.getElementById("moves").classList.add("d_none");
}


function showChart(data) {
  const ctx = document.getElementById("myChart");
  const progressBar = {
    id: "progressBar",
    beforeDatasetsDraw(chart, args, pluginOptions) {
      const {
        ctx,
        data,
        chartArea: { top, bottom, left, right, width, height },
        scales: { x, y },
      } = chart;

      ctx.save();
      const barHeight = height / data.labels.length;
      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.fillStyle = "rgba(200, 200, 200, 0.5)";

      chart.getDatasetMeta(0).data.forEach((dataPoint, index) => {
        dataPoint.y = top + barHeight * (index + 0.8);
        //label
        ctx.font = "16px sans-serif bold";
        ctx.fillStyle = "rgba(180, 180, 180, 1)";
        ctx.fillText(data.labels[index], left - 182, dataPoint.y);

        //label
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(80, 80, 80, 1)";
        ctx.textBaseline = "middle";
        ctx.fillText(data.datasets[0].data[index], left - 44, dataPoint.y);

        //shape
        ctx.beginPath();
        ctx.lineWidth = dataPoint.height;
        ctx.lineJoin = "round";
        ctx.strokeRect(left, dataPoint.y, width, 1);
      });
    },
  };
  // eslint-disable-next-line no-undef
  chart = new Chart(ctx, {
    type: "bar",
    data,
    options: {
      layout: {
        padding: { left: 180 },
      },
      indexAxis: "y",
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: { display: false },
        },
      },
    },
    plugins: [progressBar],
  });
}

function destroyChart() {
  if (chart) chart.destroy();
}