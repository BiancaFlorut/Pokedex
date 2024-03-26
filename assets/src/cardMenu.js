const menuItems = [
  { menuItem: "aboutMenuItem", menuContent: "about" },
  { menuItem: "baseStatsMenuItem", menuContent: "baseStats" },
  { menuItem: "evolutionMenuItem", menuContent: "evolution" },
  { menuItem: "movesMenuItem", menuContent: "moves" },
];

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
