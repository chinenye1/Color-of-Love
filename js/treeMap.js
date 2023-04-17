// copied from https://codesandbox.io/s/github/UBC-InfoVis/447-materials/tree/23Jan/d3-examples/d3-linked-charts-basic?file=/js/barchart.js:0-4600
class TreeMap {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _method_checks) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 310,
      tooltipPadding: 15,
      margin: _config.margin || { top: 50, right: 175, bottom: 25, left: 40 },
    };
    this.data = _data;
    this.selectedMethod = "";
    this.checks = {
      checkEducationMethod: _method_checks.checkEducationMethod,
      checkProfessionalSettingMethod:
        _method_checks.checkProfessionalSettingMethod,
      checkSocialSettingMethod: _method_checks.checkSocialSettingMethod,
      checkInternetSiteMethod: _method_checks.checkInternetSiteMethod,
      checkOnlineSocialNetworkingMethod:
        _method_checks.checkOnlineSocialNetworkingMethod,
      checkAbroadMethod: _method_checks.checkAbroadMethod,
      checkMutualConnectionMethod: _method_checks.checkMutualConnectionMethod,
    };
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static elements, such as axis titles
   */
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

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .attr("id", "tree-map-container")
      .attr("class", "chart");

    // Colour scale for categories
    vis.colourScale = d3.scaleOrdinal(d3.schemeTableau10);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    vis.title = vis.chart
      .append("text")
      .attr("class", "title")
      .attr("x", -5)
      .attr("y", -15)
      .text("How People Met Their Partners");

    // doing the scale when initializing the visualization becuase it needs to be static
    vis.colourScale.domain(Object.keys(MEETING_METHODS));
    vis.legend = vis.chart
      .append("g")
      .attr("transform", `translate(${vis.config.margin.left * 6.5},-50)`)
      .attr("class", "tree-map-legend");

    vis.footnote = vis.chart
      .append("text")
      .attr("transform", `translate(-5,${vis.height + 20})`)
      .attr("class", "subtitle")
      .attr("font-size", "11px")
      .text(
        "*Categories not shown in the map are not represented by the current age group"
      );

    // https://d3-graph-gallery.com/graph/custom_legend.html
    // Add one dot in the legend for each name.
    vis.legend
      .selectAll("mydots")
      .data(Object.values(MEETING_METHODS))
      .enter()
      .append("circle")
      .attr("cx", 45)
      .attr("cy", function (d, i) {
        return 90 + i * 25;
      }) // 90 is where the first dot appears. 25 is the distance between dots
      .attr("r", 6)
      .style("fill", function (d) {
        return vis.colourScale(d);
      });

    // Add one dot in the legend for each name.
    vis.legend
      .selectAll("mylabels")
      .data(Object.keys(MEETING_METHODS))
      .enter()
      .append("text")
      .attr("class", "legend-text")
      .attr("x", 60)
      .attr("y", function (d, i) {
        return 90 + i * 25;
      }) // 90 is where the first dot appears. 25 is the distance between dots
      .style("font-size", "12px")
      .text(function (d) {
        return MEETING_METHODS[d];
      })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");


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

    this.updateVis();
  }

  /**
   * Prepare data and scales before we render it
   */
  updateVis() {
    let vis = this;
    // education
    const educationDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkEducationMethod(d)
    );

    // professional
    const professionalSettingDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkProfessionalSettingMethod(d)
    );

    const socialSettingDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkSocialSettingMethod(d)
    );

    const internetSiteDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkInternetSiteMethod(d)
    );

    const onlineSocialNetworkingDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkOnlineSocialNetworkingMethod(d)
    );

    const abroadDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkAbroadMethod(d)
    );

    const mutualConnectionDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => this.checks.checkMutualConnectionMethod(d)
    );

    vis.aggregatedData = new Map([
      // education
      ["Education", educationDataMap],

      ["Social Setting", socialSettingDataMap],

      // at work
      ["Professional Setting", professionalSettingDataMap],

      // internet site (dating or otherwise)
      ["Internet Website", internetSiteDataMap],

      // online social networking
      ["Online Social Networking", onlineSocialNetworkingDataMap],

      // abroad
      ["Abroad", abroadDataMap],

      // mutual connection
      ["Mutual Connection", mutualConnectionDataMap],
    ]);

    vis.nodes = [];
    vis.nodes.push({ name: "root", parent: null, value: null });
    // https://www.hackinbits.com/articles/js/how-to-iterate-a-map-in-javascript---map-part-2

    for (let [key, value] of vis.aggregatedData.entries()) {
      vis.nodes.push({
        name: key,
        parent: "root",
        value: value.length > 1 ? value.sort()[1][1] : 0,
      });
    }

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    // took code from https://www.students.cs.ubc.ca/~cs-436v/22Jan/fame/projects/project_g06/index.html
    // transforming data into hierarchy that can be used by the treemap
    const stratify = d3
      .stratify()
      .parentId((d) => d["parent"])
      .id((d) => d["name"]);

    // Creating treemap
    vis.root = d3.treemap().size([vis.width, vis.height]).padding(4)(
      stratify(vis.nodes)
        .sum((d) => d["value"])
        .sort((a, b) => b["value"] - a["value"])
    );

    // Drawing squares in treemap
    vis.chart
      .selectAll(".treemap-rect")
      .data(vis.root.leaves())
      .join("rect")
      .attr("class", "treemap-rect")
      .classed("selected", (d) => d["id"] === vis.selectedMethod)

      .attr("x", function (d) {
        return d["x0"];
      })
      .attr("y", function (d) {
        return d["y0"];
      })
      .attr("width", function (d) {
        return d["x1"] - d["x0"];
      })
      .attr("height", function (d) {
        return d["y1"] - d["y0"];
      })
      .style("fill", function (d) {
        return vis.colourScale(d["id"]);
      })
      .on("mouseover", (event, d) => {
        d3.select("#tooltip")
          .style("display", "block")
          .html(
            `<div><b>How they met:</b> ${d["id"]}</div>
             <div><b>Count:</b> ${d["value"]}</div>`
          );
      })
      .on("mousemove", (event) => {
        d3.select("#tooltip")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px");
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      })
      .on("click", function (event, d) {
        filterWithMeetingData(d["id"]);
        d3.selectAll(".tree-rect.selected").each(function () {
          d3.select(this).classed("selected", false);
        });
        d3.select(this).classed("selected", true);
      });
  }
}
