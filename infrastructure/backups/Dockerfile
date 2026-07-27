# Sajawat database-backup job image (Milestone 1.10b.4).
# mongodump (mongodb-database-tools) + gsutil (google-cloud-sdk), run as a
# Cloud Run Job. Operator builds + pushes to Artifact Registry (see README).
FROM google/cloud-sdk:slim

ARG MONGO_TOOLS_VERSION=100.9.4
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-${MONGO_TOOLS_VERSION}.deb" -o /tmp/tools.deb \
 && apt-get install -y /tmp/tools.deb \
 && rm -f /tmp/tools.deb \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/backup-entrypoint.sh
RUN chmod +x /usr/local/bin/backup-entrypoint.sh

# Non-root.
USER nobody
ENTRYPOINT ["/usr/local/bin/backup-entrypoint.sh"]
