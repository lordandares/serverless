WITH dataset AS (
    SELECT
    collection_issues._id AS issue_id,
    collection_issues.application AS application_id,
    collection_issues.createdat AS created_at,
    collection_issues.duration AS issue_duration,
    collection_issues.entry AS issue_entry,
    collection_issues.location AS issue_location_id,
    collection_issues.status AS issue_status,
    collection_issues.template AS issue_template,
    collection_issues.title AS issue_title,
    collection_locations.name AS location_name,
    collection_locations.address.street AS location_street,
    collection_locations.address.city AS location_city,
    collection_locations.address.state AS location_state,
    collection_locations.address.country AS location_country,
    collection_applicationusers.email AS user_email,
    collection_applicationusers.firstname AS user_firstname,
    collection_applicationusers.lastname AS user_lastname,
    collection_applicationusers.role AS role_id,
    collection_roles.name AS role_name,
    collection_templates.name AS template_name
    FROM "lio"."collection_issues"
    LEFT JOIN "lio"."collection_locations"
    ON collection_issues.location = collection_locations._id
    LEFT JOIN "lio"."collection_templates"
    ON collection_issues.template = collection_templates._id
    LEFT JOIN "lio"."collection_applicationusers"
    ON collection_issues.user = collection_applicationusers.user
    LEFT JOIN "lio"."collection_roles"
    ON collection_applicationusers.role = collection_roles._id
  )
  SELECT
  application_id,
  created_at,
  formGroup,
  fieldGroup,
  field,
  field._id AS field_id,
  field.label AS field_label,
  field.value AS field_value,
  issue_id,
  issue_duration,
  issue_location_id,
  issue_status,
  issue_template,
  issue_title,
  location_name,
  location_street,
  location_city,
  location_country,
  user_email,
  user_firstname,
  user_lastname,
  role_id,
  role_name,
  template_name
  FROM dataset,
      UNNEST(issue_entry.formGroups) AS t(formGroup),
      UNNEST(formGroup.fieldGroups) AS t(fieldGroup),
      UNNEST(fieldGroup.fields) AS t(field)