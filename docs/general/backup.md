## Create Backup

Schema:
$f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --no-owner --no-privileges --schema-only --clean --if-exists --quote-all-identifiers --schema=public -f "$f/schema-backup.dump" -d mydatabase

Data:
$f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --no-owner --no-privileges --clean --if-exists --quote-all-identifiers --data-only --schema=public -f "$f/data-backup.dump" -d mydatabase

- $f → Folder Path Variable
- $f="backup/"+(Get-Date -Format "yyyy-MM-dd"); New-Item -ItemType Directory -Path $f -Force; → automated date for windows
- -Fc → Custom format (.dump)
- --no-owner: Removes ownership information
- --no-privileges: Excludes GRANT/REVOKE commands
- --schema=public: only public tables
- -f backup.dump → Output file
- -d mydatabase → Target database link

Other otions

- -a: Data only
- -b: Include large objects in the dump
- --exclude-schema 'extensions|graphql|graphql_public|net|tiger|pgbouncer|vault|realtime|supabase_functions|storage|pg\*|information_schema'
- --quote-all-identifiers: This option is recommended when dumping a database from a server whose PostgreSQL major version is different from pg_dump's, or when the output is intended to be loaded into a server of a different major version
- --clean --if-exists: Output commands to DROP all the dumped database objects prior to outputting the commands for creating them

### Example

**Schema**: $f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --clean --if-exists --quote-all-identifiers --no-owner --no-privileges --schema-only --schema=public -f "$f/schema-backup.dump" -d postgresql://postgres.mvycblxlpnyuggkubezj:yourpasshere@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

**Data**: $f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --clean --if-exists --quote-all-identifiers --no-owner --no-privileges --data-only --schema=public -f "$f/data-backup.dump" -d postgresql://postgres.mvycblxlpnyuggkubezj:yourpasshere@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

**Both**: $f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --clean --if-exists --quote-all-identifiers --no-owner --no-privileges --schema=public -f "$f/backup.dump" -d postgresql://postgres.mvycblxlpnyuggkubezj:yourpasshere@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

**Other Solution**: $f="dumps/"+(Get-Date -Format "yyyy-MM-dd");`
    New-Item -ItemType Directory -Path $f -Force;`
    pg_dump -Fc --clean --if-exists --quote-all-identifiers --no-owner --no-privileges --schema-only --exclude-schema 'extensions|graphql|graphql_public|net|tiger|pgbouncer|vault|realtime|supabase_functions|storage|pg*|information_schema' -f "$f/schema-backup.dump" -d mydatabase

## Restore Backup

pg_restore --no-owner --no-privileges --schema=public --disable-triggers -d postgresql://your_connection_string dumps/YYYY-MM-DD/backup.dump

Example: pg_restore --no-owner --no-privileges --disable-triggers -d postgresql://postgres.mvycblxlpnyuggkubezj:yourpasshere@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres dumps/2025-03-30/backup.dump

## Troubleshooting

- Check Network / Firewall Restrictions: Test-NetConnection aws-0-ap-southeast-1.pooler.supabase.com -Port 6543
- From .dump to .sql: pg_restore -f dumps/presentation/full_backup.sql dumps/yyyy-MM-dd/backup.dump
- Access to database CLI: psql -d postgresql://postgres.mvycblxlpnyuggkubezj:yourpasshere@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
- Select inside CLI: SELECT \* FROM public."Test";
