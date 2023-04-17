class BarChart {
  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 400,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || {top: 47, right: 10, bottom: 40, left: 50},
      tooltipPadding: _config.tooltipPadding || 15
    }
    
    this.data = _data;
    this.highlightedData = [];
    this.clickedBar = [];

    this.initVis();
  }
  
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // yes = couple is interracial
    vis.subgroupsCategory = ["yes", "no"];

    // intialize the scale 
    vis.xScale = d3.scaleBand()
      .range([0, vis.width])
      .padding(0.60);

    vis.xSubgroupScale = d3.scaleBand()
      .range([0, vis.xScale.bandwidth()/5])
      .domain(vis.subgroupsCategory)
      .paddingInner(.85);

    vis.yScale = d3.scaleLinear()
      .range([vis.height, 0]);   

    // intialize the axis
    vis.xAxis = d3.axisBottom(vis.xScale)
      .tickSize(0)
      .tickSizeOuter(0)
      .tickPadding(8);

    vis.yAxis = d3.axisLeft(vis.yScale)
      .ticks(6)
      .tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty bar-x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart.append('g')
      .attr('class', 'bar-axis bar-x-axis')
      .attr('transform', `translate(0,${vis.height})`);
    
     // Append bar-y-axis group 
    vis.yAxisG = vis.chart.append('g')
      .attr('class', 'bar-axis bar-y-axis');

    // append axis titles
    vis.chart.append('text')
      .attr('class', 'axis-label')
      .attr('y', vis.height - 10)
      .attr('x', vis.width + 10)
      .attr('dy', '3.5em')
      .style('text-anchor', 'end')
      .style('font-size', '13px')
      .text('Quality of Relationship')

    vis.chart

    .append("text")
      .attr("class", "bar-axis-title")
      .attr("x", -vis.height / 4)
      .attr("y", -42)
      .attr("dy", ".71em")
      .attr("transform", "rotate(270)")
      .style("text-anchor", "end")
      .text("Normalized Count %");

    vis.svg.append("text")
        .attr('class', 'title')
        .attr('x', 20)
        .attr('y', vis.config.margin.top - 29)
        .attr('dy', '.71em')
        .attr("text-anchor", "left")
        .text("Relationship Quality by Race");

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
    
    vis.updateVis();
  }


  updateVis() {
    let vis = this;
    vis.noInterracial = "no";
    vis.yesInterracial = "yes";
    vis.sameRaceCoupleColor = "red";
    vis.interracialCoupleColor = "blue";
    
    // filters out data where there was no answer or someone refused to answer
    vis.preprocessData();

    // group data by relationship ranking, 
    // and count number of occurences of each ranking.
    vis.groupedData = d3.rollup(vis.data, v => v.length, d => d.Q34, d => d.interracial_5cat);
    vis.groupedData.delete('');
    vis.groupedData.delete("Refused");
 


    // Add a ranking entry at the same level as the subcategories ("yes"/"no")
    vis.groupedData.forEach((value, key) => {
      value.forEach((innerValue, innerKey) => value.set("ranking", key));
    });

    // counts how many interracial and sameRace couples we have.
    vis.maxInterracialCount = vis.data.filter(d => whetherInterracialOrSameRace(d) == "yes").length;
    vis.maxSameRaceCount = vis.data.filter(d => whetherInterracialOrSameRace(d) == "no").length;

    // Specificy x- and y-value accessor functions
    vis.xValue = d => vis.relationshipRanking(d);
    vis.yValue = d => vis.groupedData.get(vis.relationshipRanking(d));
  
    // set the domain of xScale to be the relationship rankings
    vis.xScale.domain(["Very Poor", "Poor", "Fair", "Good", "Excellent"]);
    vis.yScale.domain ([0,100]);


    vis.renderVis();
  }


  renderVis() {
    let vis = this;
    vis.specificBarClicked = '';

    let barValues = new Map();
    // code for bars and bar inspired from here: https://d3-graph-gallery.com/graph/barplot_grouped_basicWide.html
    const barGroup = vis.chart.selectAll('.bars')
      .data(vis.groupedData, d => {
        if (vis.highlightedData[0] == d[0]) {
          if(vis.highlightedData[1] == "no"){
            barValues.set("name","no");
            barValues.set("nVal", d[1].get("no"));
          } else {
            barValues.set("name","yes");
            barValues.set("nVal", d[1].get("yes"));            
          }
        }
        // After remove the ranking entry so that we don't render bars for it
        d[1].delete('ranking');
        return d[0];
      })
      .join("g")
      .attr('class', 'bars')
      .attr("transform", d => {
        if (vis.highlightedData[0] == d[0]) {
          vis.relationshipRanking = d[0];
        } 
        return `translate( ${vis.xScale(d[0]) -  1.5 * vis.xScale.bandwidth()},0)`
      });

      // checks if the bar is less than 4% of the max number in the y-axis.
      vis.barHeightTooSmall = d => vis.getBarHeightByRace(d[1], d) < 6;
      // Gives the bars a minimum height (of 4% of the max number in the y-axis) so that the smallest bars are still visible.
      vis.addMinBarHeight = 6;

      vis.checkIfActive = d => {
        if (d[0] == barValues.get("name") && d[1] == barValues.get("nVal")) {
          return `active`;
        } else {
          return "";
        }
      };

      vis.getBarHeightByRace = (x,d) => {
        if(d[0] == "yes") {
          return (x/vis.maxInterracialCount) * 100;
        } else {
          return (x/vis.maxSameRaceCount) * 100;
        }
      }; 

    const individualBars = barGroup.selectAll('.bar')
        .data(d => d[1], d => d[0]) 
          .join ('rect')
          .attr('class', d => `bar ${d[0]}`)
          .attr('x', d=> vis.xSubgroupScale(d[0]) + vis.xScale.bandwidth() + 1)
          .attr('y', d => {
            if(vis.barHeightTooSmall(d)) {
              return vis.yScale(vis.addMinBarHeight);
            } else {
              return vis.yScale(vis.getBarHeightByRace(d[1],d));
            }
          })
          .attr('width', 20)
          .attr('height', d => {
            if(vis.barHeightTooSmall(d)) {
              return vis.height - vis.yScale(vis.addMinBarHeight)
            } else {
              return vis.height - vis.yScale(vis.getBarHeightByRace(d[1],d));
            }
          })
          .attr('class', d =>  `bar ${d[0]} ${vis.checkIfActive(d)}`)
          .classed("selected", d => {
            return vis.clickedBar.length !== 0 && vis.clickedBar[0] == d[0] && vis.clickedBar[1] == d[1];
          });



    individualBars
      .on('mouseover', function (event,d) {
        vis.toolTipInfo(event,d);
      })
      .on('mousemove', (event) => {
        d3.select('#tooltip')
          .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
          .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
      }).on('click', function(event, d) {
        vis.storeClickedBar = d;
        currcirclesChartSubCategory = d[0];
      });

    // when a bar is clicked, filter all the displays
    barGroup
      .on('click', function(event, d) {
        currcirclesChartMainCategory = d[0];
        barChartFilterDotMatrixChartData();
        vis.clickedBar.push(vis.storeClickedBar[0]);
        vis.clickedBar.push(vis.storeClickedBar[1]);
        vis.renderVis();
      });
  
    // call the axes
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }


 /**
   *  displays the tooltip information of the individual bars
   */
 toolTipInfo(event,d) {
  let vis = this;

  let subCatname = d => {
    if (d[0] == "no") {
      return "Same Race";
    } else {
      return "Interracial";
    }
  };

  let getCount = d => {
    if (vis.barHeightTooSmall(d))
    {
      return `< ${vis.addMinBarHeight}%`;
    } else {
      return `${Math.round(vis.getBarHeightByRace(d[1], d))}%`;
    }
  }

  d3.select('#tooltip')
  .style('display', 'block')
  .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
  .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
  .html(`
    <div><strong>${subCatname(d)}</strong></div>
    <div><b>Count:</b> ${getCount(d)}</div> 
  `);
}

/**
 * Filters the data for people who left the answer blank, refused to answer, for either of the questions 
 * regarding their relationship ranking, or whether they are part of an interracial couple.
 */
preprocessData() {
  let vis = this;
  vis.data = vis.data.filter(d => relationshipRanking(d) !="" && relationshipRanking(d) != "Refused" &&
   whetherInterracialOrSameRace(d) != "" && whetherInterracialOrSameRace(d) != "Refused");
}


}

