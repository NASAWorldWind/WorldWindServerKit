/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package gov.nasa.worldwind.gs.wms.map;

import java.util.Optional;
import org.geoserver.platform.ModuleStatus;
import org.geotools.factory.GeoTools;
import org.geotools.util.Version;

/**
 * Report status of the WorldWind GeoPackage extensions.
 *
 * @author Bruce Schubert
 */
public class WmsModuleStatus implements ModuleStatus {

    /**
     * Module identifier based on artifact bundle Example: <code>gs-main</code>,
     * <code>gs-oracle</code>
     */
    @Override
    public String getModule() {
        return "worldwind-gs-wms";
    }

    /**
     * Optional component identifier within module. Example:
     * <code>rendering-engine</code>
     */
    @Override
    public Optional<String> getComponent() {
        return Optional.ofNullable("CustomRenderedImageMapOutputFormat");
    }

    /**
     * Human readable name as defined in the extension pom.xml, ie. <name>ArcSDE DataStore Extensions</name>
     */
    @Override
    public String getName() {
        return "WorldWind GeoServer WMS Module";
    }

    /**
     * Human readable version, ie. for geotools it would be 15-SNAPSHOT
     */
    @Override
    public Optional<String> getVersion() {
        Version v = GeoTools.getVersion(WmsModuleStatus.class);
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
        msg.append("A custom Web Map Service module for GeoServer that provides\n"
                + "specialized handling of JPEG image formats.");

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
