package it.cnr.ibimet.entities;

import java.io.Serializable;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.GregorianCalendar;

/**
 * Created by lerocchi on 01/09/17.
 *
 *
 * SatelliteRaster entity
 */
public class SatelliteRaster implements Serializable {

    private int id_acquisizione;
    private GregorianCalendar dtime;
    private String year;
    private String month;
    private String day;
    private String datstr;

    public int getId_acquisizione() {
        return id_acquisizione;
    }

    public void setId_acquisizione(int id_acquisizione) {
        this.id_acquisizione = id_acquisizione;
    }

    public GregorianCalendar getDtime() {
        return dtime;
    }

    public void setDtime(GregorianCalendar dtime) {
        this.dtime = dtime;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public String getDatstr() {
        return datstr;
    }

    public void setDatstr(String datstr) {
        this.datstr = datstr;
    }

    public SatelliteRaster(int id_acquisizione,
                           GregorianCalendar dtime){

        this.id_acquisizione = id_acquisizione;
        this.dtime = dtime;

        this.year = ""+dtime.get(Calendar.YEAR);
        this.month = ""+(dtime.get(Calendar.MONTH) + 1);
        this.day = ""+dtime.get(Calendar.DAY_OF_MONTH);
        SimpleDateFormat formatter=new SimpleDateFormat("dd-MM-yyyy");
        this.datstr = formatter.format( this.dtime.getTime() );
    }



}
