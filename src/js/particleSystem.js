/* 
Authors: 
  Pavana Doddi
  Ryan Nishimoto
  Anjali Yadla

LSST SNe Visualization Project
CS529: Visual Data Science 
University of Illinois at Chicago

Built on Andrew Burk's Project 3 Base code
*/
"use strict";

/* Get or create the application global variable */
var App = App || {};

// Start of ParticleSystem function

const ParticleSystem = function() {
  // setup the pointer to the scope 'this' variable
  const self = this;

  var numOld = 0,
    numOldI = 0,
    numOldII = 0,
    numOldIa = 0;
  var numLsst = 0,
    numLsstI = 0,
    numLsstII = 0,
    numLsstIa = 0;

  // Stores index start of BufferGeometry where type changes, ordered as:
  // (old) I, II, Ia, (lsst) I, II, Ia
  var typeIndex = [];
  var typeData = {
    OldI: 0,
    OldII: 1,
    OldIa: 2,
    LsstI: 3,
    LsstII: 4,
    LsstIa: 5
  };

  // particle-related settings
  var typeMaterial = { Show: 0, Hidden: 1 };
  // size of particle (suggested: 0.01 - .1)
  var pSizes = [5, 10];
  var useSizeAttenuation = false;
  var useSprite = true;
  var blending = THREE.NormalBlending;
  var unselectedOpacity = 0.1;

  // data containers
  var snData = [];
  const oldData = [];
  const lsstData = [];

  // scene graph group for the particle system
  const sceneObject = new THREE.Group();

  // bounds of the data
  var bounds = {};
  var yearBounds = [1885, 2025];
  var yearIndex = [0, 0];
  var yearIndexes = [];

  // Variables for geometry, materials, objects.
  var pBufferGeometry;
  var pMaterials;
  var pSystem;

  var spriteTexture = new THREE.TextureLoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png"
    //"imgs/particle.png"
  );

  var sprite = spriteTexture;

  var pColors = [
    "#66c2a5",
    "#fc8d62",
    "#8da0cb",
    "#e78ac3",
    "#a6d854",
    "#ffd92f"
  ];
  var pColorsRGB = [
    new THREE.Color("rgb(102,194,165)"),
    new THREE.Color("rgb(252,141,98)"),
    new THREE.Color("rgb(141,160,203)"),
    new THREE.Color("rgb(231,138,195)"),
    new THREE.Color("rgb(166,216,84)"),
    new THREE.Color("rgb(255,217,47)")
  ];
  var margin = { top: 20, right: 30, bottom: 30, left: 60 },
    width = 900 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var context = d3
    .select("#my_datavizLSST")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var svg = d3.select("svg");
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  d3.csv("data/sneCount.csv", function(data) {
    // List of groups = header of the csv files
    var keys = data.columns.slice(1);

    // Add X axis
    var x = d3
      .scaleLinear()
      .domain([1885, 2019])
      .range([0, width - 300]);
    context
      .append("g")
      .attr("transform", "translate(0,100)")
      .style("fill", "white")
      .style("stroke", "white")
      .call(d3.axisBottom(x));

    var x2 = d3
      .scaleLinear()
      .domain([2021, 2025])
      .range([width - 290, width]);
    context
      .append("g")
      .attr("transform", "translate(0,100)")
      .style("fill", "white")
      .style("stroke", "white")
      .call(d3.axisBottom(x2));

    // Add Y axis
    var y = d3
      .scaleLinear()
      .domain([0, 1500])
      .range([100, 0]);
    context
      .append("g")
      .style("fill", "white")
      .style("stroke", "white")
      .call(d3.axisLeft(y));

    var y2 = d3
      .scaleLinear()
      .domain([0, 1200000])
      .range([120, 250]);
    context
      .append("g")
      .style("fill", "white")
      .style("stroke", "white")
      .call(d3.axisLeft(y2));

    // color palette
    var color = d3
      .scaleOrdinal()
      .domain(keys)
      .range([
        "#8da0cb",
        "#66c2a5",
        "#a6d854",
        "#e78ac3",
        "#fc8d62",
        "#ffd92f"
      ]);

    //stack the data?
    var stackedData = d3
      .stack()
      .offset(d3.wiggle)
      .keys(keys)(data);

    // Show the areas
    context
      .selectAll("mylayers")
      .data(stackedData)
      .enter()
      .append("path")
      .style("fill", function(d) {
        return color(d.key);
      })
      .attr(
        "d",
        d3
          .area()
          .x(function(d, i) {
            // console.log(d);
            if (d.data.Date < 2020) {
              return x(d.data.Date);
            } else {
              return x2(d.data.Date);
            }
          })
          .y0(function(d) {
            if (d.data.Date < 2020) {
              return y(d[0]);
            } else {
              return y2(d[0]);
            }
          })
          .y1(function(d) {
            if (d.data.Date < 2020) {
              return y(d[1]);
            } else {
              return y2(d[1]);
            }
          })
      );

    //Add brush variable
    var brush = d3
      .brushX()
      .extent([
        [0, 0],
        [width, height]
      ])
      .on("brush end", brushed);

    context
      .append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, [0, 810]);

    //Add brushing function
    function brushed() {
      if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
      if (d3.event.selection == null) return;
      var s2 = d3.event.selection || x2.range();
      console.log(s2);
      var [x0, x1] = [0, 0];
      if (s2[0] >= 0 && s2[1] <= 510) {
        [x0, x1] = s2.map(d => Math.floor(x.invert(d)));
      } else if (s2[0] <= 510 && s2[1] >= 510) {
        x0 = s2.map(d => Math.floor(x.invert(d)))[0];
        x1 = s2.map(d => Math.floor(x2.invert(d)))[1];
      } else {
        [x0, x1] = s2.map(d => Math.floor(x2.invert(d)));
      }
      console.log([x0, x1]);
      yearBounds[0] = x0;
      yearBounds[1] = x1;
      self.buildGroups();
    }
  });

  document.getElementById("help").addEventListener("click", readyFn);
  function readyFn() {
    // Code to run when the document is ready.

    var id = "#dialog";
    var maskHeight = $(document).height();
    var maskWidth = $(window).width();
    $("#mask").css({ width: maskWidth, height: maskHeight });
    $("#mask").fadeIn(500);
    $("#mask").fadeTo("slow", 0.9);
    var winH = $(window).height();
    var winW = $(window).width();
    $(id).css("top", winH / 2 - $(id).height() / 2);
    $(id).css("left", winW / 2 - $(id).width() / 2);
    $(id).fadeIn(500);
    $(".window .close").click(function(e) {
      e.preventDefault();
      $("#mask").hide();
      $(".window").hide();
    });
    $("#mask").click(function() {
      $(this).hide();
      $(".window").hide();
    });
  }

  $(document).ready(readyFn);
  // creates the particle system
  self.createParticleSystem = function(data) {
    pBufferGeometry = new THREE.BufferGeometry();
    var positions = new Float32Array(data.length * 3);
    var colors = new Float32Array(data.length * 3);
    // hold current type
    var t;
    // hold current year
    var currY = data[0].T;
    var currYIndex = 0;
    for (var i = 0, i3 = 0; i < data.length; i++, i3 += 3) {
      // build yearIndexes after counting them

      if (i + 1 == data.length) {
        yearIndexes[data[data.length - 1].T.toString()] = [currYIndex, i];
      }

      if (currY != data[i].T) {
        yearIndexes[currY.toString()] = [currYIndex, i - 1];
        currY = data[i].T;
        currYIndex = i;
        console.log(currY + " starts at " + i);
        // be sure to make last entry
      }
      if (t !== data[i].Type) {
        t = data[i].Type;
        //console.log(t + " at " + i + " for " + data[i].Source);
        typeIndex.push(i);
      }
      // Assign Positions
      positions[i3 + 0] = data[i].X;
      positions[i3 + 1] = data[i].Y;
      positions[i3 + 2] = data[i].Z;
      // Assign Colors
      if (data[i].Source === "Old") {
        if (data[i].Type === "Ia") {
          numOldIa++;
          colors[i3 + 0] = pColorsRGB[0].r;
          colors[i3 + 1] = pColorsRGB[0].g;
          colors[i3 + 2] = pColorsRGB[0].b;
        } else if (data[i].Type === "I") {
          numOldI++;
          colors[i3 + 0] = pColorsRGB[2].r;
          colors[i3 + 1] = pColorsRGB[2].g;
          colors[i3 + 2] = pColorsRGB[2].b;
        } else if (data[i].Type === "II") {
          numOldII++;
          colors[i3 + 0] = pColorsRGB[4].r;
          colors[i3 + 1] = pColorsRGB[4].g;
          colors[i3 + 2] = pColorsRGB[4].b;
        }
      } else {
        // Source === "LSST"
        if (data[i].Type === "Ia") {
          numLsstIa++;
          colors[i3 + 0] = pColorsRGB[1].r;
          colors[i3 + 1] = pColorsRGB[1].g;
          colors[i3 + 2] = pColorsRGB[1].b;
        } else if (data[i].Type === "I") {
          numLsstI++;
          colors[i3 + 0] = pColorsRGB[3].r;
          colors[i3 + 1] = pColorsRGB[3].g;
          colors[i3 + 2] = pColorsRGB[3].b;
        } else if (data[i].Type === "II") {
          numLsstII++;
          colors[i3 + 0] = pColorsRGB[5].r;
          colors[i3 + 1] = pColorsRGB[5].g;
          colors[i3 + 2] = pColorsRGB[5].b;
        }
      }
    }

    //console.log(typeIndex);
    console.log(snData.length);
    console.log(yearIndexes);
    pBufferGeometry.addAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    pBufferGeometry.addAttribute("color", new THREE.BufferAttribute(colors, 3));
    pMaterials = [
      // Selected SNe Material
      new THREE.PointsMaterial({
        size: pSizes[0],
        sizeAttenuation: useSizeAttenuation,
        vertexColors: THREE.VertexColors,
        blending: blending,
        //depthWrite: false,  // looks weird?...
        map: sprite,
        alphaTest: 0.5,
        transparent: true //or false?
      }),
      // Unselected SNe Material
      new THREE.PointsMaterial({
        size: pSizes[0],
        sizeAttenuation: useSizeAttenuation,
        blending: blending,
        //depthWrite: false,  // looks weird?...
        map: sprite,
        transparent: true, //or false?
        opacity: 0.1
      })
    ];
    // Define groups for time Ranges
    self.buildGroups();

    pSystem = new THREE.Points(pBufferGeometry, pMaterials);
    pSystem.sortParticles = true;
    /*
    console.log("hmm");
    pBufferGeometry = new THREE.BufferGeometry().fromGeometry(pGeometry);
    console.log("hmm");
    pSystem = new THREE.Points(pBufferGeometry, pMaterial);
    console.log("ok");
    */
    pBufferGeometry.getAttribute("position").needsUpdate = true;
    pBufferGeometry.getAttribute("color").needsUpdate = true;
    sceneObject.add(pSystem);

    self.drawLegend();
  };

  // Various options for GUI.
  var defaultGui = function() {
    this.ShowOld = true;
    this.ShowLsst = true;
    this.ShowTypeIa = true;
    this.ShowTypeI = true;
    this.ShowTypeII = true;
    this.Type = [];
    this.Year = 2025;
    this.Sprite = useSprite;
    this.Size = pSizes[0];
    this.UnselectedOpacity = 0.1;
    this.Reset = function() {
      location.reload();
    };
    this.Attenuation = useSizeAttenuation;
    this.AdditiveBlending = blending === THREE.AdditiveBlending;
  };

  // GUI related stuff.
  var text = new defaultGui();
  var gui = new dat.GUI();

  var settingsFolder = gui.addFolder("Point Settings");

  settingsFolder.add(text, "Size", 0, 15).onChange(function(val) {
    pSizes[0] = val;
    self.updateParticleSettings();
  });
  settingsFolder.add(text, "Attenuation").onChange(function(val) {
    useSizeAttenuation = val;
    self.updateParticleSettings();
  });
  settingsFolder.add(text, "Sprite").onChange(function(val) {
    useSprite = val;
    self.updateParticleSettings();
  });
  settingsFolder.add(text, "AdditiveBlending").onChange(function(val) {
    blending = val ? THREE.AdditiveBlending : THREE.NormalBlending;
    self.updateParticleSettings();
  });
  settingsFolder.add(text, "UnselectedOpacity", 0, 1).onChange(function(val) {
    unselectedOpacity = val;
    self.updateParticleSettings();
  });
  settingsFolder.open();

  self.updateTypeView = function(typeIndex, typeMaterialID, show) {
    console.log("toggling group: " + typeIndex + " " + show);
    pBufferGeometry.groups[typeIndex].materialIndex = show
      ? typeMaterialID
      : typeMaterial.Hidden;
    pBufferGeometry.groups[typeIndex].needsUpdate = true;
  };

  self.updateParticleSettings = function() {
    for (var i = 0; i < pMaterials.length; i++) {
      pMaterials[i].size = pSizes[0];
      pMaterials[i].sizeAttenuation = useSizeAttenuation;
      pMaterials[i].blending = i == 0 ? blending : THREE.NormalBlending;
      pMaterials[i].map = useSprite ? sprite : null;
      pMaterials[i].opacity = i == 1 ? unselectedOpacity : 1.0;
      pMaterials[i].needsUpdate = true;
    }
  };

  // Draw Legend
  self.drawLegend = function() {
    d3.select("#legend")
      .selectAll("text")
      .remove();
    d3.select("#legend")
      .selectAll("circle")
      .remove();
    var svg = d3.select("#legend");

    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 15)
      .text("Number of Supernovae Discoveries by Dataset and Type")
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "middle");
    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 36)
      .text("Between " + yearBounds[0] + " and " + yearBounds[1])
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "middle");

    svg
      .append("circle")
      .attr("cx", 20)
      .attr("cy", 60)
      .attr("r", 10)
      .style("fill", pColors[0]);
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 60)
      .text("Old Type Ia - ")
      .style("font-size", "15px")
      .style("fill", pColors[0])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 60)
      .text(numOldIa)
      .style("font-size", "15px")
      .style("fill", pColors[0])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");
    svg
      .append("circle")
      .attr("cx", 20)
      .attr("cy", 81)
      .attr("r", 10)
      .style("fill", pColors[2]);
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 81)
      .text("Old Type I - ")
      .style("font-size", "15px")
      .style("fill", pColors[2])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 81)
      .text(numOldI)
      .style("font-size", "15px")
      .style("fill", pColors[2])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");
    svg
      .append("circle")
      .attr("cx", 20)
      .attr("cy", 102)
      .attr("r", 10)
      .style("fill", pColors[4]);
    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 102)
      .text("Old Type II - ")
      .style("font-size", "15px")
      .style("fill", pColors[4])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 102)
      .text(numOldII)
      .style("font-size", "15px")
      .style("fill", pColors[4])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");

    svg
      .append("circle")
      .attr("cx", 220)
      .attr("cy", 60)
      .attr("r", 10)
      .style("fill", pColors[1]);
    svg
      .append("text")
      .attr("x", 240)
      .attr("y", 60)
      .text("LSST Type Ia - ")
      .style("font-size", "15px")
      .style("fill", pColors[1])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 400)
      .attr("y", 60)
      .text(numLsstIa)
      .style("font-size", "15px")
      .style("fill", pColors[1])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");
    svg
      .append("circle")
      .attr("cx", 220)
      .attr("cy", 81)
      .attr("r", 10)
      .style("fill", pColors[3]);
    svg
      .append("text")
      .attr("x", 240)
      .attr("y", 81)
      .text("LSST Type I - ")
      .style("font-size", "15px")
      .style("fill", pColors[3])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 400)
      .attr("y", 81)
      .text(numLsstI)
      .style("font-size", "15px")
      .style("fill", pColors[3])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");
    svg
      .append("circle")
      .attr("cx", 220)
      .attr("cy", 102)
      .attr("r", 10)
      .style("fill", pColors[5]);
    svg
      .append("text")
      .attr("x", 240)
      .attr("y", 102)
      .text("LSST Type II - ")
      .style("font-size", "15px")
      .style("fill", pColors[5])
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 400)
      .attr("y", 102)
      .text(numLsstII)
      .style("font-size", "15px")
      .style("fill", pColors[5])
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");

    svg
      .append("text")
      .attr("x", 40)
      .attr("y", 125)
      .text("Old Total - ")
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 200)
      .attr("y", 125)
      .text(numOld)
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");

    svg
      .append("text")
      .attr("x", 240)
      .attr("y", 125)
      .text("LSST Total - ")
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle");
    svg
      .append("text")
      .attr("x", 400)
      .attr("y", 125)
      .text(numLsst)
      .style("font-size", "15px")
      .style("fill", "white")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", "end");

    //reposition
    var w = d3.select(".particleDiv").node().clientWidth;
    var h = w / 2.5;
    $("#legend").css({ top: h - 60, left: w - 600, position: "absolute" });
  };
  self.buildGroups = function() {
    // Don't make any changes if there is no data to change
    // store starting index and number of values to change
    yearIndex[0] = yearIndexes[yearBounds[0].toString()][0];
    yearIndex[1] = yearIndexes[yearBounds[1].toString()][1];
    console.log("Indexes: " + yearIndex[0] + "," + yearIndex[1]);
    var indexLength = yearIndexes[yearBounds[1].toString()];
    if (indexLength !== undefined) {
      pBufferGeometry.clearGroups();
      pBufferGeometry.addGroup(
        yearIndex[0] + 1,
        yearIndex[1] - yearIndex[0],
        typeMaterial.Show
      );
      pBufferGeometry.addGroup(0, yearIndex[0], typeMaterial.Hidden);
      pBufferGeometry.addGroup(
        yearIndex[1] - yearIndex[0] + 1,
        snData.length - (yearIndex[1] - yearIndex[0]),
        typeMaterial.Hidden
      );
      console.log("Updating groups:");
      console.log(
        yearBounds[1] + " index: " + yearIndexes[yearBounds[1].toString()]
      );
      console.log("YearBounds:" + yearBounds);
      console.log("YearIndex: " + yearIndex);
      for (var i = 0; i < pBufferGeometry.groups.length; i++) {
        pBufferGeometry.groups[i].needsUpdate = true;
      }
      console.log(pBufferGeometry.groups);

      // recount SNe variables
      numOld = numOldI = numOldII = numOldIa = numLsst = numLsstI = numLsstII = numLsstIa = 0;
      for (var i = 0; i < snData.length; i++) {
        if (snData[i].T >= yearBounds[0] && snData[i].T <= yearBounds[1]) {
          if (snData[i].Source === "Old") {
            numOld++;
            if (snData[i].Type === "I") {
              numOldI++;
            }
            if (snData[i].Type === "II") {
              numOldII++;
            }
            if (snData[i].Type === "Ia") {
              numOldIa++;
            }
          } else if (snData[i].Source === "LSST") {
            numLsst++;

            if (snData[i].Type === "I") {
              numLsstI++;
            }

            if (snData[i].Type === "II") {
              numLsstII++;
            }

            if (snData[i].Type === "Ia") {
              numLsstIa++;
            }
          }
        }
      }
      console.log(numOld);
      console.log(numLsst);
      self.drawLegend();
      self.drawLegend();
    }
  };
  // data loading function
  self.loadData = function() {
    // read the old SNe csv file
    console.log("Loading Data: data/OpenSNCatConverted.csv");
    d3.csv("data/OpenSNCatConverted.csv")
      // iterate over the rows of the csv file
      .row(function(d) {
        oldData.push({
          // SNe Name, host, type
          Name: String(d.name),
          Host: String(d.host),
          Type: String(d.type),
          // Position
          X: Number(d.x),
          Y: Number(d.y),
          Z: Number(d.z),
          // Time
          T: Number(Math.floor(d.t)),
          // Luminosity
          L: Number(d.log10lum),
          Source: String("Old")
        });
      })
      // when done loading
      .get(function() {
        numOld = oldData.length;
        console.log("Loaded Old Data: " + numOld + " SNe");
      });

    console.log("Loading Data: data/LSSTConverted.csv");
    d3.csv("data/LSSTConverted.csv")
      // iterate over the rows of the csv file
      .row(function(d) {
        lsstData.push({
          // Position
          Type: String(d.type),
          X: Number(d.x),
          Y: Number(d.y),
          Z: Number(d.z),
          // Time
          T: Number(Math.floor(d.t)),
          Source: String("LSST")
        });
      })
      // when done loading
      .get(function() {
        numLsst = lsstData.length;
        console.log("Loaded LSST Data: " + numLsst + " SNe");

        // concat old and new data
        snData = oldData.concat(lsstData);

        snData.sort(function(a, b) {
          return a.T > b.T ? 1 : -1;
        });
        console.log("Combined data: " + snData.length + " SNe");
        yearBounds[0] = snData[0].T;
        yearBounds[1] = snData[snData.length - 1].T;
        yearIndex[0] = 0;
        yearIndex[1] = snData.length - 1;
        console.log("Year Bounds: " + yearBounds);
        console.log("Year Indexes: " + yearIndex);
        // create the particle system for lsst data
        self.createParticleSystem(snData);

        //self.updateColors(yearBounds);
        //pSystem.geometry.colorsNeedUpdate = true;
        //pSystem.geometry.colorsNeedUpdate = true;
      });
  };

  // publicly available functions
  self.public = {
    // load the data and setup the system
    initialize: function() {
      self.loadData();
    },

    // accessor for the particle system
    getParticleSystems: function() {
      return sceneObject;
    }
  };

  return self.public;
};
