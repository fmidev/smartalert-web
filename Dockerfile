FROM quay.io/fmi/asi-www-baseimage:rocky97-php85-4.1.2

USER root

# Copy Apache configuration files
COPY ./conf/httpd/virtual-host.conf ./conf/httpd/common.inc ./conf/httpd/http-only.inc ./conf/httpd/https-only.inc ./conf/httpd/x-additional.conf ./conf/httpd/sites.conf \
       ${HTTPD_MAIN_CONF_D_PATH}/

# Shared application. This image carries no country content at all: every
# country's capmap-config.js, data/ and custom icons come from the share
# mounted at sites/ below.
COPY ./capsite.php ./list.php ./capfeed.php ./lastUpdated.php ./siteicon.php ./capatom.xsl \
     ./ethiopian_calendar.js ./locations.js ./cap-logo.png /smartmet/www/smartalert/
COPY ./js /smartmet/www/smartalert/js/
COPY ./css /smartmet/www/smartalert/css/
COPY ./img /smartmet/www/smartalert/img/
COPY ./i18n /smartmet/www/smartalert/i18n/

# The map page every country is served from, and the landing page listing them.
COPY ./index.html /smartmet/www/smartalert/site.html
COPY ./openshift/index.php /smartmet/www/smartalert/index.php

COPY ./openshift/node-health-status /smartmet/www/smartalert/node-health-status/

# Mount point for the per-country share; kept in the image so the routing and
# the landing page behave before any volume is attached.
RUN mkdir -p /smartmet/www/smartalert/sites

# Fix DocumentRoot permissions to prevent modifications
RUN chown --recursive root:root /smartmet/www/smartalert && \
    chmod --recursive a+r-w+X /smartmet/www/smartalert

USER ${FMI_APP_UID}

HEALTHCHECK --start-period=3s --interval=10s --timeout=1s CMD curl --fail http://localhost:8080/node-health-status/
