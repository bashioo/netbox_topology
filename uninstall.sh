#!/bin/bash

echo -n "Netbox installation directory? Press Enter for default [/opt/netbox]: "
read NETBOX_DIR

if [ -z "$NETBOX_DIR" ]; then
    NETBOX_DIR="/opt/netbox"
fi

rm -rf -v "$NETBOX_DIR"/netbox/static/vis-4.21.0
rm -rf -v "$NETBOX_DIR"/netbox/static/img/topology
rm -rf -v "$NETBOX_DIR"/netbox/static/js/topology.js
rm -rf -v "$NETBOX_DIR"/netbox/project-static/vis-4.21.0
rm -rf -v "$NETBOX_DIR"/netbox/project-static/img/topology
rm -rf -v "$NETBOX_DIR"/netbox/project-static/js/topology.js

patch -d "$NETBOX_DIR" -p0 -R -r- < topology.patch

echo "Uninstall completed! Please restart netbox now to apply changes."
echo "sudo supervisorctl restart netbox"
