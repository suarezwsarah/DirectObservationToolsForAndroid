
//Enter editing mode to allow selection of prevSurveyPoints
//Called from Java
function startEditingMode(startEditing) {
	
	if (startEditing) {
		isEditingPoints = true;
		newSurveyPointSelectControl.deactivate();
		newSurveyPointModifyControl.deactivate();
		dragControl.deactivate();
		//prevSurveyPointsDragControl.activate();
		prevSurveyPointsSelectControl.activate();

	} else {
		isEditingPoints = false;
		unsavedEditedPoint = false;

		newSurveyPointSelectControl.activate();
		newSurveyPointModifyControl.activate();
		
		dragControl.deactivate(); //Stops old points hanging around
	
		//prevSurveyPointsDragControl.deactivate();
		prevSurveyPointsSelectControl.deactivate();		
	}	
}

//Draw positioning point and accuracy circle on map
//Called from Java
function locateMe(latitude,longitude,locationAccuracy,setCentre) {
	/*document.getElementById('boldStuff2').innerHTML = "saving layout..." + latitude + ", " + longitude; */

	ll = new OpenLayers.LonLat(longitude,latitude);
	//console.log("ll " + ll);
	
	ll.transform(	new OpenLayers.Projection("EPSG:4326"),	map.getProjectionObject());
	if (setCentre) { 
		map.setCenter(ll, 17);
    }

	// create some attributes for the feature
	//var attributes = {name: "my name", bar: "foo"};

	var myLocation = new OpenLayers.Geometry.Point(ll.lon, ll.lat);
	//var feature = new OpenLayers.Feature.Vector(myLocation, attributes);
	var feature = new OpenLayers.Feature.Vector(myLocation);
	
	locationPointLayer.removeAllFeatures();
	
	
	//Add the positioning / GPS accuracy circle
	var origin = new OpenLayers.Geometry.Point(ll.lon, ll.lat);
    var circle = OpenLayers.Geometry.Polygon.createRegularPolygon(origin, locationAccuracy, 40,0);
	var circleFeature = new OpenLayers.Feature.Vector(circle, null)


	//Add the accuracy and point
	locationPointLayer.addFeatures([circleFeature,feature]);
	locationPointLayer.redraw();
}


//Remove the position and accuracy markers
//Called from Java
function clearMyPositions() {
	myPositions.removeAllFeatures();
	myPositions.redraw();
}

//Remove the position and accuracy markers
//Called from Java
function clearMySurveyPoints() {
	prevSurveyPoints.destroyFeatures();
}

//Add previous survey points to the map
//Called from Java
function loadSurveyPointsOnMap(lon,lat,gemIdString) {
	var points = new Array(
				  new OpenLayers.Geometry.Point(lon,lat)
				  );
    for (var i = 0; i < points.length; i++) {	

		var myLocation = points[i];
		myLocation.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
		// create some attributes for the feature
		var attributes = {id: gemIdString, name: "my name", bar: "foo"};
		var feature = new OpenLayers.Feature.Vector(myLocation, attributes);
		
		prevSurveyPoints.addFeatures([feature]);
	}
	prevSurveyPoints.redraw();
}


//Get the current candidate / new survey point and updates Java with it
//Calls Java
function updateSurveyPointPositionFromMap(currentlyEditingPoints) {	
	var pt = myPositions.features[0].geometry;
	var myLocation = new OpenLayers.Geometry.Point(pt.x, pt.y);
	var feature = myPositions.features[0];
	var editingPointGemId = feature.attributes.id;

	myLocation.transform(map.getProjectionObject(),new OpenLayers.Projection("EPSG:4326"));
	console.log("updating survey point: " + myLocation.x + "," + myLocation.y);

    var id;
    if (currentlyEditingPoints) {
    	console.log("Currently editing points: " + currentlyEditingPoints);
    	id = "0";
	} else {
		console.log("updating survey PREVIOUS point: ");
		id = editingPointGemId;
	}

	try {
		var jsonData = window.webConnector.loadSurveyPoint(myLocation.x, myLocation.y,id);
	} catch(err) {
		console.log("loadSurveyPoint error");		
	}
}





/*
function startNextScreen() {
	var result = window.webConnector.loadLayerNames();  
}

function getCurrentLocation() {
	try	  {
		var jsonData = window.webConnector.getCurrentLocation();
		//var parsedJson = jQuery.parseJSON(jsonData);
		var lon = jsonData['longitude'];
		var lat = jsonData.latitude;
		//document.getElementById('debugText').innerHTML = "result" + jsonData + "lat" + lat + "lon" + lon;
	
	} catch(err) {
	
	}	
}
*/

/*
function getLayersNames() {
	var layers = map.layers;
	layerNames = [];
	
	for (var i = 0; i < layers.length; i++) {
		layerNames[i] = layers[i].name;
	}
	var jsonWriter = new OpenLayers.Format.GeoJSON();
	jsonStr = jsonWriter.write(layerNames, true);
	jsonStr = layerNames;
	
	var strFromJava = window.webConnector.loadLayerNames(jsonStr);  
	
}

function nextLayer(index) {
	var currentBaseLayer = map.baseLayer;
	var currentLayerIndex = map.getLayerIndex(currentBaseLayer);
	var layers = map.layers;
	map.setBaseLayer(layers[currentLayerIndex+index]);
}
*/


//Set the map Layer
//Called from Java
function setMapLayer(index) {
	var layers = map.layers;
	map.setBaseLayer(layers[index]);
	
}



//Add an offline base map to the map. This loads OSM type tiles e.g. from MOBAC
//Called from Java
function addOfflineBaseMap(layerNameString,tileLocationPath,zoom) {
	var zoomLevel = parseInt(zoomLevel);
	var layers = map.layers;	
	//Remove the last layer i.e. the offline map layer
	//map.removeLayer(layers[layers.length-1]);
	
	var sdtiles = new OpenLayers.Layer.XYZ(
		layerNameString,
		[
			tileLocationPath + "${z}/${x}/${y}.png.tile"
		], {

			attribution: "Tiles © " + 
				"Data © <a href='http://www.openstreetmap.org/'>OpenStreetMap</a> " +
				"and contributors, CC-BY-SA",
			sphericalMercator: true,
			transitionEffect: "resize",
			buffer: 1,
			numZoomLevels: 19
		}
	);	
	map.addLayer(sdtiles);
	var layers = map.layers;
	//map.setBaseLayer(layers[layers.length-1]);
	map.setBaseLayer(sdtiles);
}


//Add an offline map based on the TMS tiling scheme
//Called from Java
function addOfflineTMSMap(layerNameString,tileLocationPath,zoom) {

	var zoomLevel = parseInt(zoomLevel);
	var layers = map.layers;	
	//Remove the last layer i.e. the offline map layer
	//map.removeLayer(layers[layers.length-1]);
	
	var localTMSTiles = new OpenLayers.Layer.XYZ(layerNameString,
	tileLocationPath,
	{ 
		type: 'png', 
		getURL: xyz_getTileURL, 
		alpha: true, 
		isBaseLayer: true,
		numZoomLevels: 19
	});
	

	map.addLayer(localTMSTiles);
	var layers = map.layers;
	//map.setBaseLayer(layers[layers.length-1]);
	map.setBaseLayer(localTMSTiles);
}


//Add KML to the map
//Called from Java
function addKmlStringToMap(kmlString) {
	console.log("adding kml to map");
	var layer = new OpenLayers.Layer.Vector("KML");
    layer.addFeatures(GetFeaturesFromKMLString(kmlString));
    map.addLayer(layer);
}


//Add KML to the map
//Called from Java
function addKmlStringToMap2(lon,layerNameString,kmlString) {
	console.log("adding kml to map");
	console.log("gemIdString:" + kmlString);
	
	var layer = new OpenLayers.Layer.Vector(layerNameString);
    layer.addFeatures(GetFeaturesFromKMLString(kmlString));
    map.addLayer(layer);


    map.zoomToExtent(layer.getDataExtent());    
}



function removeOverlay(lat,lon,layerNameString) {
	var myLayer = map.getLayersByName(layerNameString);
	if (myLayer.length > 0) {
		map.removeLayer(myLayer[0]);
	}
}