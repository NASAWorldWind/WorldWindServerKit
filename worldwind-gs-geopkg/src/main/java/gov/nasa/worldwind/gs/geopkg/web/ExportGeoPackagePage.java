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

import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.ajax.markup.html.form.AjaxSubmitLink;
import org.apache.wicket.markup.html.form.Form;
import org.geoserver.web.GeoServerSecuredPage;

/**
 *
 * @author Bruce Schubert
 */
public class ExportGeoPackagePage extends GeoServerSecuredPage {

    public ExportGeoPackagePage() {

        // Create the form
        Form form = new Form("form");
        add(form);

        // Setup the Execute button
        form.add(new AjaxSubmitLink("executeProcess") {

            @SuppressWarnings("unchecked")
            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
//                responseWindow.setDefaultModel(new Model(getRequestXML()));
//                responseWindow.show(target);
            }

            @Override
            protected void onError(AjaxRequestTarget target, Form form) {
//                super.onError(target, form);
//                target.add(builder.getFeedbackPanel());
            }
        });

        // Setup the Show XML button
        form.add(new AjaxSubmitLink("executeXML") {

            @Override
            protected void onSubmit(AjaxRequestTarget target, Form form) {
                try {
//                    getRequestXML();
//                    xmlWindow.show(target);
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

}
