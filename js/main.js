let varForFilteringcirclesChart = "";
let currcirclesChartMainCategory = ""; // the relationship ranking
let currcirclesChartSubCategory = ""; // whether the person is part of an interracial couple
let getHowTheyMet = d => getMeetingMethod(d);
let relationshipRanking = (d) => d.Q34;
let whetherInterracialOrSameRace = (d) => d.interracial_5cat;
let subjectRace = (d) => d.w6_subject_race;
let partnerRace = (d) => d.w6_q6b;
let sexFrequency = (d) => d.w6_sex_frequency;
let religiousity = (d) => d.ppp20072;

const MEETING_METHODS = {
  0: "Education",
  1: "Professional Setting",
  2: "Social Setting",
  3: "Internet Website",
  4: "Online Social Networking",
  5: "Abroad",
  6: "Mutual Connection",
};

const MEETING_METHODS_CHECKS_MAPPING = {
  Education: checkEducationMethod,
  "Professional Setting": checkProfessionalSettingMethod,
  "Social Setting": checkSocialSettingMethod,
  "Internet Website": checkInternetSiteMethod,
  "Online Social Networking": checkOnlineSocialNetworkingMethod,
  Abroad: checkAbroadMethod,
  "Mutual Connection": checkMutualConnectionMethod,
};

/**
 * Load data from CSV file asynchronously and render charts
 */
let treeMap, barChart, dotmatrix, heatMap, data;
d3.csv("data/dating.csv").then((_data) => {
  data = _data;

  // Global data processing
  data.forEach((d) => {
    if (subjectRace(d) === partnerRace(d)) {
      d.interracial_5cat = "no";
    } else {
      d.interracial_5cat = "yes";
    }
  });

  // initialize visualizations
  dotmatrix = new DotMatrix({
      parentElement: "#dot-matrix",
    }, data);

  treeMap = new TreeMap({
      parentElement: "#tree-map",
    }, 
    data,
    {
      checkEducationMethod,
      checkProfessionalSettingMethod,
      checkSocialSettingMethod,
      checkInternetSiteMethod,
      checkOnlineSocialNetworkingMethod,
      checkAbroadMethod,
      checkMutualConnectionMethod,
    });

  barChart = new BarChart({
      parentElement: "#bar-chart-plot",
    }, data);

  heatMap = new HeatMap({
      parentElement: "#heat-map",
    }, data);
});

// https://stackoverflow.com/questions/24193593/d3-how-to-change-dataset-based-on-drop-down-box-selection
// event listeners for the dropdown

// the flag ensures that we don't re-filter the data if we don't need to
// default value is "all"
let currSelection = "all";
d3.selectAll("#age-group-filter-dropdown").on("change", function (e) {
  // Filter data accordingly and update vis

  if (currSelection !== e.target.value) {
    currSelection = e.target.value;
    performAgeFiltering(currSelection);

    dotmatrix.highlightedData = [];
    dotmatrix.clickedDot = [];
    heatMap.selectedCategories = [];
    treeMap.selectedMethod = "";
    barChart.highlightedData = [];
    barChart.clickedBar = [];

    treeMap.updateVis();
    heatMap.updateVis();
    dotmatrix.updateVis();
    barChart.updateVis();
  }
});

// https://dev.to/ananyaneogi/create-a-dark-light-mode-switch-with-css-variables-34l8
// https://www.javascripttutorial.net/javascript-dom/javascript-radio-button/
// viewing mode toggle listener
d3.selectAll('input[name="btnradio"]').on("change", function (e) {
  let btns = document.getElementsByClassName('btn');
  if(e.target.id === "light-btn") {
    document.documentElement.setAttribute('theme', 'light');
    for(let i = 0; i < btns.length; i++) {
      btns[i].classList.replace('btn-outline-light', 'btn-outline-dark');
    }
    document.getElementById('sun').setAttribute('fill', 'orange');
    document.getElementById('moon').setAttribute('fill', 'black');
  } else if (e.target.id === "dark-btn") {
    document.documentElement.setAttribute('theme', 'dark');
    for(let i = 0; i < btns.length; i++) {
      btns[i].classList.replace('btn-outline-dark', 'btn-outline-light');
    }
    document.getElementById('sun').setAttribute('fill', 'white');
    document.getElementById('moon').setAttribute('fill', 'orange');
  }
});

d3.selectAll("#remove-filtering").on("click", (e) => {
  clearAllInteractions();
});

function clearAllInteractions() {
  heatMap.selectedCategories = [];
  treeMap.selectedMethod = "";
  dotmatrix.highlightedData = [];
  dotmatrix.clickedDot = [];
  barChart.highlightedData = [];
  barChart.clickedBar = [];

  heatMap.renderVis();
  barChart.updateVis();
  dotmatrix.updateVis();
  treeMap.updateVis();
}

function performAgeFiltering(currSelection) {
  if (currSelection == "all") {
    // get rid of all filtering
    treeMap.data = data;
    dotmatrix.data = data;
    heatMap.data = data;
    barChart.data = data;
  } else {
    let ageData = data.filter((d) => d.ppagecat === currSelection);
    treeMap.data = ageData;
    heatMap.data = ageData;
    dotmatrix.data = ageData;
    barChart.data = ageData;
  }
}

/**
 * FUNCTIONS CALLED WHEN A DOT IS CLICKED
 */

function TreeMapfilterDotMatrixChartData(dotClicked) {
  let meetingMethod = getMeetingMethod(dotClicked);
  if (meetingMethod !== "") {
    treeMap.selectedMethod = meetingMethod;
    treeMap.updateVis();
  }
}

/**
 * highlights a bar that corresponds to the dot (if available) when a button is clicked
 * @param dotClicked is the dot that was clicked.
 */
function filterBarChartData(dotClicked) {
  barChart.highlightedData = [
    relationshipRanking(dotClicked),
    whetherInterracialOrSameRace(dotClicked),
  ];
  barChart.updateVis();
}

/**
 * highlights a cell that corresponds to the dot's sex and religion habits (if available) when dot is clicked
 * @param dotClicked is the dot that was clicked.
 */
function selectHeatMapCell(dotClicked) {
  heatMap.selectedCategories = [
    dotClicked.ppp20072,
    dotClicked.w6_sex_frequency,
  ];
  heatMap.renderVis();
}

/**
 * FUNCTIONS TO SELECT THE CORRESPONDING DOTS WHEN ANOTHER VIEW IS CLICKED
 *
 */

/* filter the data rendered in the dot matrix according to:
 * @param mainCategory the relationship ranking
 * @param subCategory bar clidked (interracial or same race)
 */
function filterDotMatrixChartData() {
  let filteredData = dotmatrix.data.filter(
    (d) =>
      relationshipRanking(d) == currcirclesChartMainCategory &&
      whetherInterracialOrSameRace(d) == currcirclesChartSubCategory
  );
  dotmatrix.highlightedData = filteredData;
  dotmatrix.updateVis();
}

/**
 * filter the data rendered in the dot matrix chart according to:
 * @param sexFreq the y-value of the cell in the heat map
 * @param attendance the x-value of the cell in the heat map
 */
function heatMapfilterDotMatrixChartData(sexFreq, attendance) {
  clearAllInteractions();;
  dotmatrix.highlightedData = dotmatrix.data.filter(
    (d) => sexFrequency(d) == sexFreq && religiousity(d) == attendance
  );
  dotmatrix.updateVis();
}

/**
 * Use treemap as filter and update dotMatrix accordingly
 */
function filterWithMeetingData(meetingCategory) {
  clearAllInteractions();
  dotmatrix.highlightedData = dotmatrix.data.filter((d) => {
    return MEETING_METHODS_CHECKS_MAPPING[meetingCategory](d);
  });
  dotmatrix.updateVis();
}

/**
 * filter the data rendered in the dot matrix chart according to:
 * mainCategory the relationship ranking
 * subCategory bar clidked (interracial or same race)
 */
function barChartFilterDotMatrixChartData() {
  clearAllInteractions();
  dotmatrix.highlightedData = dotmatrix.data.filter(
    (d) =>
      relationshipRanking(d) == currcirclesChartMainCategory &&
      whetherInterracialOrSameRace(d) == currcirclesChartSubCategory
  );
  dotmatrix.updateVis();
}
