#!/bin/bash
##
## wms_tile_request_zoom.py
## -count	        Number of requests to generate (default=100)
## -region	        Bounding box: <minx> <miny> <maxx> <maxy> (negative values must quoted)
## -minlevel	    Minimum zoom level (zero based)
## -maxlevel	    Maximum zoom level (zero based)
## -tilesize        Tile size in pixels: <width> <height> (default=256,256)
## -level0          columns and rows in level 0: <columns> <rows> (default=2,1)
## -srs             Source coordinate reference system (default=4326)
## -srs2            Output coordinate reference system (optional)
## -filter_within   Name of the file containing geometries to filter out (optional)
## -output          Name of the output file (default=<srs>.csv)
## -output2         Name of the output file (default=<srs2>.csv)
##
## Example: Generate 1000 WMS tile requests in CSV format around Ventura, CA
##  python wms_tile_request_zoom.py -count 1000 -region "-120" 34 "-119" 35 -minlevel 0 -maxlevel 23 -output ventura_4326.csv
##
## Example: World Wind Java WMS tile requests
##  python wms_tile_request_zoom.py -count 1000 -region "-120" 34 "-119" 35 -level0 10 5  -minlevel 0 -maxlevel 23 -output ventura_wwj.csv
##
#python  wms_tile_request_zoom.py -count 100 -region "-120" 30 "-110" 40  -minlevel 7 -maxlevel 12 -output psw_7-12_4326_zoom.csv
#python  wms_tile_request_zoom.py -count 5000 -region 7.5 47.5 11 48.5  -minlevel 13 -maxlevel 17 -output desw_13-17_4326_zoom.csv
#python  wms_tile_request_zoom.py -count 5000 -region 7.5 47.5 11 48.5  -minlevel 13 -maxlevel 19 -output desw_13-19_4326_zoom.csv
python  wms_tile_request_zoom.py -count 5000 -region "-106.6" 31.6 "-105.6" 32.6 -minlevel 10 -maxlevel 19 -output ft_biggs_10-19_4326_zoom.csv