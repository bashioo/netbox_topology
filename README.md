# netbox_topology
patch to apply to a netbox installation to add beautiful topology view to sites

INSTALL:

1. clone git repo

git clone https://github.com/bashioo/netbox_topology.git

2. run install.sh, sudo might be required to get access to netbox installation directory:

cd netbox_topology

sudo ./install.sh

3. restart netbox via supervisord or apache/nginx depending on your installation

sudo supervisorctl restart netbox

4. open django admin web-interface and create a custom text field named "coordinates" under dcim->device model

5. modify NETBOXPATH/netbox/static/js/topology_config.json to include your list on roles to hide from the topology view.

please note that the list should include SLUGs, not names. please check that json is valid.

5. let me know if there are any issues - https://github.com/bashioo/netbox_topology/issues



UNINSTALL:

sudo ./uninstall.sh
