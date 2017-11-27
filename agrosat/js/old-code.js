// Debug
// var req = new XMLHttpRequest();
// var url = 'http://149.139.16.54:8080/ssws/api/download/j_find_raster_elements?srid=3857&srid_to=4326&polygon=POLYGON((%201771529.9029592397%205075527.442109404,1773889.8962075445%205074323.558913913,1774128.7619209355%205073970.0376580935,1772456.7019271974%205073731.171944703,1771281.4826173128%205073501.860859848,1770927.961361494%205073931.819143951,1771396.1381597405%205074228.012628556,1771529.9029592397%205075527.442109404,%201771529.9029592397%205075527.442109404))'
// function fetchRasters() {
//   req.open('GET', url, true);
//   req.onreadystatechange = function() {
//       if (req.readyState === 4) { console.log(req.responseText); }
//   };
//   req.setRequestHeader('Accept', 'application/json');
//   req.send();
// }

// var _geoFAIL = function () {
//   console.log('Could not obtain location')
//   _x.map.setView(new ol.View({ center: ol.proj.transform([15.00, 41.00],'EPSG:4326', 'EPSG:3857'), zoom: 10 }));
// };
//
// var _geoON =  function (position) {
//   var coords = [position.coords.longitude, position.coords.latitude];
//   _x.map.setView(new ol.View({ center: ol.proj.transform(coords,'EPSG:4326', 'EPSG:3857'), zoom: 15 }));
// };
//
// var _geoLocate = function () {
//   errMsg = "Sorry, your browser does not support geolocation services."
//   navigator.geolocation ? navigator.geolocation.getCurrentPosition(_geoON, _geoFAIL) : console.log(errMsg);
// };
