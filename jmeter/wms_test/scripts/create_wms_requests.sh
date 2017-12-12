#!/bin/bash
#
## wms_request.py
## -count           Number of requests to generate (default=100)
## -region          Bounding box: <minx> <miny> <maxx> <maxy> (negative values must quoted)
## -minres          Minimum resolution 
## -maxres          Maximum resolution 
## -minsize         Minimum width and height: <width> <height> (default=128,128)
## -maxsize         Minimum width and height: <width> <height> (default=1024,768)
## -srs             Source coordinate reference system (default=4326)
## -srs2            Output coordinate reference system (optional)
## -filter_within   Name of the file containing geometries to filter out (optional)
## -output_file     Name of the output file (default=<srs>.csv)
## -output_file2    Name of the output file (default=<srs2>.csv)
##
## Example: Generate 1000 WMS requests in CSV format around Ventura, CA
##  python wms_request.py -count 1000 -region -120 34 -119 35 - -output ventura.csv
##
#
python  wms_request.py -count 100 -region "-120" 30 "-110" 40  -minres 0.0001 -maxres .0002 -output psw_7-12_random.csv