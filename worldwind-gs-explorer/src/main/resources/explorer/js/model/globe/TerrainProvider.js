/* 
 * Copyright (c) 2016 Bruce Schubert.
 * The MIT License
 * http://www.opensource.org/licenses/mit-license
 */

/*global define, WorldWind */

/**
 * The TerrainProvider module is responsible for obtaining the terrain at a given latitude and longitude.
 * 
 * @module TerrainProvider
 * @param {Object} Terrain 
 * @param {Object} wmtMath 
 * @param {Object} WorldWind 
 * @author Bruce Schubert
 */
define([
    'model/Config',
    'model/util/Log',
    'model/globe/Terrain',
    'model/util/WmtMath',
    'model/util/WmtUtil',
    'worldwind'],
    function (
        config,
        log,
        Terrain,
        wmtMath,
        wmtUtil,
        ww) {
        "use strict";
        /**
         * @constructor
         * @param {Globe} globe WMT Globe that encapulates the WorldWindow globe.
         * @returns {TerrainProvider} 
         */
        var TerrainProvider = function (globe) {
            this.wwGlobe = globe.wwd.globe;
        };
        /**
         * Gets the elevation (meters) at the given latitude and longitude.
         * @param {Number} latitude Latitude in degrees.
         * @param {Number} longitude Longitude in degrees.
         * @returns {Number} Elevation in meters.
         */
        TerrainProvider.prototype.elevationAtLatLon = function (latitude, longitude) {
            return this.wwGlobe.elevationAtLocation(latitude, longitude);
        };
        /**
         * EXPERIMENTAL!
         * 
         * Gets the elevation (meters) at the given latitude and longitude using highest resolution.
         * @param {Number} latitude Latitude in degrees.
         * @param {Number} longitude Longitude in degrees.
         * @returns {Number} Elevation in meters.
         */
        TerrainProvider.prototype.elevationAtLatLonHiRes = function (latitude, longitude, targetResolution) {
            // targetResolution: The desired elevation resolution, in radians. (To compute radians from
            // meters, divide the number of meters by the globe's radius.)
            var resolution = targetResolution ||  1 / WorldWind.EARTH_RADIUS,
                sector = new WorldWind.Sector(
                    latitude - 0.00005, // 0.0001 = ~11m at equator
                    latitude + 0.00005,
                    longitude - 0.00005,
                    longitude + 0.00005),
                numLat = 1, numLon = 1,
                result = new Array(numLat * numLon), // WW expects a preallocated array.
                resultResolution;

            // Get a single elevation for the small sector
            resultResolution = this.wwGlobe.elevationsForGrid(sector, numLat, numLon, targetResolution, result);
            return isNaN(result[0]) ? 0 : result[0];
        };
        /**
         * Gets the elevation, aspect and slope at the at the given latitude and longitude.
         * @param {Number} latitude Latitude in degrees.
         * @param {Number} longitude Longitude in degrees.
         * 
         * @param {Number} targetResolution EXPERIMENTAL! Default undefined.
         * 
         * @returns {Terrain} lat/lon, elevation (meters), aspect (degrees), slope(degrees)
         */
        TerrainProvider.prototype.terrainAtLatLon = function (latitude, longitude, targetResolution) {
            var terrainNormal = new WorldWind.Vec3(),
                surfaceNormal = new WorldWind.Vec3(),
                northNormal = new WorldWind.Vec3(),
                perpendicular = new WorldWind.Vec3(),
                tempcross = new WorldWind.Vec3(),
                slope,
                aspect,
                direction,
                elevation,
                terrain;

            if (!latitude || !longitude) {
                log.error("Terrain", "terrainLatLon", "missingCoordinate(s)");
                terrain = new Terrain();
                terrain.copy(Terrain.INVALID);
                return terrain;
            }

            // Compute normal vectors for terrain, surface and north.
            if (!targetResolution || isNaN(targetResolution)) {
                elevation = this.elevationAtLatLon(latitude, longitude);
                terrainNormal = this.terrainNormalAtLatLon(latitude, longitude);
            } else {
                elevation = this.elevationAtLatLonHiRes(latitude, longitude, targetResolution);
                terrainNormal = this.terrainNormalAtLatLonHiRes(latitude, longitude, targetResolution);
            }
            this.wwGlobe.surfaceNormalAtLocation(latitude, longitude, surfaceNormal);
            this.wwGlobe.northTangentAtLocation(latitude, longitude, northNormal);

            // Compute terrain slope -- the delta between surface normal and terrain normal
            slope = wmtMath.angleBetween(terrainNormal, surfaceNormal);

            // Compute the terrain aspect -- get a perpendicular vector projected onto
            // surface normal which is in the same plane as the north vector and get delta.
            wmtMath.perpendicularTo(terrainNormal, surfaceNormal, perpendicular);
            aspect = wmtMath.angleBetween(perpendicular, northNormal);

            // Use dot product to determine aspect angle's sign (+/- 180)            
            tempcross.copy(surfaceNormal).cross(northNormal);
            direction = (tempcross.dot(perpendicular) < 0) ? 1 : -1;
            aspect = aspect * direction;

            return new Terrain(latitude, longitude, elevation, aspect, slope);
        };
        /**
         * Computes a normal vector for a point on the terrain.
         * @param {Number} latitude Degrees.
         * @param {Number} longitude Degrees.
         * @param {Number} sampleRadius Optional distance from lat/lon to sample elevation. 
         *  Default: Wmt.configuration.terrainSampleRadius
         * @returns {Vec3} Terrain normal vector at lat/lon
         */
        TerrainProvider.prototype.terrainNormalAtLatLon = function (latitude, longitude, sampleRadius) {
            if (!latitude || !longitude) {
                throw new WorldWind.ArgumentError(
                    log.error("Terrain", "terrainNormalAtLatLon", "missingCoordinate(s)"));
            }
            var radianDistance = (sampleRadius || config.terrainSampleRadius) * wmtUtil.METERS_TO_RADIANS,
                n0 = new WorldWind.Location(latitude, longitude),
                n1 = new WorldWind.Location(),
                n2 = new WorldWind.Location(),
                n3 = new WorldWind.Location(),
                p1 = new WorldWind.Vec3(),
                p2 = new WorldWind.Vec3(),
                p3 = new WorldWind.Vec3(),
                SOUTH = 180,
                NW = -60,
                NE = 60,
                terrainNormal;


            // Establish three points that define a triangle around the center position
            // to be used for determining the slope and aspect of the terrain    
            WorldWind.Location.rhumbLocation(n0, SOUTH, radianDistance, n1);
            WorldWind.Location.rhumbLocation(n0, NW, radianDistance, n2);
            WorldWind.Location.rhumbLocation(n0, NE, radianDistance, n3);
//            WorldWind.Location.rhumbLocation(n0, SOUTH, -0.00005 * WorldWind.Angle.DEGREES_TO_RADIANS, n1);
//            WorldWind.Location.rhumbLocation(n1, NW, -0.0001 * WorldWind.Angle.DEGREES_TO_RADIANS, n2);
//            WorldWind.Location.rhumbLocation(n1, NE, -0.0001 * WorldWind.Angle.DEGREES_TO_RADIANS, n3);
            // Get the cartesian coords for the points
            this.wwGlobe.computePointFromPosition(n1.latitude, n1.longitude, this.elevationAtLatLon(n1.latitude, n1.longitude), p1);
            this.wwGlobe.computePointFromPosition(n2.latitude, n2.longitude, this.elevationAtLatLon(n2.latitude, n2.longitude), p2);
            this.wwGlobe.computePointFromPosition(n3.latitude, n3.longitude, this.elevationAtLatLon(n3.latitude, n3.longitude), p3);
            // Compute an upward pointing normal 
            terrainNormal = WorldWind.Vec3.computeTriangleNormal(p1, p2, p3);
            terrainNormal.negate(); // flip the direction

            return terrainNormal;
        };
        /**
         * EXPERIMENTAL!
         * 
         * Computes a normal vector for a point on the terrain.
         * @param {Number} latitude Degrees.
         * @param {Number} longitude Degrees.
         * @returns {Vec3} Terrain normal vector at lat/lon
         */
        TerrainProvider.prototype.terrainNormalAtLatLonHiRes = function (latitude, longitude, targetResolution) {
            if (!latitude || !longitude) {
                throw new WorldWind.ArgumentError(
                    log.error("Terrain", "terrainNormalAtLatLon", "missingCoordinate(s)"));
            }
            var n0 = new WorldWind.Location(latitude, longitude),
                n1 = new WorldWind.Location(),
                n2 = new WorldWind.Location(),
                n3 = new WorldWind.Location(),
                p1 = new WorldWind.Vec3(),
                p2 = new WorldWind.Vec3(),
                p3 = new WorldWind.Vec3(),
                SOUTH = 180,
                NW = -60,
                NE = 60,
                terrainNormal;


            // Establish three points that define a triangle around the center position
            // to be used for determining the slope and aspect of the terrain (roughly 10 meters per side)        
            WorldWind.Location.rhumbLocation(n0, SOUTH, -0.00005 * WorldWind.Angle.DEGREES_TO_RADIANS, n1);
            WorldWind.Location.rhumbLocation(n1, NW, -0.0001 * WorldWind.Angle.DEGREES_TO_RADIANS, n2);
            WorldWind.Location.rhumbLocation(n1, NE, -0.0001 * WorldWind.Angle.DEGREES_TO_RADIANS, n3);
            // Get the cartesian coords for the points
            this.wwGlobe.computePointFromPosition(n1.latitude, n1.longitude, this.elevationAtLatLonHiRes(n1.latitude, n1.longitude, targetResolution), p1);
            this.wwGlobe.computePointFromPosition(n2.latitude, n2.longitude, this.elevationAtLatLonHiRes(n2.latitude, n2.longitude, targetResolution), p2);
            this.wwGlobe.computePointFromPosition(n3.latitude, n3.longitude, this.elevationAtLatLonHiRes(n3.latitude, n3.longitude, targetResolution), p3);
            // Compute an upward pointing normal 
            terrainNormal = WorldWind.Vec3.computeTriangleNormal(p1, p2, p3);
            terrainNormal.negate(); // flip the direction

            return terrainNormal;
        };
        return TerrainProvider;
    }
);

