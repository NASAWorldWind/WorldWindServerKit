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

import org.apache.wicket.model.Model;
import org.geoserver.web.GeoServerWicketTestSupport;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Bruce Schubert
 */
public class ResponsePageTest extends GeoServerWicketTestSupport {
    
    public ResponsePageTest() {
    }

    /**
     * Smoke test to make sure the page structure was correctly set up.
     */
    @Test
    public void testStructure() {
        // Opening the selected page using the WicketTester 
        tester.startPage(new ResponsePage(new Model()));
        tester.assertRenderedPage(ResponsePage.class);
        tester.assertNoErrorMessage();

    }
}
