WITH dataset AS (
  SELECT
    collection_applicationusers.username AS user_name,
    collection_applicationusers.email AS user_email,
    collection_applicationusers.firstname AS user_firstname,
    collection_applicationusers.lastname AS user_lastname,
    collection_events._id AS event_id,
    collection_events.applicationid AS application_id,
    collection_events.location AS location_id,
    collection_events.timestamp AS timestamp,
    collection_events.type AS type,
    collection_events.user AS user_id,
    collection_events.zone AS zone_id,
    collection_zones.name AS zone_name
  FROM lio.collection_events
  LEFT JOIN lio.collection_applicationusers
  ON (
     collection_events.user = collection_applicationusers.user AND
     collection_events.applicationid = collection_applicationusers.applicationid
  )
  LEFT JOIN lio.collection_zones
  ON collection_events.zone = collection_zones._id
)
SELECT * FROM dataset