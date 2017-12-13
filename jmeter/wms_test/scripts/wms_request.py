#!/usr/bin/env python
# 
# Original script:
#  http://svn.osgeo.org/osgeo/foss4g/benchmarking/wms/2010/scripts/wms_request.py
#
# ******************************************************************************
#  Project:  2009 Web Map Server Benchmarking
#  Purpose:  Generate WMS BBOX/size requests randomly over a defined dataset.
#  Author:   Frank Warmerdam, warmerdam@pobox.com
#
# ******************************************************************************
#  Copyright (c) 2009, Frank Warmerdam
#
#  Permission is hereby granted, free of charge, to any person obtaining a
#  copy of this software and associated documentation files (the "Software"),
#  to deal in the Software without restriction, including without limitation
#  the rights to use, copy, modify, merge, publish, distribute, sublicense,
#  and/or sell copies of the Software, and to permit persons to whom the
#  Software is furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included
#  in all copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
#  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
#  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
#  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
#  DEALINGS IN THE SOFTWARE.
# ******************************************************************************

import random
import math
import string
import sys


# =============================================================================
def Usage():
    print 'Usage: wms_request.py [-count n] [-region minx miny maxx maxy]'
    print '                    [-minres minres] [-maxres maxres] '
    print '                    [-maxsize width height] [-minsize width height]'
    print '                    [-srs <epsg_code>] [-srs2 <epsg_code>]'
    print '                    [-filter_within <filename>]'
    sys.exit(1)


# =============================================================================

if __name__ == '__main__':

    region = None
    minres = None
    maxres = None
    count = 1000
    minsize = (128, 128)
    maxsize = (1024, 768)

    # filter
    filter_within = None
    geometry_collection = None
    dataset = None

    # SRS
    srs_input = 4326
    srs_output = None
    coordinate_transformation = None

    # output files
    output_filename = None
    output_filename2 = None
    output_file = None
    output_file2 = None

    # Parse command line arguments.
    argv = sys.argv

    i = 1
    while i < len(argv):
        arg = argv[i]

        if arg == '-region' and i < len(argv) - 4:
            region = (float(argv[i + 1]), float(argv[i + 2]),
                      float(argv[i + 3]), float(argv[i + 4]))
            i = i + 4

        elif arg == '-minsize' and i < len(argv) - 2:
            minsize = (int(argv[i + 1]), int(argv[i + 2]))
            i = i + 2

        elif arg == '-maxsize' and i < len(argv) - 2:
            maxsize = (int(argv[i + 1]), int(argv[i + 2]))
            i = i + 2

        elif arg == '-minres' and i < len(argv) - 1:
            minres = float(argv[i + 1])
            i = i + 1

        elif arg == '-maxres' and i < len(argv) - 1:
            maxres = float(argv[i + 1])
            i = i + 1

        elif arg == '-count' and i < len(argv) - 1:
            count = int(argv[i + 1])
            i = i + 1

        elif arg == '-filter_within' and i < len(argv) - 1:
            filter_within = argv[i + 1]
            i = i + 1

        elif arg == '-output' and i < len(argv) - 1:
            output_filename = argv[i + 1]
            i = i + 1

        elif arg == '-output2' and i < len(argv) - 1:
            output_filename2 = argv[i + 1]
            i = i + 1

        elif arg == '-srs' and i < len(argv) - 1:
            srs_input = int(argv[i + 1])
            i = i + 1

        elif arg == '-srs2' and i < len(argv) - 1:
            srs_output = int(argv[i + 1])
            i = i + 1

        else:
            print 'Unable to process: %s' % arg
            Usage()

        i = i + 1

    if region is None:
        print '-region is required.'
        Usage()

    if minres is None:
        print '-minres is required.'
        Usage()

    if maxres is None:
        print '-maxres is required.'
        Usage()

    if filter_within is not None:

        try:
            from osgeo import ogr, osr

            dataset = ogr.Open(filter_within)
            if dataset is None:
                print 'Unable to open dataset "%s"' % filter_within
                Usage()

            layer = dataset.GetLayer(0)
            if layer is None:
                print 'Unable to get the first layer of the dataset "%s"' % filter_within
                Usage()

            geometry_collection = ogr.Geometry(ogr.wkbGeometryCollection)
            feature = layer.GetNextFeature()
            while feature is not None:
                geom = feature.GetGeometryRef()
                if geom is not None:
                    geometry_collection.AddGeometry(geom)

                feature = layer.GetNextFeature()

        except ImportError:
            print '-filter_within: OGR is required to use this option.'
            Usage()

    if srs_output is not None:

        try:
            from osgeo import ogr, osr

            # srs2 mercator coordinate transformation
            source = osr.SpatialReference()
            if source.ImportFromEPSG(srs_input) is not 0:
                print "Unable to find projection: %s" % "EPSG:" + str(srs_input)
                Usage()
            target = osr.SpatialReference()
            if target.ImportFromEPSG(srs_output) is not 0:
                print "Unable to find projection: %s" % "EPSG:" + str(srs_output)
                Usage()
            coordinate_transformation = osr.CoordinateTransformation(source, target)

        except ImportError:
            print '-srs2: OGR is required to use this option.'
            Usage()

    # -------------------------------------------------------------------------

    # create output file
    if output_filename is None:
        output_filename = str(srs_input) + '.csv'
    output_file = open('./' + output_filename, 'w')

    if srs_output is not None:
        if output_filename2 is None:
            output_filename2 = str(srs_output) + '.csv'
        output_file2 = open('./' + output_filename2, 'w')

    first = True
    while count > 0:
        width = random.randint(minsize[0], maxsize[0])
        height = random.randint(minsize[1], maxsize[1])

        center_x = random.random() * (region[2] - region[0]) + region[0]
        center_y = random.random() * (region[3] - region[1]) + region[1]

        base = 2
        max_log = math.log(maxres, base)
        min_log = math.log(minres, base)
        random_log = random.random() * (max_log - min_log) + min_log
        res = math.pow(base, random_log)

        bbox = (center_x - width * 0.5 * res,
                center_y - height * 0.5 * res,
                center_x + width * 0.5 * res,
                center_y + height * 0.5 * res)
        print '%d; %d; %.8g, %.8g, %.8g, %.8g' % (width, height, bbox[0], bbox[1], bbox[2], bbox[3])

        if bbox[0] >= region[0] \
                and bbox[1] >= region[1] \
                and bbox[2] <= region[2] \
                and bbox[3] <= region[3]:

            if filter_within is not None:
                wkt = "POLYGON((" + str(bbox[0]) + " " + str(bbox[1]) + "," + str(bbox[2]) + " " + str(
                    bbox[1]) + "," + str(bbox[2]) + " " + str(bbox[3]) + "," + str(bbox[0]) + " " + str(
                    bbox[3]) + "," + str(bbox[0]) + " " + str(bbox[1]) + "))"
                polygon = ogr.CreateGeometryFromWkt(wkt)
                if geometry_collection.Contains(polygon) is False:
                    continue

            if srs_output is not None:
                # transform the bbox to srs2 mercator
                srs2_bbox = coordinate_transformation.TransformPoints([(bbox[0], bbox[1]), (bbox[2], bbox[3])])
                # compute the new width/height of the map to preserve square pixels
                delta_original = ((bbox[2] - bbox[0]) / (bbox[3] - bbox[1]))
                delta_transformed = ((srs2_bbox[1][0] - srs2_bbox[0][0]) / (srs2_bbox[1][1] - srs2_bbox[0][1]))
                pixels = width * height
                srs2_height = math.floor(math.sqrt(pixels / delta_transformed))
                srs2_width = math.floor(delta_transformed * srs2_height)

            if first:
                print '%d; %d; %.8g, %.8g, %.8g, %.8g, %d' % (width, height, bbox[0], bbox[1], bbox[2], bbox[3], count)
                # Trick to have the command that created the csv file without making jmeter bomb (csv format has no notion of comments)
                output_file.write(
                    '%d;%d;%.8g,%.8g,%.8g,%.8g;wms_request.py -count %d -region %.8g %.8g %.8g %.8g -minsize %d %d -maxsize %d %d -minres %.8g -maxres %.8g\n' \
                    % (width, height, bbox[0], bbox[1], bbox[2], bbox[3], count, region[0], region[1], region[2],
                       region[3], minsize[0], minsize[1], maxsize[0], maxsize[1], minres, maxres))
                if srs_output is not None:
                    output_file2.write(
                        '%d;%d;%.8g,%.8g,%.8g,%.8g;wms_request.py -count %d -region %.8g %.8g %.8g %.8g -minsize %d %d -maxsize %d %d -minres %.8g -maxres %.8g\n' \
                        % (srs2_width, srs2_height, srs2_bbox[0][0], srs2_bbox[0][1], srs2_bbox[1][0], srs2_bbox[1][1],
                           count, region[0], region[1], region[2], region[3], minsize[0], minsize[1], maxsize[0],
                           maxsize[1], minres, maxres))

                first = False
            else:
                print '%d; %d; %.8g, %.8g, %.8g, %.8g, %d' % (width, height, bbox[0], bbox[1], bbox[2], bbox[3], count)
                output_file.write('%d;%d;%.8g,%.8g,%.8g,%.8g\n' \
                                  % (width, height, bbox[0], bbox[1], bbox[2], bbox[3]))
                if srs_output is not None:
                    output_file2.write('%d;%d;%.8g,%.8g,%.8g,%.8g\n' \
                                       % (srs2_width, srs2_height, srs2_bbox[0][0], srs2_bbox[0][1], srs2_bbox[1][0],
                                          srs2_bbox[1][1]))

            count = count - 1

    if dataset:
        dataset.Destroy()

    output_file.close()
    if srs_output is not None:
        output_file2.close()