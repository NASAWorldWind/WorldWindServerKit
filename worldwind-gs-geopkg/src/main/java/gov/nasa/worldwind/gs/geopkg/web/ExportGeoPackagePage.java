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

import java.util.Collections;
import javax.servlet.http.HttpServletRequest;
import org.apache.wicket.Page;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.ajax.markup.html.form.AjaxSubmitLink;
import org.apache.wicket.extensions.ajax.markup.html.modal.ModalWindow;
import org.apache.wicket.markup.html.form.Form;
import org.apache.wicket.model.Model;
import org.geoserver.ows.URLMangler;
import org.geoserver.ows.util.ResponseUtils;
import org.geoserver.web.GeoServerSecuredPage;

/**
 *
 * @author Bruce Schubert
 */
public class ExportGeoPackagePage extends GeoServerSecuredPage {

    // The output response window
    ModalWindow responseWindow;

    /**
     * Default constructor
     */
    public ExportGeoPackagePage() {

        // Create the form
        Form form = new Form("form");
        add(form);

        // Setup the XML popup window
        final ModalWindow xmlWindow = new ModalWindow("xmlWindow");
        add(xmlWindow);
        xmlWindow.setPageCreator(new ModalWindow.PageCreator() {

            public Page createPage() {
                return new XmlPage(xmlWindow, responseWindow, getRequestXML());
            }
        });

        // Setup the output response window
        responseWindow = new ModalWindow("responseWindow");
        add(responseWindow);
        responseWindow.setPageCreator(new ModalWindow.PageCreator() {

            @SuppressWarnings("unchecked")
            public Page createPage() {
                ExportRequest request = new ExportRequest(null);
                HttpServletRequest http = (HttpServletRequest) ExportGeoPackagePage.this.getRequest().getContainerRequest();
                String url = ResponseUtils.buildURL(ResponseUtils.baseURL(http), "ows", Collections
                        .singletonMap("strict", "true"), URLMangler.URLType.SERVICE);
                request.setRequestUrl(url);
                request.setRequestBody((String) responseWindow.getDefaultModelObject());
//                request.setUserName(builder.username);
//                request.setPassword(builder.password);
                return new ExportRequestResponse(new Model(request));
            }
        });

        // Setup the Execute button
        form.add(new AjaxSubmitLink("executeProcess") {

            @SuppressWarnings("unchecked")
            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
                responseWindow.setDefaultModel(new Model(getRequestXML()));
                responseWindow.show(target);
            }

            @Override
            protected void onError(AjaxRequestTarget target, Form form) {
                super.onError(target, form);
//                target.add(builder.getFeedbackPanel());
                target.add(getFeedbackPanel());
            }
        });

        // Setup the Show XML button
        form.add(new AjaxSubmitLink("executeXML") {

            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
                try {
                    getRequestXML();
                    xmlWindow.show(target);
                } catch (Exception e) {
                    error(e.getMessage());
                    target.add(getFeedbackPanel());
                }
            }

            @Override
            protected void onError(AjaxRequestTarget target, Form form) {
                target.add(getFeedbackPanel());
            }
        });

    }

    String getRequestXML() {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><wps:Execute version=\"1.0.0\" service=\"WPS\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns=\"http://www.opengis.net/wps/1.0.0\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:wps=\"http://www.opengis.net/wps/1.0.0\" xmlns:ows=\"http://www.opengis.net/ows/1.1\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:wcs=\"http://www.opengis.net/wcs/1.1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xsi:schemaLocation=\"http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd\">\n"
                + "    <ows:Identifier>gs:GeoPackage</ows:Identifier>\n"
                + "    <wps:DataInputs>\n"
                + "        <wps:Input>\n"
                + "            <ows:Identifier>contents</ows:Identifier>\n"
                + "            <wps:Data>\n"
                + "                <wps:ComplexData mimeType=\"text/xml; subtype=geoserver/geopackage\">\n"
                + "                    <geopackage xmlns=\"http://www.opengis.net/gpkg\" name=\"worldtopobathy\">\n"
                + "                        <tiles identifier=\"L01\" name=\"world-bbox\">\n"
                + "                            <description>World terrain and bathometry</description>\n"
                + "                            <srs>EPSG:4326</srs>\n"
                + "                            <bbox>\n"
                + "                                <minx>-180</minx>\n"
                + "                                <miny>-90</miny>\n"
                + "                                <maxx>180</maxx>\n"
                + "                                <maxy>90</maxy>\n"
                + "                            </bbox>\n"
                + "                            <coverage>\n"
                + "                                <minZoom>0</minZoom>\n"
                + "                                <maxZoom>4</maxZoom>\n"
                + "                            </coverage>\n"
                + "                            <layers>test:world</layers>\n"
                + "                            <styles>raster</styles>\n"
                + "                        </tiles>\n"
                + "                        <tiles identifier=\"L02\" name=\"usa-bbox\">\n"
                + "                            <description>USA terrain and bathometry</description>\n"
                + "                            <srs>EPSG:4326</srs>\n"
                + "                            <bbox>\n"
                + "                                <minx>-171.791111</minx>\n"
                + "                                <miny>18.91619</miny>\n"
                + "                                <maxx>-66.96466</maxx>\n"
                + "                                <maxy>71.357764</maxy>\n"
                + "                            </bbox>\n"
                + "                            <coverage>\n"
                + "                                <minZoom>0</minZoom>\n"
                + "                                <maxZoom>4</maxZoom>\n"
                + "                            </coverage>\n"
                + "                            <layers>test:world</layers>\n"
                + "                            <styles>raster</styles>\n"
                + "                        </tiles>\n"
                + "                    </geopackage>\n"
                + "                </wps:ComplexData>\n"
                + "            </wps:Data>\n"
                + "        </wps:Input>\n"
                + "    </wps:DataInputs>\n"
                + "    <wps:ResponseForm>\n"
                + "        <wps:RawDataOutput>\n"
                + "            <ows:Identifier>geopackage</ows:Identifier>\n"
                + "        </wps:RawDataOutput>\n"
                + "    </wps:ResponseForm>\n"
                + "</wps:Execute>";
        return xml;
    }

}
