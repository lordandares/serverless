WITH dataset AS (
    SELECT
    collection_taskentries._id AS id,
    collection_taskentries.application AS application_id,
    collection_taskentries.createdAt AS created_at,
    collection_taskentries.entry AS task_entry,
    collection_taskentries.location AS location_id,
    collection_taskentries.task AS template_id,
    collection_taskentries.title AS task_title,
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
    collection_tasks.name AS template_name
    FROM lio.collection_taskentries
    LEFT JOIN lio.collection_locations
    ON collection_taskentries.location = collection_locations._id
    LEFT JOIN lio.collection_tasks
    ON collection_tasks._id = lio.collection_taskentries.task
    LEFT JOIN lio.collection_applicationusers
    ON (
      collection_taskentries.user = collection_applicationusers.user AND
      collection_taskentries.application = collection_applicationusers.application
    )
    LEFT JOIN lio.collection_roles
    ON collection_roles._id = collection_applicationusers.role
  )
  SELECT id,
      application_id,
      created_at,
      formGroup,
      fieldGroup,
      field,
      location_id,
      template_id,
      template_name,
      task_title,
      location_name,
      location_street,
      location_city,
      location_state,
      location_country,
      user_email,
      user_firstname,
      user_lastname,
      role_id,
      role_name
  FROM dataset,
    UNNEST(task_entry.formGroups) AS t(formGroup),
    UNNEST(formGroup.fieldGroups) AS t(fieldGroup),
    UNNEST(fieldGroup.fields) AS t(field)