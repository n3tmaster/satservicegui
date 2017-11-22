var Ags = Object.freeze({
  name: 'AgroSat App',
  description: '0.0.1',
  downloadUrl: "http://149.139.16.54:8080/ssws/api/download",
  baseParams: {table_name: 'ndvi', srid: 3857, srid_to: 4326, streamed: 0},
  helpers: {
    enc: function (data) {
      var paramsAry = [];
      Object.keys(data).forEach( function (k, idx, ary) {
        paramsAry.push(encodeURIComponent(k) + '=' + encodeURIComponent(data[k]));
      });
      return paramsAry.join('&');
    },
    downloadNDVI: function (when, polytxt) {
      var q = Object.assign(baseParams, when, {polygon: polytxt});
      window.open(downloadUrl+"/j_download_ndvi?"+helpers.enc(q), "_blank");
    },
    downloadPotYeld: function (when, polytxt) {
      var q = Object.assign(Ags.baseParams, when, {polygon: polytxt});
      window.open(downloadUrl+"/j_download_potential_yeld?"+helpers.enc(q), "_blank");
    },
    downloadNitroYeld: function (when, polytxt, nitroIn) {
      var q = Object.assign(Ags.baseParams, when, {polygon: polytxt, nitro: nitroIn});
      window.open(downloadUrl+"/j_download_nitro_yeld?"+helpers.enc(q), "_blank");
    },
  // more helper pure functional methods here...
  },
});

Vue.prototype.$http = axios  // per usare this.$http.get in Vue
var vm = new Vue({
  el: '#agrosat',
  data: {
    format: 'rgb',
    nitro: false,
    when: "2017-10-15",
    polygon: " ",
    boxExtent: null,
    currentInteraction: null,
    extractedImage: null,
    source4Interaction: new ol.source.Vector(),
    map: null,
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
      var c = " "+geom.getCoordinates()[0];
      c = c.replace(/\[|\]/g," ").split(",");
      var poly = ""
      for (var i = 0; i < c.length; i=i+2){ poly += c[i]+" "+c[i+1]+","; }
      poly += c[0]+" "+c[1];
      return "POLYGON(("+poly+"))"
    },
    fetchDatesWithRasters: function () {
      if (this.polygon.length > 0) {
        var q = {srid: 3857, srid_to: 4326, polygon: this.polygon};
        window.open(Ags.downloadUrl+"/j_find_raster_elements?"+Ags.helpers.enc(q), "_blank");
      } else {
        console.log('[ERROR] no given polygon')
      }
    },
    drawPolygon: function (){
      this.map.removeInteraction(this.currentInteraction);
      this.currentInteraction = new ol.interaction.Draw({ type: 'Polygon' });
      // on dragbox start, clean previous vector feature and raster (extr. image)
      this.currentInteraction.on('drawstart',function(evt){
        vm.$data.source4Interaction.clear();
        vm.$data.map.removeLayer(vm.$data.extractedImage);
      });

      this.currentInteraction.on('drawend',function(evt){
        var g = evt.feature.getGeometry()
        var featIn = new ol.Feature({ geometry: g });
        vm.$data.source4Interaction.addFeature(featIn);
        vm.$data.boxExtent = g.getExtent();
        vm.$data.polygon = vm.wktPolygon(g)
        var q = Object.assign(Ags.baseParams, vm.whenHash(), {streamed: 1, polygon: vm.$data.polygon});

        vm.$data.extractedImage = new ol.layer.Image({
          source:  new ol.source.ImageStatic({
            title: 'extracted raster',
            attributions: 'extracted raster',
            url: Ags.downloadUrl+'/j_extract_'+vm.$data.format+'?'+Ags.helpers.enc(q),
            imageExtent: vm.$data.boxExtent
          })
        });
        vm.$data.map.addLayer(vm.$data.extractedImage);

        vm.$data.map.removeInteraction(vm.$data.currentInteraction);
        vm.$data.currentInteraction = new ol.interaction.DragPan();
        vm.$data.map.addInteraction(vm.$data.currentInteraction);
      });

      this.map.addInteraction(this.currentInteraction);
    }
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

//
//   var _changeImageType = function (){
//     _x.map.removeLayer(_x.extractedImage);
//     var q = Object.assign(Ags.baseParams, _x.when, {streamed: 1, polygon: _x.polygonText})
//     _x.extractedImage = new ol.layer.Image({
//       source: new ol.source.ImageStatic({
//         title: 'extracted raster',
//         attributions: 'extracted raster',
//         url: Ags.downloadUrl+'/j_extract_'+_x.imgType+'?'+Ags.helpers.enc(q),
//         imageExtent: _x.boxExtent
//       })
//     });
//     map.addLayer(extractedImage);
//   }
// } )();