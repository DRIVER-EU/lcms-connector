/**
 * This is a sample application using the LCMS OpenLayers plugin.
 * The functions and data structures below cover the entire capabilities of the
 * (view only) LCMS plugin.
 */

/** In order to display LCMS Drawings, a map is necessary.
 * The following variable stores a layer from OpenBasisKaart.nl that will be
 * our base layer. All our drawings will be displayed on top of it.
 * It is important that the projection be set to EPSG:28992.
 */
var osm_rd_tms_layer = new OpenLayers.Layer.TMS( "osm-rd-TMS",
  "http://openbasiskaart.nl/mapcache/tms/",
  { layername: 'osm@rd', type: "png", serviceVersion:"1.0.0",
    gutter:0,buffer:0,isBaseLayer:true,transitionEffect:'resize',
    tileOrigin: new OpenLayers.LonLat(-285401,22598),
    resolutions:[3440.64,1720.32,860.16,430.08,215.04,107.52,53.76,26.88,13.44,6.72,3.36,1.68,0.84,0.42,0.21],
    zoomOffset:0,
    units:"m",
    maxExtent: new OpenLayers.Bounds(-185401.920000,22598.080000,595401.920000,803401.920000),
    sphericalMercator: false,
    projection: "EPSG:28992"
  }
);

/** An OpenLayers map is instantiated and the layer is added to it. */
var map = new OpenLayers.Map('map');
map.addLayer(osm_rd_tms_layer);
map.zoomToMaxExtent();

/** The following variables store the webservices and the map controller as
 * indicated by the plugin documentation. We initialize the web services without
 * any parameters as they will only be set after the user clicks the login button.
 *
 * The map is already passed on to the controller. This takes care of finishing
 * its initialization by plugging in LCMS's custom rendering code.
 */
var activitiesWS = new LCMS.ActivityWebService();
var drawingsWS = new LCMS.DrawingWebService();
var mapCtrl = new LCMS.MapController(map);

/** The following variables are responsible for holding the ticket object, list
 * of available drawings and list of currently selected layers.
 */
var ticket;
var layers;
var drawings;

/**
 * This function is called when the used clicks the login button.
 * It sets up the web services and attempts to load the list of drawings from the
 * server.
 */
function loadActivities() {
  // Get the username, password and server URL from the fields that were filled in by the user.
  var username = $('input[name="username"]')[0].value;
  var password = $('input[name="password"]')[0].value;
  var serverUrl = $('input[name="serverUrl"]')[0].value;

  // Set up both web services.
  activitiesWS.setUp(serverUrl, username, password);
  drawingsWS.setUp(serverUrl, username, password);

  /** Define a success call back for loading the drawings
  * In this callback the ticket is stored in the ticket variable and the
  * drawings are stored in the list of drawings as well as displayed to the user
  * in a tree like structure.
  */
  log("<strong>Loading activities from server</strong> " + serverUrl);
  var success = function (data) {
    ticket = data.ticket;
    drawings = [];
    // Display the empty tree (that will be populated below)
    renderEmptyTree();

    for (var i = 0; i < data.activities.length; i++) {
      try {
        // Loads the drawing from the i-th activity
        log("Loading activity " + data.activities[i].title);
        loadDrawing(data.activities[i]);
      } catch (e) {
        // In case of error (e.g. if there are unsupported layers), alert the user
        if (data.activities[i].title !== undefined) {
          log("<span style='color:red'>Error</span> when loading the activity " + data.activities[i].title + ": " + e.message);
        } else {
          log("<span style='color:red'>Error</span>: Unknown error while loading an activity.");
        }
      }
    }

  };

  // Failure call back that displays the HTTP error status to the user
  var failure = function (error) {
    log("<span style='color:red'>Error</span> while loading the activities list: " + error.statusText);
  };

  /** Load the data using both call backs defined above.
   * Listing everything from the last 200 hours as an example.
   */
  var timestamp = Date.now() - 200*3600*1000;
  activitiesWS.loadData(success, failure, timestamp);

  // Final line just to help the user see when the list has finished loading (as it may take a while)
  log("<strong>Finished loading list.</strong>");
}

/**
 * This function is called by the success callback of the loadActivities function above.
 * It gets the data for the defined activity and reders it in the tree.
 */
function loadDrawing(activity) {
  // Success callback that renders the drawing into the tree.
  var success = function (data) {
    mapCtrl.updateDrawing(data, ticket, false);
    renderDrawing(data);
  };

  // Failure callback that displayes the HTTP error status to the user
  var failure = function (error) {
    log("<span style='color:red'>Error</span> when loading drawing: " + error.statusText);
  };

  /** Load the drawing data using both callbacks and the activity id. */
  drawingsWS.loadData(success, failure, activity.activity_id);
}

/**
 * This function is called whenever the user selects a layer to be displayed.
 * All layers in the layerElements list are presented at once, using the ticket if necessary.
 */
function presentLayer(layerElements) {
  mapCtrl.drawLayers([layerElements]);
}

////////////////////////////////////////////////////////////////////////////////
/// Auxiliary presentation functions.
////////////////////////////////////////////////////////////////////////////////

/**
 * These functions exemplify how to display the drawings and layers in a simple
 * tree structure.
 */

/**
 * Function to display the empty drawing-list floating div.
 * This will be used to display the activities and their layers.
 */
function renderEmptyTree() {
  // Clear the drawing list.
  $("#drawing-list").html("");

  // Hide the login and make the activities block visible
  $("#login").css("visibility", "hidden");
  $("#activities").css("visibility", "visible");
}

/**
 * Function that renders the drawing in the tree.
 */
function renderDrawing(drawing) {
  // Define a new list and a span for the drawing name.
  var newHtml = document.createElement("li");
  var name = document.createElement('span');
  $(name).html(drawing.name);
  $(newHtml).append(name);

  // Loop through the topic layers of the drawing.
  if (Object.keys(drawing.topicLayers).length > 0) {
    // Create a sublist and add the topic layers, rendering them in the tree with
    // renderTopicLayer().
    var subList = document.createElement('ul');
    for (var key in drawing.topicLayers) {
      // Filter topic layers that were marked as removed
      if (!drawing.topicLayers[key].removed) {
        $(subList).append(renderTopicLayer(drawing.topicLayers[key]));
      }
    }
    $(newHtml).append(subList);
  }

  // Add the drawing with its sublayers to the drawing list
  $('#drawing-list').append(newHtml);
}

/**
 * Function to render a topic layer in a HTML element.
 */
function renderTopicLayer(topicLayer) {
  // Define a new list and a span for the topic layer name.
  var newHtml = document.createElement("li");
  var name = document.createElement('span');
  $(name).html(topicLayer.name);
  $(newHtml).append(name);

  // Loop through the action layers of this topic layer
  if (Object.keys(topicLayer.actionLayers).length > 0) {
    // Create a sublist and add the action layers, rendering them in the tree with
    // renderActionLayer()
    var subList = document.createElement('ul');
    for (var key in topicLayer.actionLayers) {
      // Filter action layers that were marked as removed
      if (!topicLayer.actionLayers[key].removed) {
        $(subList).append(renderActionLayer(topicLayer.actionLayers[key]));
      }
    }
    $(newHtml).append(subList);
  }

  return newHtml;
}

/**
 * Function to render an action layer in an HTML element.
 * Simply creates a new element for the list above and adds a link with a call
 * to the presentLayer() function above, including the actionLayer as a parameter.
 */
function renderActionLayer(actionLayer) {
  var newHtml = document.createElement('li');
  var name = document.createElement('a');
  $(name).html(actionLayer.name);
  $(newHtml).append(name);
  $(newHtml).click(function () { presentLayer(actionLayer.id); });

  return newHtml;
}

/**
 * Hides the activity list box and presents the login box again for a new login.
 */
function showLogin() {
  $("#login").css("visibility", "visible");
  $("#activities").css("visibility", "hidden");
}

/**
 * Appends a log message to the event log box.
 */
function log(message) {
  var newItem = document.createElement('li');
  $(newItem).html(message);
  $("#logger-list").append(newItem);
  $("#logger").scrollTop($("#logger-list").height());
}
