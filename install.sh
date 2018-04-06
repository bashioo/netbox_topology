#!/bin/bash

echo -n "Netbox installation directory? Press Enter for default [/opt/netbox]: "
read NETBOX_DIR

if [ -z "$NETBOX_DIR" ]; then
    NETBOX_DIR="/opt/netbox"
fi

cp -r -v netbox/ "$NETBOX_DIR"

patch -d "$NETBOX_DIR" -p0 -N -r- < topology.patch

echo "Done! Please restart netbox now to apply changes."
echo "sudo supervisorctl restart netbox"
echo ""
echo "Please do not forget to create 'coordinates' custom_field in dcim/device model"
