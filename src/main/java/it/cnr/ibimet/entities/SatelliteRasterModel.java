package it.cnr.ibimet.entities;

import org.primefaces.model.SelectableDataModel;

import javax.faces.model.ListDataModel;
import java.util.List;

/**
 * Created by lerocchi on 01/09/17.
 */


public class SatelliteRasterModel extends ListDataModel<SatelliteRaster> implements SelectableDataModel<SatelliteRaster> {




    public SatelliteRasterModel(List<SatelliteRaster> data){
        super(data);
    }



    public SatelliteRaster getRowData(String rowKey) {
        List<SatelliteRaster> zone = (List<SatelliteRaster>) getWrappedData();

        for(SatelliteRaster zona : zone){
            String aaa = ""+zona.getId_acquisizione();

     //       System.out.println("aaa: "+aaa);
            if(aaa.equals(rowKey))
                return zona;
        }

        return null;
    }


    public Object getRowKey(SatelliteRaster zona) {
     //   System.out.println("zona: "+zona.getId_acquisizione());
        return zona.getId_acquisizione();
    }

}




