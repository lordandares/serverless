## Archive

The archive is a place to move unused services that we still want to keep around
for historical reference. Ideally these services will eventually be removed
from version control, but for now there remains some useful patterns to keep.

## Archiving process

1.  Move files to `__archive__` directory
2.  Open PR for archiving
3.  After merge, ensure the service is decommissioned with `sls remove service --stage`
