/* (c) 2014 - 2016 Open Source Geospatial Foundation - all rights reserved
 * (c) 2001 - 2013 OpenPlans
 * This code is licensed under the GPL 2.0 license, available at the root
 * application directory.
 */
package gov.nasa.worldwind.gs.geopkg.web;

import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.form.FormComponentPanel;
import org.apache.wicket.markup.html.form.TextField;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.PropertyModel;
import org.apache.wicket.model.ResourceModel;

import com.vividsolutions.jts.geom.Envelope;
import org.apache.wicket.Component;
import org.apache.wicket.util.visit.IVisit;
import org.apache.wicket.util.visit.IVisitor;
import org.geoserver.web.wicket.DecimalTextField;

/**
 * A form component for a {@link Envelope} object.
 *
 * @author Justin Deoliveira, OpenGeo
 * @author Andrea Aime, OpenGeo
 */
public class BBoxPanel extends FormComponentPanel<Envelope> {

    private static final long serialVersionUID = -2975427786330616705L;

    protected Label minXLabel, minYLabel, maxXLabel, maxYLabel;

    protected Double minX, minY, maxX, maxY;

    protected DecimalTextField minXInput, minYInput, maxXInput, maxYInput;

    public BBoxPanel(String id) {
        super(id);

        initComponents();
    }

    public BBoxPanel(String id, Envelope e) {
        this(id, new Model<Envelope>(e));
    }

    public BBoxPanel(String id, IModel<Envelope> model) {
        super(id, model);

        initComponents();
    }

    public void setLabelsVisibility(boolean visible) {
        minXLabel.setVisible(visible);
        minYLabel.setVisible(visible);
        maxXLabel.setVisible(visible);
        maxYLabel.setVisible(visible);
    }

    void initComponents() {
        updateFields();

        add(minXLabel = new Label("minXL", new ResourceModel("minX")));
        add(minYLabel = new Label("minYL", new ResourceModel("minY")));
        add(maxXLabel = new Label("maxXL", new ResourceModel("maxX")));
        add(maxYLabel = new Label("maxYL", new ResourceModel("maxY")));

        add(minXInput = new DecimalTextField("minX", new PropertyModel<>(this, "minX")));
        add(minYInput = new DecimalTextField("minY", new PropertyModel<>(this, "minY")));
        add(maxXInput = new DecimalTextField("maxX", new PropertyModel<>(this, "maxX")));
        add(maxYInput = new DecimalTextField("maxY", new PropertyModel<>(this, "maxY")));

    }

    @Override
    protected void onBeforeRender() {
        updateFields();
        super.onBeforeRender();
    }

    private void updateFields() {
        Envelope e = (Envelope) getModelObject();
        if (e != null) {
            this.minX = e.getMinX();
            this.minY = e.getMinY();
            this.maxX = e.getMaxX();
            this.maxY = e.getMaxY();
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public void convertInput() {
        visitChildren(TextField.class, (component, visit) -> {
            ((TextField<String>) component).processInput();
        });

        // update the envelope model
        if (minX != null && maxX != null && minY != null && maxY != null) {
            setConvertedInput(new Envelope(minX, maxX, minY, maxY));
        } else {
            setConvertedInput(null);
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    protected void onModelChanged() {
        // when the client programmatically changed the model, update the fields
        // so that the textfields will change too
        updateFields();
        visitChildren(TextField.class, (Component component, IVisit<Object> visit) -> {
            ((TextField<String>) component).clearInput();
        });
    }

}
