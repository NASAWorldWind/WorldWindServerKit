<img src="https://worldwind.arc.nasa.gov/css/images/nasa-logo.svg" height="100"/> 

# WorldWind Server Kit (WWSK)
## WorldWind LayerGroup GetMapCallback (worldwind-gs-layergroup-getmapcallback)

This module implements a GetMapCallback that culls layers from GetMap requests 
that are outside the request's bbox.

* It resolves an "null bbox" IllegalArgumentException issue 
