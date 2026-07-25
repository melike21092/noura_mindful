# NOURA Supabase setup

This directory contains the reviewed, versioned database migrations for NOURA.
It does not contain database passwords, secret keys, service-role keys, or user
data.

## Current phase

The initial migration is local only. It has not yet been applied to the hosted
Supabase project, and the existing NOURA pages do not use Supabase yet.

## Intended access model

- Anonymous visitors have no access to private tables.
- Clients can read and edit only their own NOURA data.
- Coaches can read data only for explicitly assigned clients.
- A client cannot promote their own profile to the coach role.
- Coach/client assignments are administrative operations and are not writable
  through the browser application.

## Applying the migration later

1. Open the Supabase project dashboard.
2. Open the SQL Editor and create a new query.
3. Copy the complete contents of the migration file into the editor.
4. Review the query before running it.
5. Run the query once.

Do not run the migration until the schema and policies have been approved.
Never place the database password or a service-role/secret key in this
repository.

## Public browser configuration

The root `config.js` contains only the project URL and Supabase publishable key.
Both values are designed to be sent to browsers. Security must never depend on
hiding them; it is enforced by authentication, grants, and Row Level Security.

