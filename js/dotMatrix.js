class DotMatrix {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 395,
      margin: _config.margin || { top: 35, right: 20, bottom: 75, left: 50},
      tooltipPadding: _config.tooltipPadding || 15
    }

    this.highlightedData = [];
    this.clickedDot = [];
    this.data = _data;

    this.initVis();
  }

  initVis() {
    let vis = this;
    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight)
      .attr('id', 'dot-matrix-chart')
      .attr("class", "chart");


    // append the title of the view
    vis.svg.append("text")
      .attr('class', 'title')
      .attr('x', vis.width + 10)
      .attr('y', vis.config.margin.top - 27)
      .attr('dy', '.71em')
      .attr("text-anchor", "end")
      .text("Meet the Participants");

    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.footnote = vis.chart
      .append("text")
      .attr("transform", `translate(-5,${vis.height + 60})`)
      .attr("class", "subtitle")
      .attr("font-size", "11px")
      .text(
        "*Categories not shown in the map are not represented by the current age group"
      );

    vis.legend = vis.chart
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.height - 30})`
      );

    // Append group used to clear selection on click
    vis.clearSelectionG = vis.chart.append('g')
      .append('rect')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight)
        .attr("transform", `translate(${-vis.config.margin.left},${-vis.config.margin.top})`)
        .attr('opacity', 0)
      .on('click', function(event, d) {
        clearAllInteractions();
      });

    // name the race categories
    vis.raceCategories = ["Black & Other", "Black & Asian", "Native American & Asian", "Asian & White", "Same Race",
    "Black & Native American", "Asian & Other", "White & Black", "White & Other", "Native American & Other", "Native American & White"];

    vis.colorScale = d3.scaleOrdinal()
      .range(d3.schemeCategory10.concat(['#8b0a50'])) // options: #698b69, #5218fa, #b03060
      .domain(vis.raceCategories);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    vis.subjectRace = (d) => d.w6_subject_race;
    vis.partnerRace = (d) => d.w6_q6b;
    vis.preprocessData();
    vis.assignRelationshipRace();

    vis.groupedByRace = d3.group(vis.data, d => d.relRaceCat);

    vis.colorValue = (d) => d.relRaceCat;

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.x = -5;
    vis.y = -5;
    vis.xcount = -1;
    vis.ycount = -1;

    vis.dotRadius = 4;

    let raceGroups = vis.chart
      .selectAll(".race-group")
      .data(vis.groupedByRace)
      .join("g")
      .attr("class", "race-group");

    let dots = raceGroups
      .selectAll(".matrix-dot")
      .data((d) => d[1])
      .join("circle")
        .attr("class", "matrix-dot")
        .attr("r", vis.dotRadius)
        .attr("cy", function () {
          vis.ycount += 1;
          return vis.ycount % 112 == 0 ? vis.y += vis.dotRadius * 2 : vis.y;
        })
        .attr("cx", function () {
          vis.xcount += 1;
          return vis.xcount % 112 == 0 ? vis.x = 0 : vis.x += vis.dotRadius * 2;
        })
        .attr("fill", d => vis.colorScale(vis.colorValue(d)))
        .classed("clicked", d => vis.clickedDot.length !== 0 && vis.clickedDot.includes(d))
        .classed("inactive", d => vis.highlightedData.length !== 0 && !vis.highlightedData.includes(d))
        .on('mouseover', function (event, d) {
          vis.toolTipInfo(event, d);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        })
        .on('click', (event, d) => {
          clearAllInteractions();
          vis.clickedDot.push(d);
          vis.renderVis();
          filterBarChartData(d);
          selectHeatMapCell(d);
          TreeMapfilterDotMatrixChartData(d);
        });

    vis.yLegendCount = -1;
    vis.xLegendCount = -1;
    vis.yLegend = 0;
    vis.xLegend = 0;

    vis.legend
      .selectAll(".dot-matrix-legend-circles")
      .data(vis.raceCategories)
      .join("circle")
        .attr('class', 'dot-matrix-legend-circles')
        .attr("r", 6)
        .attr("cy", function () {
          vis.yLegendCount += 1;
          return vis.yLegendCount % 5 == 0 ? vis.yLegend += vis.dotRadius * 5 : vis.yLegend;
        })
        .attr("cx", function () {
          vis.xLegendCount += 1;
          return vis.xLegendCount % 5 == 0 ? vis.xLegend = 0 : vis.xLegend += 165;
        })
        .style("fill", d => vis.colorScale(d));

    vis.yLegendCount = -1;
    vis.xLegendCount = -1;
    vis.yLegend = 4;
    vis.xLegend = 10;

    vis.legend.selectAll(".legendText")
        .data(vis.raceCategories)
      .join('text')
        .attr('class', "legendText legend-text")
        .attr("x", function () {
          vis.xLegendCount += 1;
          return vis.xLegendCount % 5 == 0 ? vis.xLegend = 10 : vis.xLegend += 165;
        })
        .attr("y", function () {
          vis.yLegendCount += 1;
          return vis.yLegendCount % 5 == 0 ? vis.yLegend += vis.dotRadius * 5 : vis.yLegend;
        })
        .style("font-size", vis.dotRadius * 3 + "px")
        .text(d => d);
  }


  assignRelationshipRace() {
    let vis = this;

    vis.data.forEach(d => {
      if (vis.subjectRace(d) == "White" && vis.partnerRace(d) == "Black or African American" ||
        vis.partnerRace(d) == "White" && vis.subjectRace(d) == "Black or African American") {
          d.relRaceCat = "White & Black";
      } else if (vis.subjectRace(d) == "Black or African American" && vis.partnerRace(d) == "American Indian, Aleut, or Eskimo" ||
        vis.partnerRace(d) == "Black or African American" && vis.subjectRace(d) == "American Indian, Aleut, or Eskimo") {
          d.relRaceCat = "Black & Native American";
      } else if (vis.subjectRace(d) == "American Indian, Aleut, or Eskimo" && vis.partnerRace(d) == "Asian or Pacific Islander" ||
        vis.partnerRace(d) == "American Indian, Aleut, or Eskimo" && vis.subjectRace(d) == "Asian or Pacific Islander") {
          d.relRaceCat = "Native American & Asian";
      } else if (vis.subjectRace(d) == "Asian or Pacific Islander" && vis.partnerRace(d) == "Other (please specify)" ||
        vis.partnerRace(d) == "Asian or Pacific Islander" && vis.subjectRace(d) == "Other (please specify)") {
          d.relRaceCat = "Asian & Other";
      } else if (vis.subjectRace(d) == "White" && vis.partnerRace(d) == "Other (please specify)" ||
        vis.partnerRace(d) == "White" && vis.subjectRace(d) == "Other (please specify)") {
          d.relRaceCat = "White & Other";
      } else if (vis.subjectRace(d) == "Black or African American" && vis.partnerRace(d) == "Asian or Pacific Islander" ||
        vis.partnerRace(d) == "Black or African American" && vis.subjectRace(d) == "Asian or Pacific Islander") {
          d.relRaceCat = "Black & Asian";
      } else if (vis.subjectRace(d) == "Black or African American" && vis.partnerRace(d) == "Other (please specify)" ||
        vis.partnerRace(d) == "Black or African American" && vis.subjectRace(d) == "Other (please specify)") {
          d.relRaceCat = "Black & Other";
      } else if (vis.subjectRace(d) == "American Indian, Aleut, or Eskimo" && vis.partnerRace(d) == "Other (please specify)" ||
        vis.partnerRace(d) == "American Indian, Aleut, or Eskimo" && vis.subjectRace(d) == "Other (please specify)") {
          d.relRaceCat = "Native American & Other";
      } else if (vis.subjectRace(d) == "Asian or Pacific Islander" && vis.partnerRace(d) == "White" ||
      vis.partnerRace(d) == "Asian or Pacific Islander" && vis.subjectRace(d) == "White") {
        d.relRaceCat = "Asian & White";
      }else if (vis.subjectRace(d) == "American Indian, Aleut, or Eskimo" && vis.partnerRace(d) == "White" ||
        vis.partnerRace(d) == "American Indian, Aleut, or Eskimo" && vis.subjectRace(d) == "White") {
          d.relRaceCat = "Native American & White";
      } else {
        d.relRaceCat = "Same Race";
      }
    });
}


  /**
   *  displays the tooltip information when you hover over the dots.
   */
  toolTipInfo(event, d) {
    let vis = this;

    let particpantAge = d.ppage;

    let howTheyMet = d => {
      let whereTheyMet = getHowTheyMet(d);
      if(whereTheyMet == "") {
        return `N/A`;
      } else {
        return whereTheyMet;
      }
    };
    
    // fill with Guramrit's function return value;
    // check if the sexfreq and religiuosity is refused or "" and replace with missing
    let fillSexFreq = d => {
      if(sexFrequency(d) == "Refused" || sexFrequency(d) == "") {
        return `N/A`;
      } else {
        return sexFrequency(d);
      }
    };

    let fillReligiousity = d => {
      if(religiousity(d) == "Refused" || religiousity(d) == "") {
        return `N/A`;
      } else {
        return religiousity(d);
      }
    };

    let fillRelationshipRanking = d => {
      if(relationshipRanking(d) == "Refused" || relationshipRanking(d) == "") {
        return `N/A`;
      } else {
        return relationshipRanking(d);
      }
    };

    d3.select('#tooltip')
      .style('display', 'block')
      .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
      .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
      .html(`
          <div><b>Age</b>: ${particpantAge}</div>
          <div><b>Race:</b> ${vis.subjectRace(d)}</div>
          <div><b>Partner's Race:</b> ${vis.partnerRace(d)}</div> 
          <div><b>How they met:</b> ${howTheyMet(d)}</div> 
          <div><b>Relationship Quality:</b> ${fillRelationshipRanking(d)}</div> 
          <div><b>Sex Frequency:</b> ${fillSexFreq(d)}</div> 
          <div><b>Religious Service Attendance:</b> ${fillReligiousity(d)}</div> 
        `);
  }

  /**
   * Filters the data for people who left the answer blank (or refused to answer) for their race or their partner's race
   */
  preprocessData() {
    let vis = this;
    let tempData = vis.data;
    vis.data = tempData.filter(d => (
      vis.subjectRace(d) != "" &&
      vis.subjectRace(d) != "Refused" &&
      vis.partnerRace(d) != "" &&
      vis.partnerRace(d) != "Refused"
    ));
  }
}
