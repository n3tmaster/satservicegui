/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package it.cnr.ibimet.dbutils;

/**
 * Costanti utilizzate dal progetto per la configurazione della webApp
 * @author lerocchi
 */
public interface SWH4EConst {



    //Costanti per la gestione dei dati RASTER

    //costanti per la gestione delle tipologie di poligoni
    String POLYGON_T = "POLYGON";
    String MULTIPOLYGON_T = "MULTIPOLYGON";
    String LINE_T = "LINE";
    String MULTILINESTRING="MULTILINESTRING";
    String POINT_T = "POINT";
    String MULTIPOINT_T = "MULTIPOINT";




    //Costanti per la mappa
    double CENTER_X=-15.5676173;
    double CENTER_Y=12.9126752;
    int ZOOMFACTOR=9;
    int PRECISION = 5;




    String GET_LAYER_TYPE = "select srid, type from geometry_columns where f_table_name=?";


    String THE_GEOM_COLUMN = "the_geom";
    String GID = "gid";
    String DATA_TYPE_INTEGER="integer";
    String DATA_TYPE_NUMERIC="numeric";
    String DATA_TYPE_DOUBLE_PRECISION = "double precision";
    String DATA_TYPE_TIMESTAMP = "timestamp without time zone";
    String DATA_TYPE_TIMESTAMP_WT = "timestamp with time zone";

    String DATA_TYPE_STRING = "character varying";
    String TIME_STAMP_YES = "1";
    String TIME_STAMP_NO = "0";
    String VECTOR_TYPE_YES = "1";
    String VECTOR_TYPE_NO = "0";


    //Costanti per i moduli della piattaforma
    String MODULE_MOBILES = "MOBILES";

    //Costanti per la gestione delle meta-informazioni del db

    String DB_ENTITY = "ENTITY"; //entita generiche
    String DB_STATION = "STATION";
    String DB_DATA = "NORMAL";
    String DB_GEO = "GEO";




    String BLOCK_STR = "block;";
    String NONE_STR = "none;";

    int TILE_LENGTH = 30;

    //email list
    //TODO: Da cambiare appena possibile
    String EMAILFROM = "lerocchi@gmail.com";
    String EMAILTO = "l.rocchi@ibimet.cnr.it";


}
