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
package gov.nasa.worldwind.gs.explorer;

import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.request.flow.RedirectToUrlException;
import org.geoserver.web.GeoServerBasePage;

/**
 * The WWSKExplorerPage class manifests the "Explorer" entry in the WWSK
 * category and the page itself redirects to the Explorer web app.
 *
 * See the following for information on adding UI components to GeoServer:
 * http://docs.geoserver.org/latest/en/developer/programming-guide/web-ui/implementing.html
 * http://docs.geoserver.org/latest/en/developer/programming-guide/wicket-pages/index.html
 *
 * @author Bruce Schubert
 */
public class WWSKExplorerPage extends GeoServerBasePage {

    public WWSKExplorerPage() {
        throw new RedirectToUrlException("/explorer/index.html");
    }

}
