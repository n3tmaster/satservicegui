Vue.component('modal', {
  template: '#modal-template'
})

Vue.prototype.$http = axios  // per usare this.$http.get in Vue
var vm = new Vue({
  el: '#agrosat',
  data: {
    name: 'AgroSat App',
    description: '0.0.1',
    origin: "https://agrosat.fi.ibimet.cnr.it:8443/ssws/api/download",
    baseParams: {table_name: 'ndvi', srid: 3857, srid_to: 4326, streamed: 0},
    format: 'rgb',
    nitro: false,
    unha: 0,
    when: null,
    polygon: "",
    boxExtent: null,
    currentInteraction: null,
    extractedImage: null,
    source4Interaction: new ol.source.Vector(),
    map: null,
    dates: [],
    loading: false,
    showModal: false,
    modalState: '1. Disegna',
    tracking: false,
    geocoding_api_key: 'AIzaSyAKiztRLYOLrYG-fvTsGZwRBjuQ1YJzzho',
    address: 'Via Giacomo Boni 15, Roma Italy',
    menuOn: false,
    searchOn: false,
    calendarOn: false,
    calDate: new Date(),
    hasPotentialYield: false,
    hasNitroYield: false,
    nitroMin: 0,
    nitroMax: 100,
    legendValues: [],
    menuSelection: 'naturalColor',
    noData: false
  },
  computed: {
    legendColors: function() {
      return this.nitro ? ['#FFFFC1','#42C9D2', '#101A79'] : ['#88210F', '#F6F140', '#1A6E1C']
    },
    nitroDownloadable: function() {
      return this.polygon && this.nitro && this.extractedImage && this.unha > 0 && this.hasNitroYield && this.menuSelection == 'nitro'
    },
    potentialDownloadable: function() {
      return this.polygon && this.extractedImage && !this.nitro && this.hasPotentialYield && this.menuSelection == 'potYield'
    },
    displayLegend: function() {
      if (this.loading) { return false }
      var r = false
      if (this.nitro) {
        r = (this.extractedImage && this.unha > 0 && this.hasNitroYield )
      } else {
        r = (this.extractedImage && this.legendValues.length > 0)
      }
      return r
    },
    calendarContent: function(){
      var _html = calendar(this.calDate, this.dates);
      return _html;
    },
    calendarHeading: function(){
      var labels = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
      return [labels[this.calDate.getMonth()], this.calDate.getFullYear()].join(' ');
    },
    nitroScale: function(){
      var step = (this.nitroMax - this.nitroMin)/10.0;
      var v = this.nitroMin;
      var result = [Math.round(v)];
      for (var i=0; i < 10; i++) {  v+=step; result.push(Math.round(v)) }
      return result;
    }
  },
  watch: {
    when: function() { this.overlayExtractedImage(); },
    format: function() { this.overlayExtractedImage(); },
  },
  methods: {
    menuPick: function(item) {
      this.overlayExtractedImage();
      if (item == 'potYield') {
        this.menuSelection = 'potYield'
        this.calcPotentialYeld();
        this.legendValues = ["0%","10%","20%","30%","40%","50%","60%","70%","80%","90%","100%"];
        this.nitro = false
      }

      if (item == 'naturalColor') {
        this.menuSelection = 'naturalColor'
        this.format = 'rgb';
        this.legendValues = []
        this.nitro = false
      }

      if (item == 'agroState') {
        this.menuSelection = 'agroState'
        this.format = 'ndvi';
        this.legendValues = [0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1];
        this.nitro = false
      }

      if (item == 'nitro') {
        this.menuSelection = 'nitro'
        this.nitro = true
      }
    },
    moveMonth: function(step){
      if (this.calDate.getMonth() == 0 && step < 0 ) {
        this.calDate = new Date(this.calDate.getFullYear() - 1, 11, 1);
      } else if (this.calDate.getMonth() == 11 && step > 0) {
        this.calDate = new Date(this.calDate.getFullYear() + 1, 0, 1);
      } else {
        this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth()+step, 1);
      }
    },
    geocode: function(){
      this.loading = true;
      this.tracking = false;
      _geolocation.setTracking(false);
      var google = 'https://maps.googleapis.com/maps/api/geocode/json?'
      var q = {address: this.address, key: this.geocoding_api_key}
      var url = google+this.enc(q);
      this.$http.get(url, {withCredentials: false}).then(function (response) {
        var loc = response.data.results[0].geometry.location;
        vm.centerMap(loc.lat, loc.lng)
        vm.$data.loading = false;
      }).catch(function (error) {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
        vm.$data.loading = false;
      });
    },
    modalStateForward: function(){
      var states = ['1. Disegna','2. Osserva','3. Decidi', '4. Agisci'];
      var i = states.indexOf(this.modalState);
      this.modalState = states[(i+1)%4]
    },
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
      this.loading = true
      var q = {srid: 3857, srid_to: 4326, polygon: this.polygon};
      var rasterUrl = this.origin+"/j_find_raster_elements?"+this.enc(q)
      this.$http.get(rasterUrl, {withCredentials: false}).then(function (response) {
        var dates = response.data.map(function(x){ return x.data })
        if (dates.length == 0) { vm.$data.noData = true }
        vm.$data.dates = dates.sort();
        vm.$data.when = vm.$data.dates.slice(-1)[0];
        vm.$data.loading = false;
      }).catch(function (error) {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
        vm.$data.loading = false;
      });
    },
    getScaleValues: function() {
      if (this.polygon.length < 1) return console.log('[ERROR] no given polygon');
      this.loading = true
      var q = Object.assign({imgtype:'nitro',nitro:this.unha, srid: 3857, srid_to: 4326, polygon: this.polygon }, this.whenHash());
      var metadataUrl = this.origin+"/j_get_metadata?"+this.enc(q)
      this.$http.get(metadataUrl, {withCredentials: false}).then(function (response) {
        vm.$data.nitroMin = response.data[0].min;
        vm.$data.nitroMax = response.data[0].max;
        vm.$data.loading = false;
      }).catch(function (error) {
        if (error.response) {
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        }
        vm.$data.loading = false;
      });
    },
    cleanInteraction: function() {
      this.source4Interaction.clear()
      this.map.removeLayer(this.extractedImage)
    },
    overlayExtractedImage: function() {
      if (this.when && this.polygon) {
        this.map.removeLayer(this.extractedImage);
        var q = Object.assign(this.baseParams, this.whenHash(), {streamed: 1, polygon: this.polygon});
        this.loading = true;
        this.extractedImage = new ol.layer.Image({
          source:  new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: this.origin+'/j_extract_'+this.format+'?'+this.enc(q),
            imageExtent: this.boxExtent
          })
        });
        this.map.addLayer(this.extractedImage);
        this.loading = false;
      } else {
        console.log('ERROR: Unable to fetch an image, either "when" or a polygon is missing')
      }
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
        vm.fetchDatesWithRasters()
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
    downloadPotYeld: function () {
      this.loading = true;
      var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon, streamed: 0});
      window.open(this.origin+"/j_calc_potential_yeld?"+this.enc(q), "_blank");
      this.loading = false;
    },
    downloadNitroYeld: function () {
      this.loading = true;
      var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon, nitro: this.unha, streamed: 0});
      window.open(this.origin+"/j_download_nitro_yeld?"+this.enc(q), "_blank");
      this.loading = false;
    },
    calcPotentialYeld: function() {
      this.loading = true;
      if (this.extractedImage) {
        this.map.removeLayer(this.extractedImage);
        var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon});
        this.extractedImage = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: this.origin+"/j_calc_potential_yeld?"+this.enc(q),
            imageExtent: this.boxExtent
          })
        });
        this.map.addLayer(this.extractedImage);
        this.hasPotentialYield = true;
      }
      this.loading = false;
    },
    calcNitroPotentialYeld: function(){
      this.loading = true;
      if(this.extractedImage) {
        this.map.removeLayer(this.extractedImage);
        var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon, nitro: this.unha});
        this.extractedImage = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: this.origin+"/j_calc_nitro_yeld?"+this.enc(q),
            imageExtent: this.boxExtent
          })
        });
        this.getScaleValues();
        this.map.addLayer(this.extractedImage);
        this.hasNitroYield = true;
      }
      this.loading = false;
    },
    centerMap: function(lat, long) {
      console.log("Ricerca toponimo >> Long: " + long + " Lat: " + lat);
      this.map.getView().setCenter(ol.proj.transform([long, lat], 'EPSG:4326', 'EPSG:3857'));
      this.map.getView().setZoom(15);
    },
    trackSwitch: function(){
      this.tracking = _geolocation.getTracking() ? false : true;
      _geolocation.setTracking(this.tracking);
    }
  },
  mounted: function(){
    var _map = new ol.Map({
      view: new ol.View({ center: ol.proj.transform([15.356694, 41.393673],'EPSG:4326', 'EPSG:3857'), zoom: 15 }),
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
        }),
        //new ol.control.ZoomSlider()
        new ol.control.Zoom()
      ],
      interactions: ol.interaction.defaults({ mouseWheelZoom: false })
    })
    this.map = _map;
  },
});

// Geolocation (real time)
var _view = vm.map.getView()

var markerEl = document.getElementById('geolocation_marker');
var marker = new ol.Overlay({
  positioning: 'center-center',
  element: markerEl,
  stopEvent: false
});
vm.map.addOverlay(marker);

var positions = new ol.geom.LineString([],
    /** @type {ol.geom.GeometryLayout} */ ('XYZM'));

var geolocation = new ol.Geolocation(/** @type {olx.GeolocationOptions} */ ({
  projection: _view.getProjection(),
  trackingOptions: { maximumAge: 10000, enableHighAccuracy: true, timeout: 600000 }
}));

geolocation.on('change', function() {
  var position = geolocation.getPosition();
  var accuracy = geolocation.getAccuracy();
  var heading = geolocation.getHeading() || 0;
  var speed = geolocation.getSpeed() || 0;
  var m = Date.now();

  addPosition(position, heading, m, speed);
});

var _map = vm.map;
var _view = vm.map.getView();
var _geolocation = new ol.Geolocation({ projection: _view.getProjection() });

// update the HTML page when the position changes.
_geolocation.on('change', function() {
  _map.getView().setCenter(_geolocation.getPosition())
});

// handle geolocation error.
_geolocation.on('error', function(error) {
  vm.$data.noData = true;
  var noDataEl = document.querySelector('#no-data h1 span');
  noDataEl.innerHTML = error.message;
});

var accuracyFeature = new ol.Feature();
_geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(_geolocation.getAccuracyGeometry());
});

var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({ color: '#3399CC' }),
    stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
  })
}));

_geolocation.on('change:position', function() {
  var coordinates = _geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
});

new ol.layer.Vector({
  map: _map, source: new ol.source.Vector({ features: [accuracyFeature, positionFeature] })
});