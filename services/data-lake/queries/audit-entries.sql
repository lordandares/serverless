WITH dataset AS (
    SELECT
    collection_auditentries._id AS id,
    collection_auditentries.application AS application_id,
    collection_auditentries.createdAt AS createdAt,
    collection_auditentries.items AS audit_items,
    collection_auditentries.location AS location_id,
    collection_auditentries.score.actual as score_actual,
    collection_auditentries.score.max as score_max,
    collection_auditentries.score.result as score_result,
    collection_auditentries.audit AS audit_template,
    collection_auditentries.title AS audit_title,
    collection_audits.title AS audit_template_title,
    collection_locations.name AS location_name,
    collection_locations.address.street AS location_street,
    collection_locations.address.city AS location_city,
    collection_locations.address.state AS location_state,
    collection_locations.address.country AS location_country,
    collection_applicationusers.email AS user_email,
    collection_applicationusers.firstname AS user_firstname,
    collection_applicationusers.lastname AS user_lastname,
    collection_applicationusers.role AS role_id,
    collection_roles.name AS role_name
    FROM lio.collection_auditentries
    LEFT JOIN lio.collection_audits
    ON collection_auditentries.audit = collection_audits._id
    LEFT JOIN lio.collection_locations
    ON collection_auditentries.location = collection_locations._id
    LEFT JOIN lio.collection_applicationusers
    ON collection_auditentries.user = collection_applicationusers.user
    LEFT JOIN lio.collection_roles
    ON collection_applicationusers.role = collection_roles._id

  )
  SELECT * FROM dataset