/*
 *    GeoTools - The Open Source Java GIS Toolkit
 *    http://geotools.org
 *
 *    (C) 2002-2010, Open Source Geospatial Foundation (OSGeo)
 *
 *    This library is free software; you can redistribute it and/or
 *    modify it under the terms of the GNU Lesser General Public
 *    License as published by the Free Software Foundation;
 *    version 2.1 of the License.
 *
 *    This library is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *    Lesser General Public License for more details.
 */
package gov.nasa.worldwind.geopkg.mosaic;

import gov.nasa.worldwind.geopkg.mosaic.OgcGeoPackageFormat;
import org.geotools.coverage.grid.io.AbstractGridFormat;
import org.geotools.geopkg.mosaic.GeoPackageFormatFactorySpi;

/**
 *
 * @author Bruce Schubert
 */
public class OgcGeoPackageFormatFactorySpi extends GeoPackageFormatFactorySpi {
    
    @Override
    public AbstractGridFormat createFormat() {
        return new OgcGeoPackageFormat();
    }    
}
