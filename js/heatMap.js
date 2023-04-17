class HeatMap {

    /**
     * Class constructor with initial configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: 410,
        containerHeight: 315,
        tooltipPadding: 15,
        margin: {top: 40, right: 60, bottom: 100, left: 130},
        legendWidth: 10,
        legendHeight: 100
      }
      this.data = _data;
      this.selectedCategories = [];
      
      this.initVis();
    }
    
    initVis() {
      let vis = this;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

      vis.initScales();

      vis.initAxes();

      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement).append("svg")
          .attr("width", vis.config.containerWidth)
          .attr("height", vis.config.containerHeight)
          .attr("id", "heat-map-chart")
          .attr("class", "chart");
    
      vis.addGroups();

      vis.addLabels();

      vis.initLegend();

      vis.updateVis();
  }

  updateVis() {
    let vis = this;

    // filter out data points where there was no response
    vis.data = vis.data.filter((d) => {
      let responded_sex_freq = d.w6_sex_frequency != "" && d.w6_sex_frequency != "Refused";
      let responded_religious = d.ppp20072 != "" && d.ppp20072 != "Refused";
      let has_cohab_value = d.cohab_before_marriage != "";
      return responded_sex_freq && responded_religious && has_cohab_value;
    });

    vis.box_groups = d3.flatRollup(vis.data, v => v.length, d => d.ppp20072, d => d.w6_sex_frequency);

    // Specify x-, y-, and color- accessor functions
    vis.xValue = (d) => d.ppp20072;
    vis.yValue = (d) => d.w6_sex_frequency;
    vis.colorValue = (d) => d[2];

    // Set the scale input domains, x and y domain explicit for ordering
    vis.xScale.domain([
      "Never",
      "Once a year or less",
      "A few times a year",
      "Once or twice a month",
      "Once a week",
      "More than once a week",
    ]);
    vis.yScale.domain([
      "Once a month or less",
      "2 to 3 times a month",
      "Once or twice a week",
      "3 to 6 times a week",
      "Once a day or more",
    ]);
    vis.colorScale.domain(d3.extent(vis.box_groups, vis.colorValue));

    vis.renderVis();
    vis.renderLegend();
  }

  renderVis() {
    let vis = this;

    let boxes = vis.chart.selectAll('.box')
        .data(vis.box_groups)
      .join('rect')
        .attr('class', 'box')
        .attr('x', d => vis.xScale(d[0]))
        .attr('y', d => vis.yScale(d[1]))
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('width', vis.xScale.bandwidth())
        .attr('height', vis.yScale.bandwidth())
        .style('fill', d => vis.colorScale(vis.colorValue(d)))
        .classed('selected', d => vis.selectedCategories.length > 0 && vis.selectedCategories[0] === d[0] && vis.selectedCategories[1] === d[1])
        .on('click', function(event, d) {
          heatMapfilterDotMatrixChartData(d[1], d[0]);
          d3.select(this).classed('selected', true);
        });

    vis.tooltipEventListener(boxes);

    vis.xAxisG.call(vis.xAxis).selectAll(".tick text")
        .attr("transform", "rotate(320)")
        .style("text-anchor", "end");
    vis.yAxisG.call(vis.yAxis);
  }

  tooltipEventListener(mark) {
    let vis = this;

    mark
      .on("mouseover", (event, d) => {
        d3.select("#tooltip").style("display", "block").html(`<div><b>Number of people:</b> ${vis.colorValue(d)}</div>`);
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px");
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      });
  }

  initScales() {
    let vis = this;

    vis.xScale = d3.scaleBand()
        .range([0, vis.width])
        .padding(0.03);

    vis.yScale = d3.scaleBand()
        .range([vis.height, 0])
        .padding(0.03);

    vis.colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdPu);
  }

  initAxes() {
    let vis = this;

    vis.xAxis = d3.axisBottom(vis.xScale)
        .tickSize(0)
        .tickPadding(5);

    vis.yAxis = d3.axisLeft(vis.yScale)
        .tickSize(0)
        .tickPadding(5);
  }

  addGroups() {
    let vis = this;

    vis.chart = vis.svg.append("g")
        .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append x-axis group
    vis.xAxisG = vis.chart.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append("g")
        .attr("class", "axis y-axis");

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
  }

  addLabels() {
    let vis = this;

    vis.svg.append("text")
        .attr("class", "title")
        .attr("x", 35)
        .attr("y", vis.config.margin.top - 27)
        .attr("dy", ".71em")
        .attr("text-anchor", "left")
        .text("Sex Frequency by Religiousness");

    vis.chart.append("text")
        .attr("class", "axis-label")
        .attr("y", vis.height + 85)
        .attr("x", vis.width / 2)
        .attr("dy", ".71em")
        .style("text-anchor", "middle")
        .text("Religious Service Attendance");

    vis.svg.append("text")
        .attr("class", "axis-label")
        .attr("x", -vis.height / 2)
        .attr("y", 5)
        .attr("dy", ".71em")
        .attr("transform", "rotate(270)")
        .style("text-anchor", "end")
        .text("Sex Frequency");
  }

  initLegend() {
    let vis = this;

    // Legend
    vis.legend = vis.svg.append("g")
        .attr("transform", `translate(${vis.config.containerWidth - 35},${vis.config.margin.top + 40})`);

    vis.legendColorGradient = vis.legend.append("defs").append("linearGradient")
        .attr("id", "linear-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    vis.legendColorRamp = vis.legend.append("rect")
        .attr("width", vis.config.legendWidth)
        .attr("height", vis.config.legendHeight)
        .attr("fill", "url(#linear-gradient)");

    vis.yLegendScale = d3.scaleLinear()
        .range([0, vis.config.legendHeight]);

    vis.yLegendAxis = d3.axisRight(vis.yLegendScale)
        .tickSize(vis.config.legendWidth + 3)
        .tickFormat(d3.format("d"));

    vis.yLegendAxisG = vis.legend.append("g")
        .attr("class", "axis y-axis legend-axis");
  }

  renderLegend() {
    let vis = this;

    // Add stops to the gradient
    vis.legendColorGradient.selectAll("stop")
        .data([
          {offset: "0%", color: vis.colorScale.range()[0]},
          {offset: "25%", color: "#fbb4b9"},
          {offset: "50%", color: "#f768a1"},
          {offset: "75%", color: "#c51b8a"},
          {offset: "100%", color: vis.colorScale.range()[1]},
        ])
      .join("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

    vis.yLegendScale.domain(vis.colorScale.domain()).nice();
    const extent = vis.yLegendScale.domain();

    // Manually calculate tick values
    vis.yLegendAxis.tickValues([
      extent[0],
      parseInt(extent[1] / 3),
      parseInt((extent[1] / 3) * 2),
      extent[1],
    ]);

    // Update legend axis
    vis.yLegendAxisG.call(vis.yLegendAxis);
  }
}
