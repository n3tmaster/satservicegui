package it.cnr.ibimet.backingbeans;

import it.cnr.ibimet.dbutils.TDBManager;
import it.cnr.ibimet.entities.SatelliteRaster;
import it.cnr.ibimet.entities.SatelliteRasterModel;
import org.primefaces.context.RequestContext;
import org.primefaces.model.DefaultStreamedContent;
import org.primefaces.model.StreamedContent;


import javax.annotation.PostConstruct;

import javax.faces.application.FacesMessage;
import javax.faces.bean.ManagedBean;

import javax.faces.bean.ViewScoped;
import javax.faces.context.FacesContext;

import java.io.InputStream;
import java.io.Serializable;
import java.net.URL;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.List;

/**
 * Created by lerocchi on 01/09/17.
 */
@ManagedBean(name="imageList")
@ViewScoped
public class ImageList implements Serializable {

    private final String NONE = "none;";
    private final String BLOCK = "block;";
    private final String NDVI_RES = "resources/images/ndvi.png";
    private final String YELD_RES = "resources/images/yeld.png";
    private final String NITRO_RES = "resources/images/nitro.png";



    private boolean toolDisabled;
    private String imgType,concAzot;
    private Double nitroEttaro;
    private List<SatelliteRaster> satelliteRasterlist;
    private SatelliteRaster selectedSatelliteRaster;
    private GregorianCalendar gc;

    private String azotEttaroDisplay, potenzialeDisplay, legendOut;



    public String getImgType() {
        return imgType;
    }

    public void setImgType(String imgType) {
        this.imgType = imgType;
    }

    //	private MobileStation mobileStationSelezionato;
    public GregorianCalendar getGc() {
        return gc;
    }

    public String getPotenzialeDisplay() {
        return potenzialeDisplay;
    }

    public void setPotenzialeDisplay(String potenzialeDisplay) {
        this.potenzialeDisplay = potenzialeDisplay;
    }

    public void setGc(GregorianCalendar gc) {
        this.gc = gc;
    }

    private SatelliteRasterModel satelliteRasterModel;

    public String getLegendOut() {
        return legendOut;
    }

    public void setLegendOut(String legendOut) {
        this.legendOut = legendOut;
    }

    public String getConcAzot() {
        return concAzot;
    }

    public void setConcAzot(String concAzot) {
        this.concAzot = concAzot;
    }

    public boolean isToolDisabled() {
        return toolDisabled;
    }

    public void setToolDisabled(boolean toolDisabled) {
        this.toolDisabled = toolDisabled;
    }

    public String getAzotEttaroDisplay() {
        return azotEttaroDisplay;
    }

    public void setAzotEttaroDisplay(String azotEttaroDisplay) {
        this.azotEttaroDisplay = azotEttaroDisplay;
    }

    public Double getNitroEttaro() {
        return nitroEttaro;
    }

    public void setNitroEttaro(Double nitroEttaro) {
        this.nitroEttaro = nitroEttaro;
    }

    public List<SatelliteRaster> getSatelliteRasterlist() {
        return satelliteRasterlist;
    }

    public void setSatelliteRasterlist(List<SatelliteRaster> satelliteRasterlist) {
        this.satelliteRasterlist = satelliteRasterlist;
    }

    public SatelliteRaster getSelectedSatelliteRaster() {
        return selectedSatelliteRaster;
    }

    public void setSelectedSatelliteRaster(SatelliteRaster selectedSatelliteRaster) {
        this.selectedSatelliteRaster = selectedSatelliteRaster;
    }

    public SatelliteRasterModel getSatelliteRasterModel() {
        return satelliteRasterModel;
    }

    public void setSatelliteRasterModel(SatelliteRasterModel satelliteRasterModel) {
        this.satelliteRasterModel = satelliteRasterModel;
    }



    @PostConstruct
    public void init(){
        System.out.println("SatelliteRasterBean - init");

        selectedSatelliteRaster=new SatelliteRaster(0, new GregorianCalendar());
        imgType = "rgb";
        concAzot= "1";


        azotEttaroDisplay = NONE;
        potenzialeDisplay = NONE;
        legendOut = NDVI_RES;


        gc = new GregorianCalendar();


        //check if date is between 1 October and 30 june
        Calendar now = new GregorianCalendar();
        Calendar startC = new GregorianCalendar(now.get(Calendar.YEAR), Calendar.OCTOBER, 1);
        Calendar endC = new GregorianCalendar((now.get(Calendar.YEAR)+1), Calendar.JUNE, 30);


        if(now.compareTo(startC) >= 0 && now.compareTo(endC) <=30){

            this.toolDisabled=false;
        }else{

            this.toolDisabled=true;
        }


        nitroEttaro = new Double(0);

        nitroEttaro = 0.0;
        //TODO: da eliminare in produzione
        this.toolDisabled = false;
        this.azotEttaroDisplay = BLOCK;
        //******

        populateRasterList();

        RequestContext.getCurrentInstance().execute("initJS()");

        //set js parameters
        changeParams();
    }

    /**
     * Populate the list containing supplied raster by the GeoDB
     *
     */
    public void populateRasterList(){
        TDBManager dsm=null;
        try {



            dsm = new TDBManager("jdbc/ssdb");

            //giardino=idgiardini.get(0);
            System.out.println("imageListBean - populateRaster - connected");


            String sqlString="select id_acquisizione, dtime " +
                    "from postgis.acquisizioni " +
                    "order by dtime desc";



            dsm.setPreparedStatementRef(sqlString);
            dsm.runPreparedQuery();

            satelliteRasterlist = new ArrayList<SatelliteRaster>();


            while(dsm.next()){

                this.satelliteRasterlist.add(new SatelliteRaster(dsm.getInteger(1),dsm.getData(2)));
            }

            if(satelliteRasterlist.size()>0){
                this.satelliteRasterModel = new SatelliteRasterModel(this.satelliteRasterlist);
                this.selectedSatelliteRaster = this.satelliteRasterlist.get(0);
            }


        } catch (Exception e) {

            e.printStackTrace();
        } finally{
            try{
                dsm.closeConnection();
            }catch(Exception e){
                e.getStackTrace();
            }
        }

    }
    /**
     * callback function that fires Javascript func, calcNitroPotentialYeldJS in order to run postgresql procedure and calculate Nitro Potential Yeld
     */
    public void calcPotentialYeld(){

        this.legendOut = YELD_RES;
        RequestContext.getCurrentInstance().execute("calcPotentialYeld()");

    }

    /**
     * callback function that fires Javascript func, calcNitroPotentialYeldJS in order to run postgresql procedure and calculate Nitro Potential Yeld
     */
    public void calcNitroPotentialYeld(){

        System.out.println("ecco: "+nitroEttaro);

        this.legendOut = NITRO_RES;
        RequestContext.getCurrentInstance().execute("calcNitroPotentialYeldJS("+nitroEttaro+")");

    }

    /**
     * callback function that fires Javascript func, changeParamsJS, in order to set parameters for client side gis operations
     */
    public void changeParams(){

        this.legendOut = NDVI_RES;
        RequestContext.getCurrentInstance().execute("changeParamsJS('"+imgType+"','"+selectedSatelliteRaster.getYear()+"','"+selectedSatelliteRaster.getMonth()+"','"+selectedSatelliteRaster.getDay()+"')");
        RequestContext.getCurrentInstance().execute("changeImageJS()");

    }


    public void changeAzotParams(){
        if(this.concAzot.matches("1")){
            this.azotEttaroDisplay = BLOCK;
            this.potenzialeDisplay = NONE;


        }else{
            this.azotEttaroDisplay = NONE;
            this.potenzialeDisplay = BLOCK;

        }


    }

    /**
     * callback function that fires Javascript func download image
     */
    public void downloadNitroImage(){

        System.out.println("ecco: "+nitroEttaro);
        RequestContext.getCurrentInstance().execute("downloadNitroYeld("+nitroEttaro+")");

    }


    /**
     * callback function that fires Javascript func download image
     */
    public void downloadPotYeldImage(){

        RequestContext.getCurrentInstance().execute("downloadPotYeld()");

    }


    /**
     * callback function that fires Javascript func download image
     */
    public void downloadNDVIImage(){

        RequestContext.getCurrentInstance().execute("downloadNDVI()");

    }

}
