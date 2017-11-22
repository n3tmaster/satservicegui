Vue.prototype.$http = axios  // per usare this.$http.get in Vue
var vm = new Vue({
  el: '#agrosat',
  data: {
    name: 'AgroSat App',
    description: '0.0.1',
    origin: "http://149.139.16.54:8080/ssws/api/download",
    baseParams: {table_name: 'ndvi', srid: 3857, srid_to: 4326, streamed: 0},
    format: 'rgb',
    nitro: false,
    unha: 0,
    when: "2017-10-15",
    polygon: "",
    boxExtent: null,
    currentInteraction: null,
    extractedImage: null,
    source4Interaction: new ol.source.Vector(),
    map: null,
    snd: new Audio("snd/button.mp3"), // buffers automatically when created
  },
  methods: {
    setWhen: function(aDate) {
      this.when = aDate
    },
    whenHash: function() {
      var dSplit = this.when.split("-")
      return { year: +dSplit[0], month: +dSplit[1], day: +dSplit[2] }
    },
    wktPolygon: function(geom) {
      var c = String(geom.getCoordinates()[0]).replace(/\[|\]/g," ").split(",");
      var poly = ""
      for (var i = 0; i < c.length; i=i+2){ poly += c[i]+" "+c[i+1]+","; }
      return "POLYGON(("+poly+c[0]+" "+c[1]+"))"
    },
    fetchDatesWithRasters: function () {
      if (this.polygon.length < 1) return console.log('[ERROR] no given polygon');
      var q = {srid: 3857, srid_to: 4326, polygon: this.polygon};
      window.open(this.origin+"/j_find_raster_elements?"+this.enc(q), "_blank");
    },
    cleanInteraction: function() {
      this.source4Interaction.clear()
      this.map.removeLayer(this.extractedImage)
    },
    overlayExtractedImage: function() {
      this.map.removeLayer(this.extractedImage);
      var q = Object.assign(this.baseParams, this.whenHash(), {streamed: 1, polygon: this.polygon});
      this.extractedImage = new ol.layer.Image({
        source:  new ol.source.ImageStatic({
          title: 'extracted raster',
          attributions: 'extracted raster',
          url: this.origin+'/j_extract_'+this.format+'?'+this.enc(q),
          imageExtent: this.boxExtent
        })
      });
      this.map.addLayer(this.extractedImage);
    },
    panOn: function() {
      this.map.removeInteraction(this.currentInteraction);
      this.currentInteraction = new ol.interaction.DragPan();
      this.map.addInteraction(this.currentInteraction);
    },
    drawPolygon: function (){
      this.map.removeInteraction(this.currentInteraction);
      this.currentInteraction = new ol.interaction.Draw({ type: 'Polygon' });
      this.currentInteraction.on('drawstart', this.cleanInteraction); // clean any vector feat & raster (extr.img)
      this.currentInteraction.on('drawend',function(evt){
        var g = evt.feature.getGeometry();
        vm.$data.source4Interaction.addFeature(new ol.Feature({ geometry: g }));
        vm.$data.boxExtent = g.getExtent();
        vm.$data.polygon = vm.wktPolygon(g);

        vm.overlayExtractedImage();
        vm.panOn();
      });

      this.map.addInteraction(this.currentInteraction);
    },
    enc: function (data) {
      var paramsAry = [];
      Object.keys(data).forEach( function (k, idx, ary) {
        paramsAry.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
      });
      return paramsAry.join('&');
    },
    downloadNDVI: function () {
      this.snd.play();
      var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon});
      window.open(this.origin+"/j_download_ndvi?"+this.enc(q));
    },
    downloadPotYeld: function () {
      var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon});
      window.open(this.origin+"/j_download_potential_yeld?"+this.enc(q), "_blank");
    },
    downloadNitroYeld: function () {
      var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon, nitro: this.unha});
      window.open(this.origin+"/j_download_nitro_yeld?"+this.enc(q), "_blank");
    },
  },
  computed: {
    nitroColors: function() {
      return this.nitro ? ['#FFFFC1','#42C9D2', '#101A79'] : ['#88210F', '#F6F140', '#1A6E1C']
    },
  },
  mounted: function(){
    var _map = new ol.Map({
      view: new ol.View({ center: ol.proj.transform([15.356694, 41.493683],'EPSG:4326', 'EPSG:3857'), zoom: 15 }),
      target: 'map',
      layers: [
        new ol.layer.Tile({
          title: 'base map', source: new ol.source.BingMaps({
            key: 'AiwTFAC5m-x0QAClwpZU23k6WDjHrh8i_cPIoFla4bNC9NrMlT9gK_tMrZbzFBS9',
            imagerySet: 'Aerial',
          })
        }),
        new ol.layer.Vector({ source: new ol.source.Vector() })
      ],
      controls: [
        new ol.control.MousePosition({
          coordinateFormat: function (c) { var x = c[0].toFixed(3); var y = c[1].toFixed(3);return x+', '+y;},
          target: 'coordinates'
        })
      ],
      interactions: ol.interaction.defaults({ mouseWheelZoom: false })
    })
    _map.addControl(new ol.control.ZoomSlider());
    this.map = _map;
    // Calendar
    rome(document.getElementById('dates'), {time: false}).on('data',this.setWhen)
  },
})

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


// axios.get(rasterUrl, {withCredentials: false}).catch(function (error) {
//   if (error.response) {
//     console.log(error.response.data);
//     console.log(error.response.status);
//     console.log(error.response.headers);
//   }
// });
