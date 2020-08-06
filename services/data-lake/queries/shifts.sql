WITH dataset AS (
  SELECT
    collection_applicationusers.username AS user_name,
    collection_applicationusers.email AS user_email,
    collection_applicationusers.firstname AS user_firstname,
    collection_applicationusers.lastname AS user_lastname,
    collection_shifts._id AS shift_id,
    collection_shifts.applicationid AS application_id,
    collection_shifts.duration AS shift_duration,
    collection_shifts.properties.deviceuuid AS user_device_id,
    collection_shifts."end".area.location.name AS end_area_name,
    collection_shifts."end".gps.geometry.coordinates AS end_gps_coordinates,
    collection_shifts."end".reverseGeocoded.road AS end_road,
    collection_shifts."end".reverseGeocoded.suburb AS end_suburb,
    collection_shifts."end".reverseGeocoded.city AS end_city,
    collection_shifts."end".reverseGeocoded.state AS end_state,
    collection_shifts."end".reverseGeocoded.county AS end_county,
    collection_shifts."end".reverseGeocoded.postcode AS end_postcode,
    collection_shifts."end".reverseGeocoded.countryCode AS end_countrycode,
    collection_shifts."end".time AS end_time,
    collection_shifts."start".area.location.name AS start_area_name,
    collection_shifts."start".gps.geometry.coordinates AS start_gps_coordinates,
    collection_shifts."start".reverseGeocoded.road AS start_road,
    collection_shifts."start".reverseGeocoded.suburb AS start_suburb,
    collection_shifts."start".reverseGeocoded.city AS start_city,
    collection_shifts."start".reverseGeocoded.state AS start_state,
    collection_shifts."start".reverseGeocoded.county AS start_county,
    collection_shifts."start".reverseGeocoded.postcode AS start_postcode,
    collection_shifts."start".reverseGeocoded.countryCode AS start_countrycode,
    collection_shifts."start".time AS start_time
  FROM lio.collection_shifts
  LEFT JOIN lio.collection_applicationusers
  ON (
     collection_shifts.user = collection_applicationusers.user AND
     collection_shifts.applicationid = collection_applicationusers.applicationid
  )
)
SELECT * FROM dataset