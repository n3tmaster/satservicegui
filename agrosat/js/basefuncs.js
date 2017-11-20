var AgroSat = (function () {
  var _x = {
    mapKey: 'AiwTFAC5m-x0QAClwpZU23k6WDjHrh8i_cPIoFla4bNC9NrMlT9gK_tMrZbzFBS9',
    imagerySet: 'Aerial',
    draw: false,
    map: null,
    source4Interaction: null,
    extractedImage: null,
    interaction: new ol.interaction.DragPan(),
    polygonText: "",
    imgType: 'rgb',
    year: 2017,
    month: 10,
    day: 6,
    boxExtent: null,
    imgLoaded: false,
    poygonIsDrawed: false,
    downloadUrl: "http://149.139.16.54:8080/ssws/api/download",
    baseParams: {table_name: 'ndvi', srid: 3857, srid_to: 4326, streamed: 0},
  };

  var _enc = function (data) {
    var paramsAry = [];
    Object.keys(data).forEach( function (k, idx, ary) { paramsAry.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k])); });
    return paramsAry.join('&');
  };

  var _geoFAIL = function () {
    console.log('Could not obtain location')
    _x.map.setView(new ol.View({ center: ol.proj.transform([15.00, 41.00],'EPSG:4326', 'EPSG:3857'), zoom: 10 }));
  };

  var _geoON =  function (position) {
    var coords = [position.coords.longitude, position.coords.latitude];
    _x.map.setView(new ol.View({ center: ol.proj.transform(coords,'EPSG:4326', 'EPSG:3857'), zoom: 15 }));
  };

  var _geoLocate = function () {
    errMsg = "Sorry, your browser does not support geolocation services."
    navigator.geolocation ? navigator.geolocation.getCurrentPosition(_geoON, _geoFAIL) : console.log(errMsg);
  };

  var _when = function () {
    return {year: _x.year, month: _x.month, day: _x.day}
  };

  var _downloadNDVI = function (){
    var qData = Object.assign(_x.baseParams, _when(), {polygon: _x.polygonText});
    window.open(_x.downloadUrl+"/j_download_ndvi?"+_enc(qData), "_blank");
  };

  var _downloadPotYeld = function (){
    var qData = Object.assign(_x.baseParams, _when(), {polygon: _x.polygonText});
    window.open(_x.downloadUrl+"/j_download_potential_yeld?"+_enc(qData), "_blank");
  };

  var _downloadNitroYeld = function (nitroIn){
    var qData = Object.assign(_x.baseParams, _when(), {nitro: nitroIn, polygon: _x.polygonText});
    window.open(_x.downloadUrl+"/j_download_nitro_yeld?"+_enc(qData), "_blank");
  };

  var _activatePan = function () {
    _x.map.removeInteraction(_x.interaction);
    _x.interaction = new ol.interaction.DragPan();
    _x.map.addInteraction(_x.interaction);
  };

  var _activateDrawPolygon = function (){
    _x.map.removeInteraction(_x.interaction);
    _x.interaction = new ol.interaction.Draw({
      type: /** @type {ol.geom.GeometryType} */ ('Polygon')
    });
    // on dragbox start, clean previous vector feature and raster (extr. image)
    _x.interaction.on('drawstart',function(evt){
      _x.source4Interaction.clear();
      _x.map.removeLayer(_x.extractedImage);
    });

    _x.interaction.on('drawend',function(evt){
      var feat = evt.feature;
      var geom = feat.getGeometry();
      var coords = " " +  geom.getCoordinates()[0];
      var coordsArr = coords.replace("["," ");
      coordsArr = coordsArr.replace("]"," ");
      coordsArr = coordsArr.split(",");

      var featIn = new ol.Feature({ geometry: geom });

      _x.source4Interaction.addFeature(featIn);

      //build Well Known Text (WKT) Polygon
      _x.polygonText = "POLYGON((";
      _x.boxExtent = geom.getExtent();

      for (var i =  0; i < coordsArr.length; i=i+2){
        _x.polygonText += coordsArr[i] + " " + coordsArr[i+1] + ",";
      }
      _x.polygonText += coordsArr[0] + " " + coordsArr[1] + "))";

      var qData = Object.assign(_when(), baseParams, {streamed: 1, polygon: _x.polygonText})

      _x.extractedImage = new ol.layer.Image({
        source:  new ol.source.ImageStatic({
          title: 'extracted raster',
          attributions: 'extracted raster',
          url: _x.downloadUrl+'/j_extract_'+_x.imgType+'?'+_enc(Object.assign(_x.baseParams, _when(), {streamed: 1, polygon: _x.polygonText})),
          imageExtent: _x.boxExtent
        })
      });
      _x.map.addLayer(_x.extractedImage);
      _x.imgLoaded = true;
    });
    _x.map.addInteraction(_x.interaction);
  }

  var _fetchDatesWithRasters = function () {
    if (_x.polygonText.length > 0) {
      var qData = {srid: 3857, srid_to: 4326, polygon: _x.polygonText};
      window.open(_x.downloadUrl+"/j_find_raster_elements?"+_enc(qData), "_blank");
    } else {
      console.log('[ERROR] no given polygon')
    }
  }

  var _changeImageType = function (){
    //  'http://149.139.16.54:8080/ssws/api/download/j_extract_' + imgtype + '?year=' + ... + '&table_name=ndvi&srid=3857&srid_to=4326&streamed=1&polygon=' + polygonText
    if(_x.imgLoaded) {
      _x.map.removeLayer(_x.extractedImage);
      var qData = Object.assign(_when(), baseParams, {streamed: 1, polygon: _x.polygonText})
      _x.extractedImage = new ol.layer.Image({
        source: new ol.source.ImageStatic({
          title: 'extracted raster',
          attributions: 'extracted raster',
          url: (_x.downloadUrl+'/j_extract_'+_x.imgType+'?'+ _enc(qData)),
          imageExtent: boxExtent
        })
      });

      map.addLayer(extractedImage);
    } else {
      console.log('[ERROR] imgLoaded is false or undefined')
    }
  }

  var _init = function () {
    // Map
    _x.source4Interaction = new ol.source.Vector();
    _x.map = new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          title: 'base map',
          source: new ol.source.BingMaps({ key: _x.mapKey, imagerySet: _x.imagerySet})
        }),
        new ol.layer.Vector({
          source: _x.source4Interaction
        })
      ],
      controls: [
        new ol.control.MousePosition({
          coordinateFormat: function (coordinates) {
            var coord_x = coordinates[0].toFixed(3);
            var coord_y = coordinates[1].toFixed(3);
            return coord_x + ', ' + coord_y;
          },
          target: 'coordinates'
        })
      ],
      interactions: ol.interaction.defaults({mouseWheelZoom:false})
    });
    _x.map.addControl(new ol.control.ZoomSlider());

    // -> add as interaction on click _geoLocate()
    var initMapCenter = [15.356694, 41.493683];
    _x.map.setView(new ol.View({ center: ol.proj.transform(initMapCenter,'EPSG:4326', 'EPSG:3857'), zoom: 15 }));

    // Date Picker
    rome(document.getElementById('dates'), {time: false}).on('data', function (pickedDateStr) {
      var dSplit = pickedDateStr.split('-');
      _x.year = +dSplit[0];
      _x.month = +dSplit[1];
      _x.day = +dSplit[2];
      // document.getElementById('picked-date').innerText = value;
      console.log(_when())
    });
  };

  return {
    init: _init,
    state: _x,
    when: _when,
    downloadNDVI: _downloadNDVI,
    downloadPotYeld: _downloadPotYeld,
    downloadNitroYeld: _downloadNitroYeld,
    activatePan: _activatePan,
    activateDrawPolygon: _activateDrawPolygon,
    fetchDatesWithRasters: _fetchDatesWithRasters,
    changeImageType: _changeImageType
  };

})();

if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
  AgroSat.init();
} else {
  document.addEventListener('DOMContentLoaded', AgroSat.init);
}