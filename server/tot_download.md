#TODO list per nuova feature download:

- da far scaricare, una volta selexionato il run (dir runs/YYYY/MM/DD):

    - popolazione: output_pop.csv
    
    - geotif model: merge di tutte le tiff della directory images/wd
    
    - geotif eo: merge di tutte le tiff della directory images/eo
        
    - geotif eo/model: merge di tutte le tiff della directory images/compare_eo_wd

    - altri dati in Work/YYYY-MM-DD (attenzione che prob in giorno è quello successivo alla data di run in quanto è la data di esecuzione dello script che calcola il run del girono precedente):

        - tutti i files csv della direcotry 

        - YYYY-MM-DD_sentinel_max_clean.tif ????? verificare se serve

        - files .log ????? verificare se serve

    - altri dati in Input: verificare con Rudari cosa fargli scaricare e preprare degli zip già pronti da far selezionare all'utente






il merge avviene con il sequente comando (valutare se farlo in python): 

    gdal_merge.py -init 255 -n 255 -co "COMPRESS=DEFLATE" -o eo_wd.tif compare_eo_wd/*


il download dei geotiff eo, model e comp deve essere fatto per paese. Bisogna fare la profilazione per paese se non esiste già

nella landing page (non loggato) visualizzare il dato model