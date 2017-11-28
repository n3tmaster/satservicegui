Vue.component('modal', {
  template: '#modal-template'
})

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
    modalState: 'Disegna',
    //snd: new Audio("snd/button.mp3"), // buffers automatically when created
  },
  watch: {
    when: function() { vm.overlayExtractedImage(); },
    format: function() { vm.overlayExtractedImage(); },
  },
  methods: {
    modalStateForward: function(){
      var states = ['Disegna','Osserva','Decidi', 'Agisci'];
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
      vm.$data.loading = true
      if (this.polygon.length < 1) return console.log('[ERROR] no given polygon');
      var q = {srid: 3857, srid_to: 4326, polygon: this.polygon};
      var rasterUrl = this.origin+"/j_find_raster_elements?"+this.enc(q)
      this.$http.get(rasterUrl, {withCredentials: false}).then(function (response) {
        var dates = response.data.map(function(x){ return x.data })
        var cal = document.getElementById('dates');
        rome(cal, {time: false, dateValidator: rome.val.only(dates) }).on('data',vm.setWhen)
        vm.$data.dates = dates;
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
    downloadNDVI: function () {
      // this.snd.play();
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
    calcPotentialYeld: function() {
      if(this.extractedImage) {
        //this.map.removeLayer(this.extractedImage);
        var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon});
        this.extractedImage = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: this.origin+"/j_download_nitro_yeld?"+this.enc(q),
            imageExtent: this.boxExtent
          })
        });
        this.map.addLayer(this.extractedImage);
      }
    },
    calcNitroPotentialYeldJS: function(){
      if(this.extractedImage) {
        //this.map.removeLayer(this.extractedImage);
        var q = Object.assign(this.baseParams, this.whenHash(), {polygon: this.polygon, nitro: this.unha});
        this.extractedImage = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: this.origin+"/j_calc_nitro_yeld?"+this.enc(q),
            imageExtent: this.boxExtent
          })
        });
        this.map.addLayer(this.extractedImage);
      }
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

  var coords = positions.getCoordinates();
  var html = [
    'Position: ' + position[0].toFixed(2) + ', ' + position[1].toFixed(2),
    'Accuracy: ' + accuracy,
    'Heading: ' + Math.round(radToDeg(heading)) + '&deg;',
    'Speed: ' + (speed * 3.6).toFixed(1) + ' km/h',
    'Delta: ' + Math.round(500) + 'ms'
  ].join('<br />');
  document.getElementById('info').innerHTML = html;
});

geolocation.on('error', function() { console.log('geolocation error'); });

function radToDeg(rad) { return rad * 360 / (Math.PI * 2); }
function degToRad(deg) { return deg * Math.PI * 2 / 360; }
function mod(n) { return ((n % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI); }

function addPosition(position, heading, m, speed) {
  var x = position[0];
  var y = position[1];
  var fCoords = positions.getCoordinates();
  var previous = fCoords[fCoords.length - 1];
  var prevHeading = previous && previous[2];
  if (prevHeading) {
    var headingDiff = heading - mod(prevHeading);

    if (Math.abs(headingDiff) > Math.PI) {
      var sign = (headingDiff >= 0) ? 1 : -1;
      headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
    }
    heading = prevHeading + headingDiff;
  }
  positions.appendCoordinate([x, y, heading, m]);

  // only keep the 20 last coordinates
  positions.setCoordinates(positions.getCoordinates().slice(-20));
}

var previousM = 0;
function updateView() {
  var m = Date.now() - 500 * 1.5;
  m = Math.max(m, previousM);
  previousM = m;
  var c = positions.getCoordinateAtM(m, true);
  if (c) { marker.setPosition(c); }
}

var geolocateBtn = document.getElementById('geo-locate');
geolocateBtn.addEventListener('click', function() {
  geolocation.setTracking(true); // Start position tracking
  vm.map.on('postcompose', updateView);
  //vm.map.render();
}, false);