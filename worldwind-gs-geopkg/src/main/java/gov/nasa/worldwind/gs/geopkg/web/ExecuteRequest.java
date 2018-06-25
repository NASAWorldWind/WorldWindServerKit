/*
 * Copyright (C) 2017 NASA World Wind
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */
package gov.nasa.worldwind.gs.geopkg.web;

import org.geotools.geopkg.wps.GeoPackageProcessRequest;
import java.io.Serializable;

/**
 * A simple POD object that holds the properties used to build and Export
 * GeoPackage WPS request.
 *
 */
public class ExecuteRequest implements Serializable {

    private static final long serialVersionUID = 1L;
    
    private String requestFileName;
    private String requestUrl;
    private String requestBody;
    private String userName;
    private String password;
   
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRequestFileName() {
        return requestFileName;
    }

    public void setRequestFileName(String requestFileName) {
        this.requestFileName = requestFileName;
    }

    public String getRequestUrl() {
        return requestUrl;
    }

    public void setRequestUrl(String requestUrl) {
        this.requestUrl = requestUrl;
    }

    public String getRequestBody() {
        return requestBody;
    }

    public void setRequestBody(String requestBody) {
        this.requestBody = requestBody;
    }

}
