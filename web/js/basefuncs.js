/**
 * Created by lerocchi on 17/05/17.
 */

//Global variables
var draw;
var map;
var source4Interaction;
var extractedImage;  //keeps extracted image
var interaction;  //keeps activated interaction
var polygonText; //keeps WKT Polygon created by user
var imgtype;     //keeps image type
var year;
var month;
var day;
var boxExtent;   //box extent used for re-create extent for loaded images

var imgLoaded;

var poygonIsDrawed;
//

/**
 * Methods for interaction management
 */


//Activate pan
function activatePan(){


    //remove previous interaction
    map.removeInteraction(interaction);
    interaction = new ol.interaction.DragPan();
    map.addInteraction(interaction);

}


//Set parameters for client side GIS functions
//This method is called by java bean
function changeParamsJS(imgt,yeart,montht,dayt){


    imgtype = imgt;
    year = yeart;
    month = montht;
    day = dayt;


}

//Call REST service for calculating nitro potential yeld
//this func may be called by java bean or with other ways
function calcNitroPotentialYeldJS(nitroIn){
    if(imgLoaded) {

        map.removeLayer(extractedImage);

        //create new imageStatic
        extractedImage = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                title: 'extracted raster',
                attributions: 'extracted raster',
                url: 'http://149.139.16.54:8080/ssws/api/download/j_calc_nitro_yeld?nitro='+nitroIn +'&year=' + year + '&month=' + month + '&day=' + day + '&table_name=ndvi&srid=3857&srid_to=4326&streamed=1&polygon=' + polygonText,
                imageExtent: boxExtent
            })
        });

        map.addLayer(extractedImage);
    }
}


//Call REST service for calculating potential yeld
//this func may be called by java bean or with other ways
function calcPotentialYeld(){
    if(imgLoaded) {

        map.removeLayer(extractedImage);

        //create new imageStatic
        extractedImage = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                title: 'extracted raster',
                attributions: 'extracted raster',
                url: 'http://149.139.16.54:8080/ssws/api/download/j_calc_potential_yeld?year=' + year + '&month=' + month + '&day=' + day + '&table_name=ndvi&srid=3857&srid_to=4326&streamed=1&polygon=' + polygonText,
                imageExtent: boxExtent
            })
        });

        map.addLayer(extractedImage);
    }
}

//function to inizialize imgLoaded flag
function initJS(){
    imgLoaded = false;
}

//change loaded image with another one by selecting new reference date or type
function changeImageJS(){

    if(imgLoaded) {

        map.removeLayer(extractedImage);

        //create new imageStatic
        extractedImage = new ol.layer.Image({
            source: new ol.source.ImageStatic({
                title: 'extracted raster',
                attributions: 'extracted raster',
                url: 'http://149.139.16.54:8080/ssws/api/download/j_extract_' + imgtype + '?year=' + year + '&month=' + month + '&day=' + day + '&table_name=ndvi&srid=3857&srid_to=4326&streamed=1&polygon=' + polygonText,
                imageExtent: boxExtent
            })
        });

        map.addLayer(extractedImage);
    }
}

function downloadNDVI(){

    window.open("http://149.139.16.54:8080/ssws/api/download/j_download_ndvi?year=" + year + "&month=" + month +
        "&day=" + day + "&table_name=ndvi&srid=3857&srid_to=4326&streamed=0&polygon=" + polygonText, "_blank");

}

function downloadPotYeld(){

    window.open("http://149.139.16.54:8080/ssws/api/download/j_download_potential_yeld?year=" + year + "&month=" + month +
        "&day=" + day + "&table_name=ndvi&srid=3857&srid_to=4326&streamed=0&polygon=" + polygonText, "_blank");

}

function downloadNitroYeld(nitroIn){

    window.open("http://149.139.16.54:8080/ssws/api/download/j_download_nitro_yeld?nitro="+nitroIn+"&year=" + year + "&month=" + month +
        "&day=" + day + "&table_name=ndvi&srid=3857&srid_to=4326&streamed=0&polygon=" + polygonText, "_blank");

}

//activate draw polygon function
function activatePolygon(){



    //remove previous interaction
    map.removeInteraction(interaction);
    interaction = new ol.interaction.Draw({
        type: /** @type {ol.geom.GeometryType} */ ('Polygon')
    });


    //clean previous vector and raster when dragbox started
    interaction.on('drawstart',function(evt){
        //Clean previous vector feature and extracted image

        source4Interaction.clear();
        map.removeLayer(extractedImage);

    });


    interaction.on('drawend',function(evt){

        var feat = evt.feature;
        var geom = feat.getGeometry();
        var coords = " " +  geom.getCoordinates()[0];

        var coordsArr = coords.replace("["," ");
        coordsArr = coordsArr.replace("]"," ");
        coordsArr = coordsArr.split(",");




        var featIn = new ol.Feature({
            geometry: geom
        });


        source4Interaction.addFeature(featIn);   //Add new feature to vector source

        //build WKT Polygon
        polygonText = "POLYGON((";
        boxExtent = geom.getExtent();


        for (var i =  0; i < coordsArr.length; i=i+2){


            polygonText = polygonText + coordsArr[i] + " " + coordsArr[i+1] + ",";
        }


        polygonText = polygonText + coordsArr[0] + " " + coordsArr[1] + "))";


        //create new imageStatic
        extractedImage = new ol.layer.Image({
            source:  new ol.source.ImageStatic({
                title: 'extracted raster',
                attributions: 'extracted raster',
                url: 'http://149.139.16.54:8080/ssws/api/download/j_extract_'+ imgtype +'?year='+ year +'&month='+ month +'&day=' + day + '&table_name=ndvi&srid=3857&srid_to=4326&streamed=1&polygon=' + polygonText,
                imageExtent: boxExtent
            })
        });


        map.addLayer(extractedImage);

        imgLoaded = true;

    });

    map.addInteraction(interaction);

}




/**
 * Initialization of Map object
 *
 */
function init(){
    document.removeEventListener('DOMContentLoaded', init);


    //Define sources for boxes and images
    source4Interaction = new ol.source.Vector();


    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                title: 'base map',
                source: new ol.source.BingMaps({
                    key: 'AiwTFAC5m-x0QAClwpZU23k6WDjHrh8i_cPIoFla4bNC9NrMlT9gK_tMrZbzFBS9',
                    imagerySet: 'Aerial'

                })

            }),



            new ol.layer.Vector({
                source: source4Interaction   //manage designed boxes
            })



        ],
        controls: [


            //Define some new controls
            new ol.control.MousePosition({
                coordinateFormat: function (coordinates) {
                    var coord_x = coordinates[0].toFixed(3);
                    var coord_y = coordinates[1].toFixed(3);
                    return coord_x + ', ' + coord_y;
                },
                target: 'coordinates'
            })
        ],

        view: new ol.View({
            center: ol.proj.transform([15.00, 41.00],'EPSG:4326', 'EPSG:3857'),

            zoom: 10
        }),


    });
    map.addControl(new ol.control.ZoomSlider());




}


document.addEventListener('DOMContentLoaded',init);


