WITH dataset AS (
  SELECT
     collection_locations.name AS loop_location_name,
     collection_loopexceptions.duration AS loop_duration,
     collection_loopexceptions.location AS loop_location,
     collection_loopexceptions.opened AS loop_opened,
     collection_loopexceptions.resolved AS loop_resolved,
     collection_loopexceptions.zone AS loop_zone,
     collection_zones.name AS loop_zone_name
  FROM lio.collection_loopexceptions
  LEFT JOIN lio.collection_locations
  ON lio.collection_loopexceptions.location = lio.collection_locations._id
  LEFT JOIN lio.collection_zones
  ON lio.collection_loopexceptions.zone = lio.collection_zones._id
)
SELECT *
FROM dataset