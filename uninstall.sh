#!/bin/bash

echo -n "Netbox installation directory? Press Enter for default [/opt/netbox]: "
read NETBOX_DIR

if [ -z "$NETBOX_DIR" ]; then
    NETBOX_DIR="/opt/netbox"
fi

rm -rf -v "$NETBOX_DIR"/netbox/static/vis-4.21.0
rm -rf -v "$NETBOX_DIR"/netbox/static/img/topology
rm -rf -v "$NETBOX_DIR"/netbox/static/js/topology.js
rm -rf -v "$NETBOX_DIR"/netbox/static/js/topology_config.json

rm -rf -v "$NETBOX_DIR"/netbox/project-static/vis-4.21.0
rm -rf -v "$NETBOX_DIR"/netbox/project-static/img/topology
rm -rf -v "$NETBOX_DIR"/netbox/project-static/js/topology.js
rm -rf -v "$NETBOX_DIR"/netbox/project-static/js/topology_config.json

mv -f -v "$NETBOX_DIR"/netbox/static/css/base.css.orig "$NETBOX_DIR"/netbox/static/css/base.css
mv -f -v "$NETBOX_DIR"/netbox/project-static/css/base.css.orig "$NETBOX_DIR"/netbox/project-static/css/base.css
mv -f -v "$NETBOX_DIR"/netbox/templates/_base.html.orig "$NETBOX_DIR"/netbox/templates/_base.html
mv -f -v "$NETBOX_DIR"/netbox/templates/dcim/site.html.orig "$NETBOX_DIR"/netbox/templates/dcim/site.html

echo "Uninstall completed! Please restart netbox now to apply changes."
echo "sudo supervisorctl restart netbox"
