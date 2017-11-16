Richiesta img per data (Istr. leandro 26/10/2017)
---

La funzione la chiami con una get diretta a:

    http://149.139.16.54:8080/ssws/api/download/j_find_raster_elements?

I parametri per la query string sono:

- srid (metti sempre 3857)
- srid_to (metti sempre 4326)
- polygon: qui metti il poligono in formato standard well known text (‘POLYGON((coords…))’);

il risultato è un json array con le date disponibili, nel caso non ci sia niente ritorna un array vuoto

Esempio richiesta:

    http://149.139.16.54:8080/ssws/api/download/j_find_raster_elements?srid=3857&srid_to=4326&polygon=POLYGON(( 1771529.9029592397 5075527.442109404,1773889.8962075445 5074323.558913913,1774128.7619209355 5073970.0376580935,1772456.7019271974 5073731.171944703,1771281.4826173128 5073501.860859848,1770927.961361494 5073931.819143951,1771396.1381597405 5074228.012628556,1771529.9029592397 5075527.442109404,1771529.9029592397 5075527.442109404))

Rsiposta:

    [
      {"data":"2017-07-07"},
      {"data":"2017-04-08"},
      {"data":"2017-08-16"},
      {"data":"2017-05-18"},
      {"data":"2017-03-29"},
      {"data":"2017-02-27"},
      {"data":"2017-03-09"},
      {"data":"2016-12-09"},
      {"data":"2017-09-16"}
    ]