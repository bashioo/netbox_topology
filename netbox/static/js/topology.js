var nodes = new vis.DataSet();
var edges = new vis.DataSet();
var container = document.getElementById('visjsgraph');

var options = {
    height: '600px',
    // default node style
    nodes: {
        shape: 'image',
        brokenImage: TOPOLOGY_IMG_DIR + 'role-unknown.png',
        size: 35,
        font: { 
            multi: 'md',
            face: 'helvetica',
        }, 
    },
    // default edge style
    edges: {
        length: 100,
        width: 2,
        font: {
            face: 'helvetica',
        },
    },
    physics: {
        solver: 'forceAtlas2Based', //best solver fot network diagrams
    },
    manipulation: {
        addEdge: addEdge,
    },
};

var topology = new vis.Network(container, {nodes: nodes, edges: edges}, options);

topology.on("dragEnd", function (params){
    dragged = this.getPositions(params.nodes);
    $.each(dragged, function(node_id, coordinates){
        if (CHANGE_DEVICE_ALLOWED) {
            api_call('/api/dcim/devices/'+node_id+'/', 'PATCH', {custom_fields: {coordinates: coordinates.x+';'+coordinates.y}});
        }
        nodes.update({ id: node_id, physics: false });
    });
});

topology.on("click", function (params) {
    if (params.edges.length == 1 & params.nodes.length == 0){
        $( '#topology_delete_edge' ).removeClass('disabled');
    }else{
        $( '#topology_delete_edge' ).addClass('disabled');
    }
});

// load configuration
api_call("/static/js/topology_config.json", "GET", undefined, function(config) {
    var hidden_roles = config.hidden_roles;

    // load devices
    api_call("/api/dcim/devices/?limit=0&site="+SITE_SLUG, "GET", undefined, function(response) {
       $.each(response.results, function(index, device) {
           if (hidden_roles.includes(device.device_role.slug)) {
               console.log(device.name+' has been hidden because of its role '+device.device_role.slug);
               return undefined;
           }
           var node = {
               id: device.id, 
               name: device.name,
               label: '*'+device.name+'*\n'+device.device_type.model, 
               image: TOPOLOGY_IMG_DIR + device.device_role.slug+'.png',
               title: device.device_role.name+'<br>'
                   +device.name+'<br>'
                   +device.device_type.manufacturer.name+' '+device.device_type.model+'<br>'
                   +'SN: '+device.serial,
           }
           if (device.custom_fields.coordinates){
                var coordinates = device.custom_fields.coordinates.split(";");
                node.x = parseInt(coordinates[0]);
                node.y = parseInt(coordinates[1]);
                node.physics = false;
            }
            nodes.add(node);
        });
       // once all nodes a loaded fit them to viewport
       topology.fit();
    });

    // load connections
    api_call("/api/dcim/interface-connections/?limit=0&site="+SITE_SLUG, "GET", undefined, function(response){
       $.each(response.results, function(index, connection) {
           var color = get_connection_color(
                connection.interface_a.form_factor.value, 
                connection.interface_b.form_factor.value
            );
           edges.add({
               id: connection.id,
               from: connection.interface_a.device.id, 
               to: connection.interface_b.device.id, 
               dashes: !connection.connection_status.value,
               color: {color: color, highlight: color, hover: color},
               title: 'Connection between<br>'
                   +connection.interface_a.device.name+' ['+connection.interface_a.name+']<br>'
                   +connection.interface_b.device.name+' ['+connection.interface_b.name+']',
           });
       });
    });
});


$( '#topology_delete_edge' ).on('click', function() {
    if (topology.getSelectedEdges().length != 1) return false;
    var edge_id = topology.getSelectedEdges()[0];
    $('#delete_connection_label').html(edges.get(edge_id).title );
    $( "#delete_connection_dialog" ).dialog({
        width: 400,
        resizable: false,
        close: function(){
            $( '#delete_connection_confirm' ).off('click');
        },
        buttons: [
            {
                text: 'Delete',
                class: 'btn btn-primary',
                click: function() {
                    api_call(
                        '/api/dcim/interface-connections/'+edge_id+'/',
                        'DELETE',
                        undefined,
                        function(response, status) {
                            // only remove edge if API DELETE returned
                            edges.remove(edge_id);
                            $( '#topology_delete_edge' ).addClass('disabled');
                        },
                    );
                    $( this ).dialog( "close" );
                }
            },
            {
                text: "Cancel",
                class: 'btn btn-primary',
                click: function() {
                    $( this ).dialog( "close" );
                }
            },
        ]
    });
});

$( '#topology_add_edge' ).on('click', function(){
    $( '#topology_add_edge' ).toggleClass('addMode');
    if ($( '#topology_add_edge' ).hasClass('addMode')) {
        $( '#topology_add_edge_label' ).text('Cancel');
        topology.addEdgeMode();
    }else{
        $( '#topology_add_edge_label' ).text('New connection');
        topology.disableEditMode();
    }
});

$( '#topology_reset_coordinates' ).on('click', function() {
    $.each(nodes.getIds(), function(undefined, node_id){
        nodes.update({ id: node_id, physics: true });
        api_call('/api/dcim/devices/'+node_id+'/', 'PATCH', {custom_fields: {coordinates: ''}});
    })
});


function addEdge(edgeData,callback) {
    // cancel built-in add routine
    callback(null);
    topology.disableEditMode();
    populate_interfaces('device_a', edgeData.from);
    populate_interfaces('device_b', edgeData.to);
    $( "#add_connection_dialog" ).dialog({
        width: 600,
        resizable: false,
        close: function( event, ui ) {
            $( '#topology_add_edge_label' ).text('New connection');
            $( '#topology_add_edge' ).removeClass('addMode');
        },
        buttons: [
            {
                text: "Create",
                class: 'btn btn-primary',
                click: function() {
                    var data = {
                        interface_a: $('#device_a_interfaces').val(),
                        interface_b: $('#device_b_interfaces').val(),
                        connection_status: $('#connection_status').val(),
                    };
                    api_call("/api/dcim/interface-connections/", "POST", data, function(response, status){
                        // only draw edge if API call was successful
                        var color = get_connection_color(
                            $('#device_a_interfaces  option:selected').attr('form_factor'), 
                            $('#device_b_interfaces  option:selected').attr('form_factor')
                        );
                        edgeData.id = response.id;
                        edgeData.dashes = !response.connection_status;
                        edgeData.color = {color: color, highlight: color, hover: color},
                        edgeData.title = 'Connection between<br>'
                            +nodes.get(edgeData.from).name+' ['+$('#device_a_interfaces  option:selected').text()+']<br>'
                            +nodes.get(edgeData.to).name+' ['+$('#device_b_interfaces  option:selected').text()+']';
                        edges.add(edgeData);
                    })
                    $( this ).dialog( "close" );
                }
            },
            {
                text: "Cancel",
                class: 'btn btn-primary',
                click: function() {
                    $( this ).dialog( "close" );
                },
            },
        ],
    });
}

function api_call(url, method, data, callback){
    $.ajax({
        url: url,
        headers: {"X-CSRFToken": TOKEN},
        dataType: 'json',
        contentType: 'application/json',
        method: method || "GET",
        data: JSON.stringify(data),
        success: callback,
    }).fail(function(response){
        console.log(response);
    });
}

function get_connection_color(interface_a, interface_b) {
    var ff_a = Math.floor(interface_a/100);
    var ff_b = Math.floor(interface_b/100);
    if ( (ff_a == 50) & (ff_b == 50) ){
        // stack cable
        return '#000000';
    }
    // default color
    return undefined;
}

function populate_interfaces(device_tag, device_id) {
    api_call('/api/dcim/interfaces/?limit=0&device_id='+device_id, "GET", undefined, function(response, status) {
        $('#'+device_tag+'_interfaces').html('');
        $.each(response.results.filter(function(interface){return interface.device.id == device_id}), function(index, interface){
            // ignore virtual interfaces
            if (interface.form_factor.value < 800) return;
            $('#'+device_tag+'_interfaces').append($('<option>', {
                value: interface.id,
                text: interface.name + (interface.interface_connection ? ' ['+interface.interface_connection.interface.device.name+']' : ''),
                form_factor: interface.form_factor.value,
                disabled: interface.interface_connection ? true : false,
            }));
        });
        $('#'+device_tag+'_label').text(nodes.get(device_id).name);
    });
}
