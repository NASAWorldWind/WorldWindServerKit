/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gov.nasa.worldwind.gs.geopkg;

import java.util.Optional;
import org.geoserver.platform.ModuleStatus;
import org.geotools.factory.GeoTools;
import org.geotools.util.Version;

/**
 * Report status of the WorldWind GeoPackage extensions.
 *
 * @author Bruce Schubert
 */
public class GeoPackageModuleStatus implements ModuleStatus {

    /**
     * Module identifier based on artifact bundle Example: <code>gs-main</code>,
     * <code>gs-oracle</code>
     */
    @Override
    public String getModule() {
        return "worldwind-gs-geopkg";
    }

    /**
     * Optional component identifier within module. Example:
     * <code>rendering-engine</code>
     */
    @Override
    public Optional<String> getComponent() {
        return Optional.ofNullable("GeoPackageReader");
    }

    /**
     * Human readable name (from GeoServer documentation), or as defined in the
     * extension pom.xml, ie. <name>ArcSDE DataStore Extensions</name>
     */
    @Override
    public String getName() {
        return "WorldWind GeoPackage Extension";
    }

    /**
     * Human readable version, ie. for geotools it would be 15-SNAPSHOT
     */
    @Override
    public Optional<String> getVersion() {
        Version v = GeoTools.getVersion(GeoPackageModuleStatus.class);
        if (v == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(v.toString());
    }

    /**
     * Returns whether the module is available to GeoServer
     */
    @Override
    public boolean isAvailable() {
        return true;
    }

    /**
     * Returns whether the module is enabled in the current GeoServer
     * configuration.
     */
    @Override
    public boolean isEnabled() {
        return true;
    }

    /**
     * Optional status message such as what Java rendering engine is in use, or
     * the library path if the module/driver is unavailable
     */
    @Override
    public Optional<String> getMessage() {
        StringBuffer msg = new StringBuffer();
        msg.append("A GeoServer extension providing GeoPackage support with conformance\n"
                + "to the National System for Geospatial-Intelligence (NSG) GeoPackage\n"
                + "Encoding Standard 2.0 Interoperability Standard.\n"
                + "NGA.STND.0051_2.0_GEOPKG 2016-09-14\n");
        msg.append("\nCore Dependencies");
        msg.append("\n=================");
        msg.append("\nWorldWind GeoPackage Module: worldwind-gt-geopkg");
        msg.append("\nWorldWind GeoServer WMS Module: worldwind-gs-wms");
        return Optional.ofNullable(msg.toString());
    }

    /**
     * Optional relative link to GeoServer user manual
     */
    @Override
    public Optional<String> getDocumentation() {
        return Optional.ofNullable("");
    }

}
