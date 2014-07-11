/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

virtualnetworkConfigObj = new VirtualNetworkConfig();

function VirtualNetworkConfig() {
    //Variable definitions
    //Dropdowns
    var ddDomain, ddProject, ddFwdMode, ddAdminState;

    //Comboboxes

    //Grids
    var gridVN;

    //Buttons
    var btnCreateVN, btnDeleteVN,
        btnCreateVNCancel, btnCreateVNOK, btnRemovePopupOK, 
        btnRemovePopupCancel,btnCnfRemoveMainPopupOK,
        btnCnfRemoveMainPopupCancel;

    //Textboxes
    var txtVNName, txtVxLanId;

    //Multiselects
    var msNetworkPolicies;

    //Windows
    var windowCreateVN, confirmRemove, confirmMainRemove;

    var gridVNDetailTemplate;

    //Misc
    var mode = "";
    var vnAjaxcount = 0;
    var idCount = 0;
    var ajaxParam;
    var dynamicID;

    //Method definitions
    this.load = load;
    this.init = init;
    this.initComponents = initComponents;
    this.initActions = initActions;
    this.fetchData = fetchData;
    this.fetchDataForGridVN = fetchDataForGridVN;
    this.populateDomains = populateDomains;
    this.handleDomains = handleDomains;
    this.populateProjects = populateProjects;
    this.successHandlerForGridVNRow = successHandlerForGridVNRow;
    this.handleProjects = handleProjects;
    this.showVNEditWindow = showVNEditWindow;
    this.closeCreateVNWindow = closeCreateVNWindow;
    this.autoPopulateGW = autoPopulateGW;
    this.deleteVN = deleteVN;
    this.successHandlerForGridVN = successHandlerForGridVN;
    this.failureHandlerForGridVN = failureHandlerForGridVN;
    this.createVNSuccessCb = createVNSuccessCb;
    this.createVNFailureCb = createVNFailureCb;
    this.reorderPolicies = reorderPolicies;
    this.validateRTEntry = validateRTEntry;
    this.validateFipEntry = validateFipEntry;
    this.validate = validate;
    this.toggleDHCP = toggleDHCP;
    this.setHeaderDHCP = setHeaderDHCP;
    this.getAllDNSServer = getAllDNSServer;
    this.dynamicID = dynamicID;
    this.destroy = destroy;
}

function load() {
    var configTemplate = Handlebars.compile($("#vn-config-template").html());
    $(contentContainer).empty();
    $(contentContainer).html(configTemplate);
    var createVNTemplate = Handlebars.compile($("#create-vn-template").html());
    $('body').append(createVNTemplate);    
    currTab = 'config_networking_vn';
    init();
}

function init() {
    this.initComponents();
    this.initActions();
    this.fetchData();
}

function fetchData() {
    fetchDomains("populateDomains", "failureHandlerForGridVN");
}

function initComponents() {
    dynamicID = 0;
    $("#gridVN").contrailGrid({
        header : {
            title : {
                text : 'Networks',
                //cssClass : 'blue',
                //icon : 'icon-list',
                //iconCssClass : 'blue'
            },
            //defaultControls: {
            //    collapseable: false,
            //    exportable: false,
            //    refreshable: false,
            //    searchable: true
            //},
            customControls: ['<a id="btnDeleteVN" class="disabled-link" title="Delete Virtual Network(s)"><i class="icon-trash"></i></a>',
                '<a id="btnCreateVN" onclick="showVNEditWindow(\'add\');return false;" title="Create Virtual Network"><i class="icon-plus"></i></a>',
                'Project:<div id="ddProjectSwitcher" />',
                'Domain: <div id="ddDomainSwitcher" />']
        },
        columnHeader : {
            columns : [
            {
                id: "Network",
                field: "Network",
                name: "Network",
                sortable: true
            },
            {
                id: "IPBlocks",
                field: "IPBlocks",
                name: "Subnets",
                formatter: function(r, c, v, cd, dc) {
                    var returnString = "";
                    if(typeof dc.IPBlocks === "object") {
                       for(var i=0; i<dc.IPBlocks.length, i<2; i++) {
                           if(typeof dc.IPBlocks[i] !== "undefined") {
                               returnString += dc.IPBlocks[i] + "<br>";
                           }
                       }
                       if(dc.IPBlocks.length > 2) {
                           returnString += '<span class="moredataText">(' + 
                           (dc.IPBlocks.length-2) + 
                           ' more)</span><span class="moredata" style="display:none;"></span>';
                       }
                    }
                    return returnString;
                }
            },
            {
                id: "AttachedPolicies",
                field: "AttachedPolicies",
                name: "Attached Policies",
                formatter: function(r, c, v, cd, dc) {
                    var returnString = "";
                    if(typeof dc.AttachedPolicies === "object") {
                       for(var i=0; i<dc.AttachedPolicies.length, i<2; i++) {
                           if(typeof dc.AttachedPolicies[i] !== "undefined") {
                               returnString += dc.AttachedPolicies[i] + "<br>";
                           }
                       }
                       if(dc.AttachedPolicies.length > 2) {
                           returnString += '<span class="moredataText">(' + 
                           (dc.AttachedPolicies.length-2) + 
                           ' more)</span><span class="moredata" style="display:none;"></span>';
                       }
                    }
                    return returnString;
                }
            },
            {
                id: "Shared",
                field: "Shared",
                name: "Shared",
                sortable: true
            },
            {
                id: "adminState",
                field: "adminState",
                name: "Admin State",
                sortable: true
            }]
        },
        body : {
            options : {
                checkboxSelectable: {
                    onNothingChecked: function(e){
                        $('#btnDeleteVN').addClass('disabled-link');
                    },
                    onSomethingChecked: function(e){
                        $('#btnDeleteVN').removeClass('disabled-link');
                    }
                },
                forceFitColumns: true,
                actionCell: [
                    {
                        title: 'Edit',
                        iconClass: 'icon-edit',
                        onClick: function(rowIndex){
                            showVNEditWindow('edit',rowIndex);
                        }
                    },
                    {
                        title: 'Delete',
                        iconClass: 'icon-trash',
                        onClick: function(rowIndex){
                            showRemoveWindow(rowIndex);
                        }
                    }
                ],
                detail: {
                    template: $("#gridVNDetailTemplate").html()
                }
            },
            dataSource : {
                data : []
            },
            statusMessages: {
                loading: {
                    text: 'Loading Virtual Networks..',
                },
                empty: {
                    text: 'No Virtual Networks Found.'
                }, 
                errorGettingData: {
                    type: 'error',
                    iconClasses: 'icon-warning',
                    text: 'Error in getting Virtual Networks.'
                }
            }
        }
    });

    gridVN = $("#gridVN").data('contrailGrid');
    
    btnCreateVN = $("#btnCreateVN");
    btnDeleteVN = $("#btnDeleteVN");
    btnCreateVNCancel = $("#btnCreateVNCancel");
    btnCreateVNOK = $("#btnCreateVNOK");
    btnRemovePopupOK = $("#btnRemovePopupOK");
    btnRemovePopupCancel = $("#btnRemovePopupCancel");
    btnCnfRemoveMainPopupOK = $("#btnCnfRemoveMainPopupOK");
    btnCnfRemoveMainPopupCancel = $("#btnCnfRemoveMainPopupCancel");

    txtVNName = $("#txtVNName");
    txtVxLanId = $("#txtVxLanId");
    vnAjaxcount = 0;
    
    ddFwdMode = $("#ddFwdMode").contrailDropdown({
        data: [{id:"l2_l3", text:'L2 and L3'}, {id:"l2", text:'L2 Only'}]
    });

    ddAdminState = $("#ddAdminState").contrailDropdown({
        data: [{id:"true", text:'Up'}, {id:"false", text:'Down'}]
    });

    msNetworkPolicies = $("#msNetworkPolicies").contrailMultiselect({
        placeholder: "Select Policies...",
        dataTextField:"text",
        dataValueField:"value",
        dropdownCssClass: 'select2-medium-width'
    });;

    ddDomain = $("#ddDomainSwitcher").contrailDropdown({
        dataTextField:"text",
        dataValueField:"value",
        change:handleDomains
    });
    ddProject = $("#ddProjectSwitcher").contrailDropdown({
        dataTextField:"text",
        dataValueField:"value"
    });

    gridVN.showGridMessage('loading');
    windowCreateVN = $("#windowCreateVN");
    windowCreateVN.on("hide", closeCreateVNWindow);
    windowCreateVN.modal({backdrop:'static', keyboard: false, show:false});

    confirmMainRemove = $("#confirmMainRemove");
    confirmMainRemove.modal({backdrop:'static', keyboard: false, show:false});

    confirmRemove = $("#confirmRemove");
    confirmRemove.modal({backdrop:'static', keyboard: false, show:false});
}

function deleteVN(selected_rows) {
    var deleteAjaxs = [];
    if (selected_rows && selected_rows.length > 0) {
        var cbParams = {};
        cbParams.selected_rows = selected_rows;
        cbParams.url = "/api/tenants/config/virtual-network/"; 
        cbParams.urlField = "NetworkUUID";
        cbParams.fetchDataFunction = "fetchDataForGridVN";
        cbParams.errorTitle = "Error";
        cbParams.errorShortMessage = "Error in deleting networks - ";
        cbParams.errorField = "Network";
        deleteObject(cbParams);
    }
}

function initActions() {
     Handlebars.registerHelper("IpamList", function(vnData, options){
        if(typeof vnData === 'object' && vnData.IPBlocks && vnData.IPBlocks.length > 0) {
            var returnString = "";
            for(var i=0; i<vnData.IPBlocks.length; i++) {
                returnString += vnData.Ipams[i] + " " + vnData.IPBlocks[i] + " " + vnData.Gateways[i] + "<br>";
            }
        }
        return returnString;
    });

    Handlebars.registerHelper("RTList", function(vnData, options){
        if(typeof vnData === 'object' && vnData.RouteTargets && vnData.RouteTargets.length > 0) {
            var returnString = "";
            for(var i=0; i<vnData.RouteTargets.length; i++) {
                returnString += removeRTString(vnData.RouteTargets[i]) + ((i!==(vnData.RouteTargets.length-1)) ? ", " : "");
            }
        }
        return returnString;
    });

    Handlebars.registerHelper("FipList", function(vnData, options){
        if(typeof vnData === 'object' && vnData.FloatingIPs && vnData.FloatingIPs.length > 0) {
            var returnString = "";
            for(var i=0; i<vnData.FloatingIPs.length; i++) {
                returnString += vnData.FloatingIPs[i] + " " + getAssignedProjectsForIpam(vnData.FloatingIPPools[i]) + "<br>";
            }
        }
        return returnString;
    });

    btnDeleteVN.click(function (a) {
        if(!$(this).hasClass('disabled-link')) {
            confirmMainRemove.find('.modal-header-title').text("Confirm");
            confirmMainRemove.modal('show');
        }
    });

    btnCnfRemoveMainPopupCancel.click(function (a) {
        confirmMainRemove.modal('hide');
    });

    btnCnfRemoveMainPopupOK.click(function (a) {
        var selected_rows = $("#gridVN").data("contrailGrid").getCheckedRows();
        deleteVN(selected_rows);
        confirmMainRemove.modal('hide');
    });
    

    btnCreateVNCancel.click(function (a) {
        windowCreateVN.hide();
    });

    btnCreateVNOK.click(function (a) {
        if($(this).hasClass('disabled-link')) { 
            return;
        }     
        if (validate() !== true)
            return;

        var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
        var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
        if(!isValidDomainAndProject(selectedDomain, selectedProject)) {
            gridVN.showGridMessage('errorGettingData');
            return;
        }
            
        var vnConfig = {};
        vnConfig["virtual-network"] = {};
        vnConfig["virtual-network"]["parent_type"] = "project";

        vnConfig["virtual-network"]["fq_name"] = [];
        vnConfig["virtual-network"]["fq_name"][0] = selectedDomain;
        vnConfig["virtual-network"]["fq_name"][1] = selectedProject;
        vnConfig["virtual-network"]["fq_name"][2] = txtVNName.val();

        vnConfig["virtual-network"]["id_perms"] = {};
        vnConfig["virtual-network"]["id_perms"]["enable"] = $("#ddAdminState").data("contrailDropdown").value();
        
        var policies = $("#msNetworkPolicies").data("contrailMultiselect").getSelectedData();
        if (policies && policies.length > 0) {
            var currentVn = jsonPath(configObj, "$.virtual-networks[?(@.fq_name[2]=='" + txtVNName.val().trim() + "')]");
            vnConfig["virtual-network"]["network_policy_refs"] = [];
            for (var i = 0; i < policies.length; i++) {
                //policies[i] = policies[i].innerHTML;
                vnConfig["virtual-network"]["network_policy_refs"][i] = {};
                vnConfig["virtual-network"]["network_policy_refs"][i]["attr"] = {};
                var tmpPolicy = (policies[i].value).split(":");
                var currentPolicy = null;
                if(tmpPolicy.length > 0){
                    currentPolicy = jsonPath(currentVn, "$..network_policy_refs[?(@.to[0]=='" + tmpPolicy[0] + "' && " +
                    "@.to[1]=='" + tmpPolicy[1] + "' && @.to[2]=='" + tmpPolicy[2] + "')]");
                    vnConfig["virtual-network"]["network_policy_refs"][i]["to"] = [];
                    vnConfig["virtual-network"]["network_policy_refs"][i]["to"][0] = tmpPolicy[0];
                    vnConfig["virtual-network"]["network_policy_refs"][i]["to"][1] = tmpPolicy[1];
                    vnConfig["virtual-network"]["network_policy_refs"][i]["to"][2] = tmpPolicy[2];
                }
                if(currentPolicy && currentPolicy.length > 0) {
                    currentPolicy = currentPolicy[0];
                    var currAttr = currentPolicy.attr;
                    vnConfig["virtual-network"]["network_policy_refs"][i]["attr"]["timer"] = currAttr.timer;
                }
            }
        }

        var allDNSServerArr = getAllDNSServer();
        var DNSServer = formatAllDNSServer(allDNSServerArr);
        var currentHostRout = [];
                var srTuples = $("#srTuples")[0].children;
                if (srTuples && srTuples.length > 0) {
                    for (var j = 0; j < srTuples.length; j++) {
                        var srTuple = $($(srTuples[j]).find("div")[0]).children();
/*                        var srIpam =$($(srTuple[0]).find("div.contrailDropdown")[1]).data("contrailDropdown").text();
                        if(srIpam.indexOf(":") === -1) {
                            srIpam = selectedDomain + ":" + selectedProject + ":" + srIpam;
                        }
                        if(srIpam === vnIpamFqn) {
                            if(typeof vnIpamRef["attr"]["host_routes"] === "undefined") {
                                vnIpamRef["attr"]["host_routes"] = {};
                                vnIpamRef["attr"]["host_routes"]["route"] = [];
                            }

                            vnIpamRef["attr"]["host_routes"]["route"]
                            [vnIpamRef["attr"]["host_routes"]["route"].length] =
                            {
                                "prefix" : $($(srTuple[1]).find("input")).val().trim(),
                                "next_hop" : null,
                                "next_hop_type" : null 
                            }*/
                            var currentHostRoutText = ($($(srTuple[0]).find("input")).val().trim());
                            var currentNextHopText = null;
                            if(($($(srTuple[1]).find("input")).val().trim()) != "")
                                currentNextHopText = ($($(srTuple[1]).find("input")).val().trim());
                            currentHostRout.push({"prefix" : currentHostRoutText,"next_hop" : currentNextHopText, "next_hop_type" : null });
                        //}
                    }
                }
        var mgmtOptions = [];
        var ipamTuples = $("#ipamTuples")[0].children;
        if (ipamTuples && ipamTuples.length > 0) {
            var ipamList = [];            
            for (var i = 0; i < ipamTuples.length; i++) {
                var id = getID(String($("#ipamTuples").children()[i].id));

                var cidr = $("#ipamTuples_"+id+"_txtCIDR").val().trim();
                var currentIpam = $("#ipamTuples_"+id+"_ddSelIpam").data("contrailDropdown").value().trim();
                var allocPoolVal = $("#ipamTuples_"+id+"_txtAllocPool").val().trim();
                var enableDHCP = $("#ipamTuples_"+id+"_chkDHCP")[0].checked;
                var currentGateway = $("#ipamTuples_"+id+"_txtGateway").val().trim();
                var allocation_pools = [];
                var addrFromStart = false;
                if( typeof  allocPoolVal !== null && allocPoolVal !== "") {
                    var tempAllocPools = allocPoolVal.split("\n");                    
                    for(var inc = 0; inc < tempAllocPools.length ; inc++){
                        var ips = tempAllocPools[inc].split("-");
                        if(ips.length == 2)
                            allocation_pools[inc] = {"start":ips[0],"end":ips[1]};
                         else if(ips.length == 1)
                            allocation_pools[inc] = {"start":ips[0],"end":ips[0]};
                    }
                    addrFromStart = true;
                }
                if(ipamList.lastIndexOf(currentIpam) === -1) {
                    mgmtOptions.splice(i, 0, {IPAM: currentIpam, CIDR:cidr, Gateway:currentGateway,EnableDHCP : enableDHCP,AllocPool:allocation_pools,addrStart : addrFromStart , hostRoute:currentHostRout,dNSServert:DNSServer});
                    ipamList.splice(i, 0, currentIpam);
                } else {
                    var lastPos = ipamList.lastIndexOf(currentIpam);
                    mgmtOptions.splice(lastPos+1, 0, {IPAM: "", CIDR:cidr, Gateway:currentGateway,EnableDHCP : enableDHCP , AllocPool:allocation_pools,addrStart : addrFromStart ,hostRoute:currentHostRout,dNSServert:DNSServer});
                    ipamList.splice(lastPos+1, 0, currentIpam);
                }
            }
        }

        if (mgmtOptions && mgmtOptions.length > 0) {
            vnConfig["virtual-network"]["network_ipam_refs"] = [];
            var ipamIndex = 0;
            for (var i = 0; i < mgmtOptions.length; i++) {
                var cidr = mgmtOptions[i].CIDR;
                var ipam = mgmtOptions[i].IPAM;
                var gateway = mgmtOptions[i].Gateway;
                var enable_dhcp = mgmtOptions[i].EnableDHCP;
                var addFromStart = mgmtOptions[i].addrStart;
                var hostRouteTemp = mgmtOptions[i].hostRoute;
                var allocation_pools = mgmtOptions[i].AllocPool;
                var dnsServer = mgmtOptions[i].dNSServert;
                if (ipam !== "") {

                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"] = [];
                    if(ipam.indexOf(":") !== -1) {
                        ipam = ipam.split(":");
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][0] = ipam[0];
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][1] = ipam[1];
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][2] = ipam[2];
                    } else {
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][0] = selectedDomain;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][1] = selectedProject;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["to"][2] = ipam;
                    }
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"] = [];
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["subnet"] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["subnet"]["ip_prefix"] = cidr.split("/")[0];
                    if (null !== cidr.split("/")[1] && "" !== cidr.split("/")[1].trim() && isNumber(parseInt(cidr.split("/")[1])))
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["subnet"]["ip_prefix_len"]
                                = parseInt(cidr.split("/")[1]);
                    else
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["subnet"]["ip_prefix_len"] = 32;

                    //vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["subnet"]["ip_prefix_len"] = parseInt(cidr.split("/")[1]);
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["enable_dhcp"] = enable_dhcp;
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["dns_nameservers"] = [];
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["dhcp_option_list"] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["dhcp_option_list"]["dhcp_option"] = dnsServer;
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["allocation_pools"] = allocation_pools;
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["addr_from_start"] = addFromStart;
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["default_gateway"] = gateway;
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["host_routes"] = {};
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["host_routes"]["route"] = []
                    vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][0]["host_routes"]["route"] = hostRouteTemp;
                }

                for (var j = i + 1; typeof mgmtOptions[j] !== "undefined"; j++) {
                    var newIpam = mgmtOptions[j].IPAM;
                    var cidr = mgmtOptions[j].CIDR;
                    var gateway = mgmtOptions[j].Gateway;
                    var enable_dhcp = mgmtOptions[j].EnableDHCP;
                    var allocation_pools = mgmtOptions[j].AllocPool;
                    var addFromStart = mgmtOptions[j].addrStart;
                    var hostRouteTemp = mgmtOptions[j].hostRoute;
                    var dnsServer = mgmtOptions[j].dNSServert;

                    if (newIpam == "") {
                        i++;
                        var subnetLen = vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"].length;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen] = {};
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["subnet"] = {};
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["subnet"]["ip_prefix"] = cidr.split("/")[0];
                        if (null !== cidr.split("/")[1] && "" !== cidr.split("/")[1].trim() && isNumber(parseInt(cidr.split("/")[1])))
                            vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["subnet"]["ip_prefix_len"]
                                = parseInt(cidr.split("/")[1]);
                        else
                            vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["subnet"]["ip_prefix_len"] = 32;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["dns_nameservers"] = [];


                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["dhcp_option_list"] = {};
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["dhcp_option_list"]["dhcp_option"] = dnsServer;

                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["allocation_pools"] = allocation_pools;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["addr_from_start"] = addFromStart;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["default_gateway"] = gateway;
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["host_routes"] = {};
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["host_routes"]["route"] = []
                        vnConfig["virtual-network"]["network_ipam_refs"][ipamIndex]["attr"]["ipam_subnets"][subnetLen]["host_routes"]["route"] = hostRouteTemp;
                    } else {
                        break;
                    }
                }
                ipamIndex++;
            }
        }

        var floatingIpPools = [];
        var fipTuples = $("#fipTuples")[0].children;
        if (fipTuples && fipTuples.length > 0) {
            for (var i = 0; i < fipTuples.length; i++) {
                var fipTuple = $($(fipTuples[i]).find("div")[0]).children();
                var poolName = $($(fipTuple[0]).find("input")).val();
                var projects=[];
                var lis = $(fipTuple[1]).find("li.select2-search-choice");
                if(lis && lis.length > 0) {
                    for(var j=0; j<lis.length; j++) {
                        var p = $(lis[j]).find("div")[0].innerHTML
                        projects.push(p);
                    }
                }
                floatingIpPools.push({FIPPoolName:poolName, FIPProjects:projects});
            }
        }
        if($("#router_external")[0].checked === true)
            vnConfig["virtual-network"]["router_external"] = true;
        else
            vnConfig["virtual-network"]["router_external"] = false;
            
        if($("#is_shared")[0].checked === true)
            vnConfig["virtual-network"]["is_shared"] = true;
        else
            vnConfig["virtual-network"]["is_shared"] = false;
                    
        if (floatingIpPools && floatingIpPools.length > 0) {
            
            vnConfig["virtual-network"]["floating_ip_pools"] = [];
            for (var i = 0; i < floatingIpPools.length; i++) {
                var fipPoolName = floatingIpPools[i].FIPPoolName;
                vnConfig["virtual-network"]["floating_ip_pools"][i] = {};
                vnConfig["virtual-network"]["floating_ip_pools"][i]["to"] = [];
                vnConfig["virtual-network"]["floating_ip_pools"][i]["to"][0] = selectedDomain;
                vnConfig["virtual-network"]["floating_ip_pools"][i]["to"][1] = selectedProject;
                vnConfig["virtual-network"]["floating_ip_pools"][i]["to"][2] = txtVNName.val();
                vnConfig["virtual-network"]["floating_ip_pools"][i]["to"][3] = fipPoolName;

                var projects = floatingIpPools[i].FIPProjects;
                if (projects && projects.length > 0 && projects[0] != "ALL") {
                    vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"] = [];
                    for (var j = 0; j < projects.length; j++) {
                        vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"][j] = {};
                        vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"][j]["to"] = [];
                        vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"][j]["to"][0] = selectedDomain;
                        vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"][j]["to"][1] = projects[j];
                        var projectUUId = jsonPath(configObj, "$.projects[?(@.fq_name[1]=='" + projects[j] + "')]")[0].uuid;
                        vnConfig["virtual-network"]["floating_ip_pools"][i]["projects"][j]["uuid"] = projectUUId;
                    }
                }
            }
        }
        var routeTargets = [];
        var rtTuples = $("#RTTuples")[0].children;
        if (rtTuples && rtTuples.length > 0) {
            for (var i = 0; i < rtTuples.length; i++) {
                var rtTuple = $($(rtTuples[i]).find("div")[0]).children();
                var rt = $($(rtTuple[0]).find("input")).val();
                var asn = $($(rtTuple[2]).find("input")).val();
                routeTargets.push({RouteTarget:rt + ":" + asn});
            }
        }        
        if (routeTargets && routeTargets.length > 0) {
            vnConfig["virtual-network"]["route_target_list"] = {};
            vnConfig["virtual-network"]["route_target_list"]["route_target"] = [];
            for (var i = 0; i < routeTargets.length; i++) {
                var routeTarget = routeTargets[i].RouteTarget;
                routeTarget = "target:" + routeTarget;
                vnConfig["virtual-network"]["route_target_list"]["route_target"][i] = routeTarget;
            }
        }
        
        var fwdMode = $("#ddFwdMode").val();
        var gvrConfig = configObj["global-vrouter-config"];
        if(null !== gvrConfig && typeof gvrConfig !== "undefined" &&
            null !== gvrConfig["vxlan_network_identifier_mode"] &&
            typeof gvrConfig["vxlan_network_identifier_mode"] !== "undefined" &&
            "configured" === gvrConfig["vxlan_network_identifier_mode"]) {        
            var vxLanId = parseInt($(txtVxLanId).val().trim());
            vnConfig["virtual-network"]["virtual_network_properties"] = {};
            vnConfig["virtual-network"]["virtual_network_properties"]
                ["vxlan_network_identifier"] = vxLanId;
        }
        if(typeof fwdMode !== "undefined" && "" !== fwdMode) {
            if(null === vnConfig["virtual-network"]["virtual_network_properties"] ||
                typeof vnConfig["virtual-network"]["virtual_network_properties"] === "undefined")
            vnConfig["virtual-network"]["virtual_network_properties"] = {};
            vnConfig["virtual-network"]["virtual_network_properties"]
                ["forwarding_mode"] = fwdMode;
        }

        if (txtVNName[0].disabled == true)
            mode = "edit";
        else
            mode = "add";

        console.log(JSON.stringify(vnConfig))
        if (mode === "add") {
            doAjaxCall("/api/tenants/config/virtual-networks", "POST", JSON.stringify(vnConfig),
                "createVNSuccessCb", "createVNFailureCb");
        }
        else if (mode === "edit") {
            var vnUUID = jsonPath(configObj, "$.virtual-networks[?(@.fq_name[2]=='" + txtVNName.val() + "')]")[0].uuid;
            doAjaxCall("/api/tenants/config/virtual-network/" + vnUUID, "PUT", JSON.stringify(vnConfig),
                "createVNSuccessCb", "createVNFailureCb", null, null, 120000);
        }
        windowCreateVN.modal("hide");
    });
}

function createFipoolEntry(fipool, len) {
    dynamicID++;
    id =  dynamicID;
    var inputTxtPoolName = document.createElement("input");
    inputTxtPoolName.type = "text";
    inputTxtPoolName.className = "span12";
    inputTxtPoolName.setAttribute("placeholder", "Pool Name");
    inputTxtPoolName.setAttribute("id","fipTuples_"+id+"_txtFIPPoolName");
    var divPoolName = document.createElement("div");
    divPoolName.className = "span3";
    divPoolName.appendChild(inputTxtPoolName);

    var selectProjects = document.createElement("div");
    selectProjects.className = "span12";
    selectProjects.setAttribute("placeholder", "Select Projects");
    selectProjects.setAttribute("id","fipTuples_"+id+"_msProject");
    var divProjects = document.createElement("div");
    divProjects.className = "span3";
    divProjects.appendChild(selectProjects);
    
    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendFipEntry(this);");
    iBtnAddRule.setAttribute("title", "Add FIP Pool below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteFipEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete FIP Pool");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divPoolName);
    divRowFluidMargin5.appendChild(divProjects);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    //rootDiv.id = "rule_" + len;
    rootDiv.id = "fipTuples_"+id;
    rootDiv.appendChild(divRowFluidMargin5);

    $(selectProjects).contrailMultiselect({
        dataTextField:"text",
        dataValueField:"value"
    });
    $(selectProjects).data("contrailMultiselect").setData($("#ddProjectSwitcher").data("contrailDropdown").getAllData());
    if (null !== fipool && typeof fipool !== "undefined") {
        var poolname = fipool.FIPPoolName;
        var projects = fipool.FIPProjects;
        $(inputTxtPoolName).val(poolname);
        if(fipool.FIPPoolName == "default" && projects.length == 0){
            $(selectProjects).data("contrailMultiselect").setData([{text:"ALL",value:"ALL"}]);
            $(selectProjects).data("contrailMultiselect").value(["ALL"]);
            $(selectProjects).attr("disabled", "disabled");
            $(inputTxtPoolName).attr("disabled", "disabled"); 
            $(divPullLeftMargin5Minus).html("");
        } else {
            $(selectProjects).data("contrailMultiselect").value(projects);
        }
    }    
    return rootDiv;
}

function validateFipEntry() {
    var len = $("#fipTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var poolName =
                $($($($("#fipTuples").children()[i]).find(".span3")[0]).find("input")).val().trim();
            if (typeof poolName === "undefined" || poolName === "") {
                showInfoWindow("Enter Pool name", "Input required");
                return false;
            }
        }
    }
    return true;
}
function appendDNSServerEntry(who, defaultRow) {
    if(validateDNSServer() === false)
        return false;

    var DNSServerEntry = createDNSServerEntry(null, $("#DNSServerTuples").children().length);
    if (defaultRow) {
        $("#DNSServerTuples").prepend($(DNSServerEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(DNSServerEntry, parentEl.nextSibling);
    }
    scrollUp("#windowCreateVN",DNSServerEntry,false);
}

function deleteDNSServerEntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearDNSServerEntry() {
    var tuples = $("#DNSServerTuples").children();
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#DNSServerTuples").empty();
    }
}

function validateDNSServer(){
    var ipamTuples = $("#ipamTuples")[0].children;
    if (ipamTuples.length <= 0) {
        showInfoWindow("Enter atleast one IPAM under Subnet", "Input required");
        return false;
    }
    var len = $("#DNSServerTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var DNSServer =
                $($($($("#DNSServerTuples").children()[i]).find(".span10")[0]).find("input")).val().trim();
            if (typeof DNSServer === "undefined" || DNSServer === "") {
                showInfoWindow("Enter DNS Server", "Input required");
                return false;
            } else if(!validip(DNSServer.trim())){
                showInfoWindow("Enter a valid IP address in xxx.xxx.xxx.xxx/xx format", "Invalid input in DNS Server");
                return false;
            }
        }
    }
    return true;
}

function createDNSServerEntry(DNSNameServer, len) {
    var inputTxtDNSServerName = document.createElement("input");
    inputTxtDNSServerName.type = "text";
    inputTxtDNSServerName.className = "span12";
    inputTxtDNSServerName.setAttribute("placeholder", "DNS Servers");
    var divDNSServerName = document.createElement("div");
    divDNSServerName.className = "span10";
    divDNSServerName.appendChild(inputTxtDNSServerName);
    
    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendDNSServerEntry(this);");
    iBtnAddRule.setAttribute("title", "Add DNS Server below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteDNSServerEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete DNS Server");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5 span5";
    divRowFluidMargin5.appendChild(divDNSServerName);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.id = "rule_" + len;
    rootDiv.className = "span12 margin-0-0-5";
    rootDiv.appendChild(divRowFluidMargin5);

    if (null !== DNSNameServer && typeof DNSNameServer !== "undefined") {
        $(inputTxtDNSServerName).val(DNSNameServer);
    }
    return rootDiv;
}

function getAllDNSServer(){
    var DNSServerTuples = $("#DNSServerTuples")[0].children;
    var allDNSServer = [];
    if (DNSServerTuples && DNSServerTuples.length > 0) {
        for (var i = 0; i < DNSServerTuples.length; i++) {
            var DNSServerTuple = $($(DNSServerTuples[i]).find("div")[0]).children();
            var srIpam = $(DNSServerTuple[0].children[0]).val();
            //if(allDNSServer != "") allDNSServer += ",";
            allDNSServer.push(srIpam);
        }
    }
    return allDNSServer;
}
function formatAllDNSServer(DNSServer){
    var returnDNSServer = [];
    if (DNSServer && DNSServer != "" && DNSServer.length > 0) {
        for (var i = 0; i < DNSServer.length; i++) {
            returnDNSServer.push({"dhcp_option_value":DNSServer[i],"dhcp_option_name": "6"});
        }
    }
    return returnDNSServer;
}

function appendFipEntry(who, defaultRow) {
    if(validateFipEntry() === false)
        return false;

    var fipEntry = createFipoolEntry(null, $("#fipTuples").children().length);
    if (defaultRow) {
        $("#fipTuples").prepend($(fipEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(fipEntry, parentEl.nextSibling);
    }
    scrollUp("#windowCreateVN",fipEntry,false);
}

function deleteFipEntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearFipEntries() {
    var tuples = $("#fipTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#fipTuples").empty();
    }
}

function createIPAMEntry(ipamBlock, len,id,element) {
    var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
    var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
    var networkIpams = jsonPath(configObj, "$.network-ipams[*].fq_name");
    var validIpams = [];
    for(var i=0; i<networkIpams.length; i++) {
        var ipam = networkIpams[i];
        if(ipam[0] === selectedDomain && ipam[1] === selectedProject) {
            validIpams[validIpams.length] = {text:ipam[2],value:selectedDomain+":"+selectedProject+":"+ipam[2]};
        }
        else {
            if(checkSystemProject(ipam[1]))
                continue;
            else
                validIpams[validIpams.length] = {text : ipam[2] + "(" + ipam[0] + ":" + ipam[1] +")" , value: ipam[0] + ":" + ipam[1] + ":" + ipam[2]};
        }
    }
    if(validIpams && validIpams.length <= 0) {
        showInfoWindow("No IPAMs available.", "Error");
        return false;
    }

    var selectIpams = document.createElement("div");
    selectIpams.className = "span12 contrailDropdown";
    selectIpams.setAttribute("placeholder", "Select IPAM");
    selectIpams.setAttribute("id",element+"_"+id+"_ddSelIpam");
    //selectIpams.setAttribute("id", "SelectIPAM");
    var divIpam = document.createElement("div");
    divIpam.className = "span3";
    divIpam.appendChild(selectIpams);
    
    var inputTxtIPBlock = document.createElement("input");
    inputTxtIPBlock.type = "text";
    inputTxtIPBlock.className = "span12";
    inputTxtIPBlock.setAttribute("placeholder", "CIDR");
    inputTxtIPBlock.setAttribute("onblur", "autoPopulateGW(this)");
    inputTxtIPBlock.setAttribute("id",element+"_"+id+"_txtCIDR");
    var divIPBlock = document.createElement("div");
    divIPBlock.className = "span2";
    divIPBlock.appendChild(inputTxtIPBlock);

    var inputTxtAlocPool = document.createElement("textarea");
    inputTxtAlocPool.type = "text";
    inputTxtAlocPool.className = "span12";
    inputTxtAlocPool.col = "span12";
    inputTxtAlocPool.setAttribute("placeholder", "<start ip> - <end-ip><enter> ...");
    inputTxtAlocPool.setAttribute("title", "xxx.xxx.xxx.xxx - xxx.xxx.xxx.xxx<enter> xxx.xxx.xxx.xxx - xxx.xxx.xxx.xxx<enter>...");
    inputTxtAlocPool.setAttribute("onblur", "validateAP(this)");
    inputTxtAlocPool.setAttribute("id",element+"_"+id+"_txtAllocPool");
    inputTxtAlocPool.setAttribute("onkeyup", "textAreaAdjust(this);");

    $(inputTxtAlocPool).keyup(function(e) {
        var id = getID(e.target.id);
        //if(
        $(this).height(1);
        $(this).height(this.scrollHeight + parseFloat($(this).css("borderTopWidth")) + parseFloat($(this).css("borderBottomWidth"))-10);
    });

    var divAlocPool = document.createElement("div");
    divAlocPool.className = "span3";
    divAlocPool.appendChild(inputTxtAlocPool);
    var inputcboxDhcp = document.createElement("input");
    inputcboxDhcp.type = "checkbox";
    inputcboxDhcp.setAttribute("enabled", "enable");
    inputcboxDhcp.className = "ace-input";
    inputcboxDhcp.setAttribute("id",element+"_"+id+"_chkDHCP");
    inputcboxDhcp.setAttribute("onchange", "setHeaderDHCP(this)");
    if($("#chk_headerDHCP")[0].checked === true){
        inputcboxDhcp.checked = true;    
    } else {
        inputcboxDhcp.checked = false;
    }
    var spanInputcboxDhcp = document.createElement("span");
    spanInputcboxDhcp.className = "ace-lbl";
    spanInputcboxDhcp.innerHTML = "&nbsp;";
    
    var divDHCP = document.createElement("div");
    divDHCP.className = "span1";
    divDHCP.appendChild(inputcboxDhcp);
    divDHCP.appendChild(spanInputcboxDhcp);

    var inputTxtGateway = document.createElement("input");
    inputTxtGateway.type = "text";
    inputTxtGateway.className = "span12";
    inputTxtGateway.setAttribute("placeholder", "Gateway");
    inputTxtGateway.setAttribute("id",element+"_"+id+"_txtGateway");
    inputTxtGateway.setAttribute("title", "xxx.xxx.xxx.xxx");
    var divIPGateway = document.createElement("div");
    divIPGateway.className = "span2";
    divIPGateway.appendChild(inputTxtGateway);    

    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendIPAMEntry(this,false,'"+element+"');");
    iBtnAddRule.setAttribute("title", "Add IPAM below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteIPAMEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete IPAM");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divIpam);
    divRowFluidMargin5.appendChild(divIPBlock);
    divRowFluidMargin5.appendChild(divAlocPool);
    divRowFluidMargin5.appendChild(divIPGateway);
    divRowFluidMargin5.appendChild(divDHCP);
    
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    //rootDiv.id = "rule_" + len;//Need to check
    rootDiv.id =  element+"_"+id;
    rootDiv.className = 'rule-item';
    rootDiv.appendChild(divRowFluidMargin5);

    $(selectIpams).contrailDropdown({
        dropdownCssClass: 'select2-medium-width',
        change:checkSREntry,
        dataTextField:"text",
        dataValueField:"value",
    });
    $(selectIpams).data("contrailDropdown").setData(validIpams);
    var ipamindex = 0;
    for(var ind = 0 ;ind< validIpams.length ; ind++){
        if((validIpams[ind].value).split(":")[2] == "default-network-ipam"){
            ipamindex = ind;
            break;
        }
    }
    $(selectIpams).data("contrailDropdown").value(validIpams[ipamindex].value);

    if (null !== ipamBlock && typeof ipamBlock !== "undefined") {
        $(inputTxtIPBlock).val(ipamBlock.IPBlock);
        $(inputTxtGateway).val(ipamBlock.Gateway);
        inputcboxDhcp.checked = ipamBlock.DHCPEnabled;
        $(inputTxtAlocPool).val(ipamBlock.AlocPool);
        var temp_ipam = ipamBlock.IPAM.split(":")
        $(selectIpams).data("contrailDropdown").value((temp_ipam[0]+":"+temp_ipam[1]+":"+temp_ipam[2]));
        $(selectIpams).data("contrailDropdown").enable(false);
        $(inputTxtIPBlock).attr("disabled", "disabled"); 
        $(inputTxtAlocPool).attr("disabled", "disabled");
    }    
    return rootDiv;
}
function textAreaAdjust(o) {
    o.style.height = "1px";
    o.style.height = (o.scrollHeight)+"px";
}
function validateAP(me){
    console.log(me.value);
//ip_range_add
}
function appendIPAMEntry(who, defaultRow,element) {
    if(validateIPAMEntry() === false)
        return false;
    dynamicID++;
    var ipamEntry = createIPAMEntry(null, $("#ipamTuples").children().length,dynamicID,element);
    if (defaultRow) {
        $("#ipamTuples").prepend($(ipamEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(ipamEntry, parentEl.nextSibling);
    }
    scrollUp("#windowCreateVN",ipamEntry,false);

    var ipamTuples = $("#ipamTuples")[0].children;
    var existingIpams = [];
    if (ipamTuples && ipamTuples.length > 0) {
        for (var i = 0; i < ipamTuples.length; i++) {
            var ipamTuple_id = getID(String($("#"+element).children()[i].id));
            var ipam = $("#"+element+"_"+ipamTuple_id+"_ddSelIpam").data("contrailDropdown").value();
            //var ipamTuple = $($(ipamTuples[i]).find("div")[0]).children();
            //var ipam = $(ipamTuple[0].children[1]).data("contrailDropdown").value();
            existingIpams.push(ipam);
        }
    }

    existingIpams = existingIpams.unique();
    /*var srTuples = $("#srTuples")[0].children;
    if (srTuples && srTuples.length > 0) {
        for (var i = 0; i < srTuples.length; i++) {
            var srTuple = $($(srTuples[i]).find("div")[0]).children();
            var srIpam = $(srTuple[0].children[1]).data("contrailDropdown")
            var existingValue = srIpam.value();
            srIpam.setData(existingIpams);
            srIpam.value(existingValue);
        }
    }*/
}

function deleteIPAMEntry(who) {
    //var deletingIpamEntry = $($($(who).parent().parent().find("div.span3")[0]).find("div.contrailDropdown")[1]).data("contrailDropdown").value().trim();
    var howmany = 0;
    var ipamTuples = $("#ipamTuples")[0].children;
    if(ipamTuples.length > 0){
        var srTuples = $("#srTuples")[0].children;
        var DNSTuples = $("#DNSServerTuples")[0].children;
        if ((srTuples && srTuples.length > 0 ) || (DNSTuples && DNSTuples.length > 0)) {
            $("#srTuples").html("");
            $("#DNSServerTuples").html("");
/*        for (var i = 0; i < srTuples.length; i++) {
            var srTuple = $($(srTuples[i]).find("div")[0]).children();
            var srIpam = $(srTuple[0].children[1]).data("contrailDropdown")
            var existingValue = srIpam.value().trim();
            if(existingValue === deletingIpamEntry) {
                var ipamTuples = $("#ipamTuples")[0].children;
                if (ipamTuples && ipamTuples.length > 0) {
                    for (var i = 0; i < ipamTuples.length; i++) {
                        var ipamTuple = $($(ipamTuples[i]).find("div")[0]).children();
                        var ipam = $(ipamTuple[0].children[1]).data("contrailDropdown").value().trim();
                        if(ipam === existingValue) {
                            howmany++;
                        }
                    }
                }
                if(howmany >= 1) {
                    showInfoWindow("Remove all the Host Route(s) with ipam '" + 
                        existingValue + "' before deleting this IPAM entry.", "Error");
                    return false;
                }
            }
        }*/
        } 
        $("#ipamTuples").html("");
    }
//    var templateDiv = who.parentNode.parentNode.parentNode;
//    $(templateDiv).remove();
//    templateDiv = $();
}

function clearIPAMEntries() {
    var tuples = $("#ipamTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#ipamTuples").empty();
    }
}

function validateIPAMEntry() {
    var len = $("#ipamTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            //var ipblock = $($($($("#ipamTuples").children()[i]).find(".span3")[0]).find("input")[0]).val().trim();
            //var gateway = $($($($("#ipamTuples").children()[i]).find(".span2")[3]).find("input")[0]).val().trim();
            var id = getID(String($("#ipamTuples").children()[i].id));
            var ipblock = $("#ipamTuples_"+id+"_txtCIDR").val().trim();
            var gateway = $("#ipamTuples_"+id+"_txtGateway").val().trim();
            var allocPool = $("#ipamTuples_"+id+"_txtAllocPool").val().trim();

            if ("" === ipblock.trim() || !validip(ipblock.trim())) {
                showInfoWindow("Enter a valid CIDR in xxx.xxx.xxx.xxx/xx format", "Invalid input in CIDR");
                return false;
            }
            if(ipblock.split("/").length != 2) {
                showInfoWindow("Enter a valid CIDR in xxx.xxx.xxx.xxx/xx format", "Invalid input in CIDR");
                return false;
            }
            var subnetMask = parseInt(ipblock.split("/")[1]); 
            if(subnetMask > 30) {
                showInfoWindow("Subnet mask can not be greater than 30", "Invalid input in Address Management");
                return false;
            }

            if (validip(gateway.trim())) {
                if(gateway.split("/").length >= 2) {
                    showInfoWindow("Enter a valid Gateway IP address in xxx.xxx.xxx.xxx format", "Invalid input in Address Management");
                    return false;
                }
            } else {
                if("" !== gateway.trim()) {
                    showInfoWindow("Enter a valid Gateway IP address in xxx.xxx.xxx.xxx format", "Invalid input in Address Management");
                    return false;
                }
            }

            if(allocPool.trim() != null && allocPool.trim() !== ""){
                var tempAllocPools = allocPool.split("\n");
                for(var inc = 0; inc < tempAllocPools.length ; inc++){
                    var ips = tempAllocPools[inc].split("-");
                    if(ips.length != 2){
                        showInfoWindow("Enter a valid Allocation Pool range in xxx.xxx.xxx.xxx-xxx.xxx.xxx.xxx &lt;enter&gt; xxx.xxx.xxx.xxx-xxx.xxx.xxx.xxx... format", "Invalid input in Allocation Pool");
                        return false;
                    }
                    if (!validip(ips[0].trim()) || !validip(ips[1].trim())) {
                        showInfoWindow("Enter a valid Allocation Pool address in xxx.xxx.xxx.xxx-xxx.xxx.xxx.xxx &lt;enter&gt; xxx.xxx.xxx.xxx-xxx.xxx.xxx.xxx &lt;enter&gt;... format. <br>eg : 192.168.1.20-192.168.1.40<br>192.168.1.50-192.168.1.70", "Invalid input in Allocation Pool");
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function checkSREntry(what) {
    var removedIpamEntry = what.removed.text;
    var srTuples = $("#srTuples")[0].children;
    if (srTuples && srTuples.length > 0) {
        for (var i = 0; i < srTuples.length; i++) {
            var srTuple = $($(srTuples[i]).find("div")[0]).children();
            var srIpam = $(srTuple[0].children[1]).data("contrailDropdown")
            var existingIpamInHostRoute = srIpam.value().trim();
            if(existingIpamInHostRoute === removedIpamEntry) {
                showInfoWindow("Remove all the Host Route(s) with ipam '" + 
                    existingIpamInHostRoute + "' before changing this IPAM entry.", "Error");
                $(what.currentTarget).data("contrailDropdown").value(removedIpamEntry);
                return false;
            }
        }
    }
}

function createRTEntry(routeTarget, len) {
    var inputTxtRT = document.createElement("input");
    inputTxtRT.type = "text";
    inputTxtRT.className = "span12";
    inputTxtRT.setAttribute("placeholder", "1-65534");
    var divRT = document.createElement("div");
    divRT.className = "span3";
    divRT.appendChild(inputTxtRT);

    var labelColon = document.createElement("span");
    labelColon.innerHTML = ":";
    var divColon = document.createElement("div");
    divColon.className = "span1";
    divColon.appendChild(labelColon);

    var inputTxtASN = document.createElement("input");
    inputTxtASN.type = "text";
    inputTxtASN.className = "span12";
    inputTxtASN.setAttribute("placeholder", "1-4294967295");
    var divASN = document.createElement("div");
    divASN.className = "span3";
    divASN.appendChild(inputTxtASN);

    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendRTEntry(this);");
    iBtnAddRule.setAttribute("title", "Add Route Target below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteRTEntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete Route Target");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divRT);
    divRowFluidMargin5.appendChild(divColon);
    divRowFluidMargin5.appendChild(divASN);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.id = "rule_" + len;
    rootDiv.appendChild(divRowFluidMargin5);
    if (null !== routeTarget && typeof routeTarget !== "undefined") {
        var rt = routeTarget.RouteTarget.split(":");
        var rtNum = rt[0];
        var asn = rt[1];
        $(inputTxtRT).val(rtNum);
        $(inputTxtASN).val(asn);
    }    

    return rootDiv;
}

function validateRTEntry() {
    var len = $("#RTTuples").children().length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var asn =
                $($($($("#RTTuples").children()[i]).find(".span3")).find("input")[0]).val().trim();
            var rt =
                $($($($("#RTTuples").children()[i]).find(".span3")).find("input")[1]).val().trim();

            if (typeof asn === "undefined" || asn === "") {
                showInfoWindow("Enter ASN between 1 to 65534", "Input required");
                return false;
            } else if (isNumber(asn) && asn.indexOf(".") === -1) {
                asn = parseInt(asn);
                if (asn < 1 || asn > 65534) {
                    showInfoWindow("Enter ASN between 1 to 65534", "Input required");
                    return false;
                }
            } else if (isString(asn)) {
                if(!validip(asn)) {
                    showInfoWindow("Invalid IP for ASN.", "Input required");
                    return false;
                } else {
                    if(asn.indexOf("/") !== -1) {
                        showInfoWindow("Enter IP for ASN in xxx.xxx.xxx.xxx format.", "Input required");
                        return false;
                    }                   
                }
            }
            if (typeof rt === "undefined" || rt === "" || !isNumber(rt)) {
                showInfoWindow("Enter value between 1 to 4294967295", "Input required");
                return false;
            } else if (isNumber(rt)) {
                rt = parseInt(rt);
                if(isString(asn) && asn.indexOf("/") === -1 && validip(asn)) {
                    if (rt < 1 || rt > 65535) {
                        showInfoWindow("Enter value between 1 to 65535", "Input required");
                        return false;
                    }
                } else if(isNumber(asn) && (asn+"").indexOf(".") === -1) {
                    if (rt < 1 || rt > 4294967295) {
                        showInfoWindow("Enter value between 1 to 4294967295", "Input required");
                        return false;
                    }
                }
            }
        }
    }
    return true;
}
function appendRTEntry(who, defaultRow) {
    if(validateRTEntry() === false)
        return false;
    var rtEntry = createRTEntry(null, $("#RTTuples").children().length);
    if (defaultRow) {
        $("#RTTuples").prepend($(rtEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(rtEntry, parentEl.nextSibling);
    }
    //if($(rootDiv)[0].getBoundingClientRect().height >= Math.abs(
    scrollUp("#windowCreateVN",rtEntry,false);
}

function deleteRTEntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearRTEntries() {
    var tuples = $("#RTTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#RTTuples").empty();
    }
}

function createSREntry(staticRoute, len) {
    var nextHopSR = document.createElement("input");
    nextHopSR.type = "text";
    nextHopSR.className = "span12";
    nextHopSR.setAttribute("placeholder", "Next Hop");
    var divIpam = document.createElement("div");
    divIpam.className = "span3";    
    divIpam.appendChild(nextHopSR);

    var inputTxtSR = document.createElement("input");
    inputTxtSR.type = "text";
    inputTxtSR.className = "span12";
    inputTxtSR.setAttribute("placeholder", "Route Prefix");
    var divSR = document.createElement("div");
    divSR.className = "span3";
    divSR.appendChild(inputTxtSR);


    var iBtnAddRule = document.createElement("i");
    iBtnAddRule.className = "icon-plus";
    iBtnAddRule.setAttribute("onclick", "appendSREntry(this);");
    iBtnAddRule.setAttribute("title", "Add Host Route below");

    var divPullLeftMargin5Plus = document.createElement("div");
    divPullLeftMargin5Plus.className = "pull-left margin-5";
    divPullLeftMargin5Plus.appendChild(iBtnAddRule);

    var iBtnDeleteRule = document.createElement("i");
    iBtnDeleteRule.className = "icon-minus";
    iBtnDeleteRule.setAttribute("onclick", "deleteSREntry(this);");
    iBtnDeleteRule.setAttribute("title", "Delete Host Route");

    var divPullLeftMargin5Minus = document.createElement("div");
    divPullLeftMargin5Minus.className = "pull-left margin-5";
    divPullLeftMargin5Minus.appendChild(iBtnDeleteRule);

    var divRowFluidMargin5 = document.createElement("div");
    divRowFluidMargin5.className = "row-fluid margin-0-0-5";
    divRowFluidMargin5.appendChild(divSR);
    divRowFluidMargin5.appendChild(divIpam);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Plus);
    divRowFluidMargin5.appendChild(divPullLeftMargin5Minus);

    var rootDiv = document.createElement("div");
    rootDiv.id = "rule_" + len;
    rootDiv.appendChild(divRowFluidMargin5);

    if (null !== staticRoute && typeof staticRoute !== "undefined") {
        $(inputTxtSR).val(staticRoute.prefix);
        $(nextHopSR).val(staticRoute.next_hop);
    }    
    return rootDiv; 
}

function validateSREntry() {
    var srTuples = $("#srTuples")[0].children;
    var len = srTuples.length;
    if(len > 0) {
        for(var i=0; i<len; i++) {
            var srTuple = $($(srTuples[i]).find("div")[0]).children();
            var hostRoute = $($(srTuple[0]).find("input")).val().trim();
            if (typeof hostRoute === "undefined" || "" === hostRoute ||
                hostRoute.indexOf("/") === -1 || !validip(hostRoute)) {
                showInfoWindow("Enter a valid IP address for Rout Prefix in xxx.xxx.xxx.xxx/xx format", "Invalid input for Host Routes");
                return false;
            }
            srTuple = $($(srTuples[i]).find("div")[2]).children();
            if($(srTuple[0]).val() != undefined && $(srTuple[0]).val().trim != ""){
                var nextHop = $(srTuple[0]).val().trim();
                if (typeof nextHop === "undefined" || "" === nextHop ||
                    nextHop.indexOf("/") >= 0 || !validip(nextHop)) {
                    showInfoWindow("Enter a valid IP address for Next Hop in xxx.xxx.xxx.xxx format", "Invalid input for Host Routes");
                    return false;
                }
            }
        }
    }
    return true;
}
function toggleFIP(){
    var checkedval = $("#router_external")[0].checked;
    if(checkedval == true){
        var fipPool = [];
            fipPool.push({"FIPPoolName":"default", "FIPProjects":[]});
            var fipEntry = createFipoolEntry(fipPool[0], 0);
            $("#fipTuples").prepend($(fipEntry));
    } else {
        var fipTuples = $("#fipTuples")[0].children;
        if (fipTuples && fipTuples.length > 0) {
            for (var i = 0; i < fipTuples.length; i++) {
                var id = getID($("#fipTuples").children()[i].id);
                var poolName = $("#fipTuples_"+id+"_txtFIPPoolName").val();
                var projects = $("#fipTuples_"+id+"_msProject").data("contrailMultiselect").getSelectedData();
                if(poolName == "default" && projects != undefined && projects.length > 0 && projects[0].value == "ALL" ){
                    //$(fipTuples[i]).html("");
                    $(fipTuples[i]).remove();
                }
            }
        }
    }
}
function appendSREntry(who, defaultRow) {
    var ipamTuples = $("#ipamTuples")[0].children;
    if (ipamTuples.length <= 0) {
        showInfoWindow("Enter atleast one IPAM under Subnet", "Input required");
        return false;
    }
    if(validateSREntry() === false)
        return false;

    var srEntry = createSREntry(null, $("#srTuples")[0].children);
    if (defaultRow) {
        $("#srTuples").prepend($(srEntry));
    } else {
        var parentEl = who.parentNode.parentNode.parentNode;
        parentEl.parentNode.insertBefore(srEntry, parentEl.nextSibling);
    }
    scrollUp("#windowCreateVN",srEntry,false);
}

function deleteSREntry(who) {
    var templateDiv = who.parentNode.parentNode.parentNode;
    $(templateDiv).remove();
    templateDiv = $();
}

function clearSREntries() {
    var tuples = $("#srTuples")[0].children;
    if (tuples && tuples.length > 0) {
        var tupleLength = tuples.length;
        for (var i = 0; i < tupleLength; i++) {
            $(tuples[i]).empty();
        }
        $(tuples).empty();
        $("#srTuples").empty();
    }
}

function populateDomains(result) {
    if (result && result.domains && result.domains.length > 0) {
        var domains = [];
        for (i = 0; i < result.domains.length; i++) {
            var domain = result.domains[i];
            tmpDomain = {text:domain.fq_name[0], value:domain.uuid};
            domains.push(tmpDomain);
        }
        $("#ddDomainSwitcher").data("contrailDropdown").setData(domains);
        var sel_domain = getSelectedDomainProjectObjNew("ddDomainSwitcher", "contrailDropdown", 'domain');
        $("#ddDomainSwitcher").data("contrailDropdown").value(sel_domain);
        fetchProjects("populateProjects", "failureHandlerForGridVN");
    } else {
        $("#gridVN").data("contrailGrid")._dataView.setData([]);
        btnCreateVN.addClass('disabled-link');
        setDomainProjectEmptyMsg('ddDomainSwitcher', 'domain');        
        setDomainProjectEmptyMsg('ddProjectSwitcher', 'project');
        gridVN.showGridMessage("empty");
        emptyCookie('domain');
        emptyCookie('project');        
    }    
}

function handleDomains(e) {
    //fetchDataForGridVN();
    //Get projects for the selected domain.
    var dName = e.added.text;
    setCookie("domain", dName);
    fetchProjects("populateProjects", "failureHandlerForGridVN");
}

function populateProjects(result) {
    if (result && result.projects && result.projects.length > 0) {
        //var projects = jsonPath(result, "$.projects[*].fq_name[1]");
        var projects = [];
        for (i = 0; i < result.projects.length; i++) {
            var project = result.projects[i];
            //if(!checkSystemProject(project.fq_name[1])) {
                tempProjectDetail = {text:project.fq_name[1], value:project.uuid};
                projects.push(tempProjectDetail);
            //}
        }

        $("#ddProjectSwitcher").contrailDropdown({
            dataTextField:"text",
            dataValueField:"value",
            change:handleProjects
        });
        btnCreateVN.removeClass('disabled-link')
        $("#ddProjectSwitcher").data("contrailDropdown").enable(true);
        $("#ddProjectSwitcher").data("contrailDropdown").setData(projects);
        var sel_project = getSelectedDomainProjectObjNew("ddProjectSwitcher", "contrailDropdown", 'project');
        $("#ddProjectSwitcher").data("contrailDropdown").value(sel_project);
        fetchDataForGridVN();
    } else {
        $("#gridVN").data("contrailGrid")._dataView.setData([]);
        btnCreateVN.addClass('disabled-link');
        setDomainProjectEmptyMsg('ddProjectSwitcher', 'project');
        gridVN.showGridMessage("empty");
        emptyCookie('project');
    }
}

function handleProjects(e) {
    var pname = e.added.text;
    setCookie("project", pname);
    fetchDataForGridVN();
}

function autoPopulateGW(me) {
    var ip = $(me).val();
    var id = getID($(me)[0].id);
    if(ip.indexOf("/") !== -1 && !isNaN(ip.split("/")[1])) {
        try {
            var ip_arrs = ip_range(ip, []);
            var default_gw = ip_arrs[ip_arrs.length - 1];
            $("#ipamTuples_"+id+"_txtGateway").val(default_gw);
        } catch (e) {
            $("#ipamTuples_"+id+"_txtGateway").val("");
        }
    }
}

function fetchDataForGridVN() {
    $("#cb_gridVN").attr("checked", false);
    var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
    var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
    if(!isValidDomainAndProject(selectedDomain, selectedProject)) {
        gridVN.showGridMessage('errorGettingData');
        return;
    }
    $("#gridVN").data("contrailGrid")._dataView.setData([]);
    configObj["virtual-networks"] = [];
    gridVN.showGridMessage('loading');
    idCount = 0;
    vnAjaxcount = vnAjaxcount+1;
    ajaxParam = $("#ddProjectSwitcher").data("contrailDropdown").value()+"_"+vnAjaxcount;
    doAjaxCall("/api/admin/config/get-data?type=virtual-network&count=4&fqnUUID="+$("#ddProjectSwitcher").data("contrailDropdown").value(),
        "GET", null, "successHandlerForGridVNLoop", "failureHandlerForGridVN", null, ajaxParam);
}


function successHandlerForGridVNLoop(result,cbparam){
    if(cbparam != ajaxParam){
        return;
    }
    if(result.more == true || result.more == "true"){
        
        doAjaxCall("/api/admin/config/get-data?type=virtual-network&count=4&fqnUUID="+ 
            $("#ddProjectSwitcher").data("contrailDropdown").value() +"&lastKey="+result.lastKey, 
            "GET", null, "successHandlerForGridVNLoop", "failureHandlerForGridVN", null, cbparam); 
    } else {
        doAjaxCall("/api/tenants/config/shared-virtual-networks/", 
            "GET", null, "successHandlerForAppendShared", "failureHandlerForAppendShared", null, cbparam);        
    }
    successHandlerForGridVNRow(result);
}

function successHandlerForAppendShared(result){
    //console.log(JSON.stringify(result));
    var uniqueNetwork = [];
    var vnData = $("#gridVN").data("contrailGrid")._dataView.getItems();
    for(var i=0;i<result.length;i++){
        var unique = false;
        for(var j = 0;j<vnData.length;j++){
            if(vnData[j].NetworkUUID == result[i]["virtual-network"]["uuid"]){
                unique = true;
                break;
            }
        }
        if(unique == false){
            uniqueNetwork.push(result[i]);
        }
    }
    if(uniqueNetwork.length > 0){
        successHandlerForGridVNRow(uniqueNetwork);
    }
}


function successHandlerForGridVN(result) {
    var uuids = jsonPath(result, "$..uuid");
    var getAjaxs = [];
    for (var i = 0; i < uuids.length; i++) {
        getAjaxs[i] = $.ajax({
            url:"/api/tenants/config/virtual-network/" + uuids[i],
            type:"GET"
        });
    }
    $.when.apply($, getAjaxs).then(
        function () {
            //all success
            var results = arguments;
            successHandlerForGridVNRow(results);
        },
        function () {
            //If atleast one api fails
            var results = arguments;
            failureHandlerForGridVNRow(results);
        });
}

function failureHandlerForGridVN(result) {
    $("#btnCreateVN").addClass('disabled-link');
    gridVN.showGridMessage('errorGettingData');
}

function showRemoveWindow(rowIndex) {
    $.contrailBootstrapModal({
       id: 'confirmRemove',
       title: 'Remove',
       body: '<h6>Confirm Virtual Network delete</h6>',
       footer: [{
           title: 'Cancel',
           onclick: 'close',
       },
       {
           id: 'btnRemovePopupOK',
           title: 'Confirm',
           rowIdentifier: rowIndex,
           onclick: function(){
               var rowNum = this.rowIdentifier;
               var selected_row = $("#gridVN").data("contrailGrid")._dataView.getItem(rowNum);
               deleteVN([selected_row]);
               $('#confirmRemove').modal('hide');
           },
           className: 'btn-primary'
       }
       ]
   });
 }

function successHandlerForGridVNRow(result) {
    gridVN.removeGridMessage();
    var vnData = $("#gridVN").data("contrailGrid")._dataView.getItems();
    var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
    var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
    var networks = jsonPath(result, "$..virtual-network");
    for (var i = 0; i < networks.length; i++) {
        configObj["virtual-networks"].push(networks[i]);
        var vn = networks[i];
        var vnName = jsonPath(vn, "$.fq_name[2]");

        if (typeof vnName === "object" && vnName.length === 1)
            vnName = vnName[0];
        else
            vnName = "";

        var uuid = jsonPath(vn, "$.uuid");
        if (typeof uuid === "object" && uuid.length === 1)
            uuid = uuid[0];
        var parent_uuid = jsonPath(vn, "$.parent_uuid");
        if (typeof parent_uuid === "object" && parent_uuid.length === 1)
            parent_uuid = parent_uuid[0];
        var reorder_policies;
        var policies = jsonPath(vn, "$.network_policy_refs[*]");
        var reorder_policies_temp = reorderPolicies(policies)
        if (reorder_policies_temp === false) {
            reorder_policies = "";
        } else {
            if(reorder_policies_temp.length >= 1){
                reorder_policies = [];
                for(var k=0; k<reorder_policies_temp.length; k++) {
                    var splitPolicy = reorder_policies_temp[k].split(":");
                    if(selectedDomain == splitPolicy[0] && selectedProject == splitPolicy[1]) {
                        reorder_policies.push(splitPolicy[2]);
                    } else {
                        reorder_policies.push(splitPolicy[2] +" ("+splitPolicy[0] +":"+splitPolicy[1]+")");
                    }
                }
            }
        }

        var subnets = jsonPath(vn, "$.network_ipam_refs[*].subnet.ipam_subnet");
        if (subnets === false) {
            subnets = "";
        } else {
            subnets = subnets.unique();
        }

        var ipams = jsonPath(vn, "$.network_ipam_refs[*].subnet.ipam");
        if (ipams === false) {
            ipams = "";
        } else {
            if(ipams && ipams.length > 0) {
                for(var j=0; j<ipams.length; j++) {
                    if(ipams[j][0] === selectedDomain && ipams[j][1] === selectedProject) {
                        ipams[j] = ipams[j][2];
                    } else {
                        ipams[j] = ipams[j][2] + " (+"+ ipams[j][0] + ":" + ipams[j][1] + ")";
                    }
                }
            }
        }
        var hostRoutes = "";
        var ipamRefs = jsonPath(vn, "$.network_ipam_refs[*]");
        var allSubnets = [];
        var DNSServer = "";
        var allDNSServer = [];
        allDNSServer = createUniqueDNSServer(ipamRefs);
        DNSServer =  allDNSServer.join("<br>");

        var hostRoutPrifix = "";
        var hostRoutPrifixArr = createUniqueHostRout(ipamRefs);
        for(var hrInc = 0;hrInc <hostRoutPrifixArr.length;hrInc++){
            if(hostRoutPrifixArr[hrInc]["next_hop"] != null && hostRoutPrifixArr[hrInc]["next_hop"] != ""){
                hostRoutPrifix += hostRoutPrifixArr[hrInc]["prefix"] + " " +hostRoutPrifixArr[hrInc]["next_hop"]+"<br>";
            } else {
                hostRoutPrifix += hostRoutPrifixArr[hrInc]["prefix"]+"<br>";
            }
        }
        for (var j = 0; j < ipamRefs.length; j++) {
            var ipam = jsonPath(ipamRefs[j], "$..subnet.ipam[*]");
            var cidr = vn["network_ipam_refs"][j]["subnet"]["ipam_subnet"];
            var default_gateway = vn["network_ipam_refs"][j]["subnet"]["default_gateway"];
            //Need to do
            var alocPools = vn["network_ipam_refs"][j]["subnet"]["allocation_pools"];
            
            var AllocationPool = formatAlcPoolObj(alocPools);
            AllocationPool = AllocationPool.replace(/\n/g,"<br>");
            AllocationPool = AllocationPool.replace(/-/g," - ");
            AllocationPool = AllocationPool.replace(/  /g," ");
            var dhcpEnabled = vn["network_ipam_refs"][j]["subnet"]["enable_dhcp"];
            if(true == dhcpEnabled){
                dhcpEnabled = "Enabled";
            } else {
                dhcpEnabled = "Disabled";
            }
            if(selectedDomain === ipam[0] &&
                selectedProject === ipam[1]) {
                ipam = ipam[2];
            } else {
                ipam = ipam[2] + " (" + ipam[0] + ":" + ipam[1] +")";
            }
            allSubnets.push({"ipam":ipam , "CIDR" : cidr,"AllocationPool":AllocationPool,"DHCPEnabled": dhcpEnabled,"default_gateway":default_gateway,"hostroute": hostRoutPrifix,"DNSServer":DNSServer})
        }
        var gateways = jsonPath(vn, "$.network_ipam_refs[*].subnet.default_gateway");
        if (gateways === false) {
            gateways = "";
        }
        
        var fips = jsonPath(vn, "$.floating_ip_pools[*].to[3]");
        if (fips === false) {
            fips = "";
        }
        var fipoolProjects = jsonPath(vn, "$.floating_ip_pools[*]");
        if (fipoolProjects === false) {
            fipoolProjects = "";
        }

        var routeTargets = jsonPath(vn, "$.route_target_list.route_target[*]");
        if (routeTargets === false) {
            routeTargets = "";
        }
        var sh = "Disabled";
        if(String(vn["is_shared"]) == "true") 
            sh = "Enabled";
        var Shared = sh;
        var ext = "Enabled";
        if(String(vn["router_external"])== "false")
            ext = "Disabled";
        var External = ext;

        //Need to do
        var adminState = "-";
        if(String(vn["id_perms"]["enable"]).toLowerCase() === "true")
            adminState = "Up";
        else if(String(vn["id_perms"]["enable"]).toLowerCase() == "false")
            adminState = "Down";

        
        var fwdMode = jsonPath(vn, "$.virtual_network_properties.forwarding_mode");
        if (fwdMode !== false && typeof fwdMode !== "undefined" && fwdMode.length > 0) {
            fwdMode = fwdMode[0];
            if(fwdMode === "l2_l3" || fwdMode === null) {
                fwdMode = "L2 and L3";
            } else if(fwdMode === "l2") {
                fwdMode = "L2 Only";
            }
        } else {
            fwdMode = "";
        }
        
        var vxlanid = jsonPath(vn, "$.virtual_network_properties.vxlan_network_identifier");
        if (vxlanid !== false && typeof vxlanid !== "undefined" && vxlanid.length > 0) {
            vxlanid = vxlanid[0];
            if(null === vxlanid) {
                vxlanid = "Automatic";
            } 
        } else {
            vxlanid = "Automatic";
        }
        //if(vn.fq_name[1] == selectedProject){
            vnData.push({"id":idCount++, "Network":vnName, "AttachedPolicies":reorder_policies, "IPBlocks":subnets, "HostRoutes":hostRoutPrifix, "Ipams":ipams, "FloatingIPs":fips,"allSubnets":allSubnets, "FloatingIPPools":fipoolProjects, "RouteTargets":routeTargets,"adminState":adminState, "Shared" : Shared,"Extend" : External, "DNSServer": DNSServer,  "ForwardingMode" : fwdMode, "VxLanId": vxlanid, "NetworkUUID":uuid,"parent_uuid":parent_uuid});
        //}
    }
    if(result.more == true || result.more == "true"){
        gridVN.showGridMessage('loading');
    } else {
        if(!vnData || vnData.length<=0)
            gridVN.showGridMessage('empty');
    }
    $("#gridVN").data("contrailGrid")._dataView.setData(vnData);
}

function createUniqueHostRout(ipamRefs){
    var hostRoutPrifixArr = [];
        if(ipamRefs != false && ipamRefs != ""){
            for (var j = 0; j < ipamRefs.length; j++) {
                if(ipamRefs[j]["subnet"]["host_routes"] != "" && ipamRefs[j]["subnet"]["host_routes"]["route"].length > 0){
                    var tempRouter = ipamRefs[j]["subnet"]["host_routes"]["route"];
                    for(var inc = 0;inc < tempRouter.length ;inc++){
                        var unique = false;
                        for(var uni = 0;uni < hostRoutPrifixArr.length ;uni++){
                            if(hostRoutPrifixArr[uni]["prefix"] == tempRouter[inc]["prefix"] && hostRoutPrifixArr[uni]["next_hop"] == tempRouter[inc]["next_hop"]){
                                unique = true;
                                break;
                            }
                        }
                        if(unique == false) {
                            hostRoutPrifixArr.push(tempRouter[inc]);
                        }
                    }
                }
            }
        }
return hostRoutPrifixArr;
}
function createUniqueDNSServer(ipamRefs){
    var allDNSServer = [];
        if(ipamRefs != false && ipamRefs != ""){
            for (var j = 0; j < ipamRefs.length; j++) {
                if(ipamRefs[j]["subnet"]["dhcp_option_list"] != ""){
                var DNSServertemp = ipamRefs[j]["subnet"]["dhcp_option_list"]["dhcp_option"];
                if(DNSServertemp.length > 0) {
                    for(var inc = 0 ; inc < DNSServertemp.length ; inc++){
                        if(DNSServertemp[inc]["dhcp_option_name"] == "6") {
                            var available = true;
                            for(var uni = 0; uni < allDNSServer.length ; uni++){ 
                                if(allDNSServer[uni] == DNSServertemp[inc]["dhcp_option_value"])
                                    available = false;
                            }
                            if(available == true){
                                allDNSServer.push(DNSServertemp[inc]["dhcp_option_value"]);
                            }
                        }
                    }
                }}
            }
        }
    return allDNSServer;
}
function reorderPolicies(policies){
    
    if(policies === false){
        return false;
    }
    if(policies.length === 0) {
        return [];
    }
    var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
    var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
    var reordered = [];
    if(policies.length === 1) {
//        if(selectedDomain === policies[0].to[0] && selectedProject === policies[0].to[1]) {
//            reordered.push(policies[0].to[2]);  
//        } else {
            reordered.push(policies[0].to.join(":"));
//        }
        return reordered;
    }
    for(var j=0; j<policies.length-1; j++) {
        for(var i=j; i<policies.length; i++) {
            if(isNumber(policies[i].attr.sequence.major) && isNumber(policies[j].attr.sequence.major) ){
                if(Number(JSON.stringify(policies[j].attr.sequence.major)) >  Number(JSON.stringify(policies[i].attr.sequence.major)) ){
                    var pol = policies[j];
                    policies[j] = policies[i];
                    policies[i] = pol;
                }
            }
        }
    }
    for(var k=0; k<policies.length; k++) {
//        if(selectedDomain === policies[k].to[0] && selectedProject === policies[k].to[1]) {
//            reordered.push(policies[k].to[2]);  
//        } else {
            reordered.push(policies[k].to.join(":"));
//        }        
    }
    return reordered;
}

function failureHandlerForGridVNRow(result, cbParam) {
    gridVN.showGridMessage('errorGettingData');
}

function initGridVNDetail(e) {
    var detailRow = e.detailRow;
}

function closeCreateVNWindow() {
    clearValuesFromDomElements();
}

function clearValuesFromDomElements() {
    mode = "";
    txtVNName.val("");
    txtVxLanId.val("");
    txtVNName[0].disabled = false;
    $("#ddFwdMode").data("contrailDropdown").value("l2_l3");
    $("#ddFwdMode").data("contrailDropdown").enable(false);
    $("#ddAdminState").data("contrailDropdown").value("true");
    $("#router_external")[0].checked = false;
    $("#is_shared")[0].checked = false;
    msNetworkPolicies.data("contrailMultiselect").value("");

    clearFipEntries();
    clearRTEntries();
    clearSREntries();
    clearIPAMEntries();
    clearDNSServerEntry();
}

function setVxLanIdAuto() {
    $(txtVxLanId).val("");
    $(txtVxLanId)[0].setAttribute("placeholder", "Automatic");
    $(txtVxLanId)[0].disabled = 'disabled';
}

function compare(a,b) {
    if (a.IPAM < b.IPAM)
        return -1;
    if (a.IPAM > b.IPAM)
        return 1;
    return 0;
}

function showVNEditWindow(mode, rowIndex) {
    if($("#btnCreateVN").hasClass('disabled-link')) {
        return;
    }

    $("#widgetFip").addClass("collapsed");
    $("#widgetRT").addClass("collapsed");
    $("#widgetStaticRoutes").addClass("collapsed");
    var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
    var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
    if(mode == "edit"){
        var selectedRow = $("#gridVN").data("contrailGrid")._dataView.getItem(rowIndex);
        var projectuuid = $("#ddProjectSwitcher").data("contrailDropdown").value()
        if(selectedRow.parent_uuid != projectuuid){
            showInfoWindow(selectedRow.Network + " cannot be edited.", "Not Editable");
            return false;
        }
    }
    if(!isValidDomainAndProject(selectedDomain, selectedProject)) {
        return;
    }

    var getAjaxs = [];
    getAjaxs[0] = $.ajax({
        url:"/api/tenants/config/policys",
        type:"GET"
    });

    getAjaxs[1] = $.ajax({
        url:"/api/tenants/config/ipams",
        type:"GET"
    });

    getAjaxs[2] = $.ajax({
        url:"/api/tenants/config/global-vrouter-config",
        type:"GET"
    });
    $.when.apply($, getAjaxs).then(
        function () {
            //all success
            clearValuesFromDomElements();
            var results = arguments;
            var networkPolicies = jsonPath(results[0][0], "$.network-policys[*]");
            var nps = [];
            configObj["network-policys"] = [];
            var selectedDomain = $("#ddDomainSwitcher").data("contrailDropdown").text();
            var selectedProject = $("#ddProjectSwitcher").data("contrailDropdown").text();
            if (null !== networkPolicies && typeof networkPolicies === "object" && networkPolicies.length > 0) {
                for (var i = 0; i < networkPolicies.length; i++) {
                    configObj["network-policys"][i] = {};
                    configObj["network-policys"][i] = networkPolicies[i];
                    var domain = networkPolicies[i]["fq_name"][0];
                    var project = networkPolicies[i]["fq_name"][1];
                    if(domain === selectedDomain && project === selectedProject) {
                        nps[nps.length] = {text:networkPolicies[i]["fq_name"][2],value:networkPolicies[i]["fq_name"].join(":")};
                    } else {
                         //var localText = networkPolicies[i]["fq_name"][2]+'('+networkPolicies[i]["fq_name"][0]+':'+networkPolicies[i]["fq_name"][0];
                        nps[nps.length] = {text:networkPolicies[i]["fq_name"][2]+" ("+networkPolicies[i]["fq_name"][0]+":"+networkPolicies[i]["fq_name"][0]+") " ,value:networkPolicies[i]["fq_name"].join(":")};
                        //nps[nps.length] = {text:localText,value:networkPolicies[i]["fq_name"].join(":")};
                        //nps[nps.length] = {text:networkPolicies[i]["fq_name"].join(":"),value:networkPolicies[i]["fq_name"].join(":")};

                    }
                }
            }
            msNetworkPolicies.data("contrailMultiselect").setData(nps);
            
            var nwIpams = jsonPath(results[1][0], "$.network-ipams[*]");
            if (null !== nwIpams && typeof nwIpams === "object" && nwIpams.length > 0) {
                configObj["network-ipams"] = [];
                for (var i = 0; i < nwIpams.length; i++) {
                    configObj["network-ipams"][i] = {};
                    configObj["network-ipams"][i] = nwIpams[i];
                }
            }

            var gvrConfig = jsonPath(results[2][0], "$.global-vrouter-config");
            if(null !== gvrConfig && typeof gvrConfig !== "undefined" &&
                gvrConfig.length > 0) {
                gvrConfig = gvrConfig[0];
                configObj["global-vrouter-config"] = {};
                configObj["global-vrouter-config"] = gvrConfig;
                if(null !== gvrConfig["vxlan_network_identifier_mode"] && 
                    typeof gvrConfig["vxlan_network_identifier_mode"] !== "undefined") {
                    if("automatic" === gvrConfig["vxlan_network_identifier_mode"]) {
                        setVxLanIdAuto();
                    }
                } else {
                    //Set default 'automatic' for VxLANIdentifierMode
                    setVxLanIdAuto();
                }
            } else {
                setVxLanIdAuto();
            }
            var validIpams = [];
            var networkIpams = jsonPath(results[1][0], "$.network-ipams[*].fq_name");
            for(var i=0; i<networkIpams.length; i++) {
                var ipam = networkIpams[i];
                if(ipam[0] === selectedDomain && ipam[1] === selectedProject) {
                    validIpams[validIpams.length] = ipam[2];
                }
                else {
                    if(checkSystemProject(ipam[1]))
                        continue;
                    else
                        validIpams[validIpams.length] = ipam[0] + ":" + ipam[1] + ":" + ipam[2];
                }
            }
            if (mode === "add") {
                windowCreateVN.find('h6.modal-header-title').text('Create Network');
                $(txtVNName).focus();
            } else if (mode === "edit") {
                var selectedRow = $("#gridVN").data("contrailGrid")._dataView.getItem(rowIndex);
                if(null === selectedRow || typeof selectedRow === "undefined" || {} === selectedRow ||
                    [] === selectedRow || "" === selectedRow) {
                    return false;
                }
                txtVNName.val(selectedRow.Network);
                txtVNName[0].disabled = true;
                windowCreateVN.find('h6.modal-header-title').text('Edit Network ' + selectedRow.Network);
                var rowId = selectedRow["id"];
                var selectedVN = configObj["virtual-networks"][rowId];

                var policies = jsonPath(selectedVN, "$.network_policy_refs[*]");
                var reordered_policies = reorderPolicies(policies);
                if (reordered_policies && reordered_policies.length > 0)
                    msNetworkPolicies.data("contrailMultiselect").value(reordered_policies);
                else
                    msNetworkPolicies.data("contrailMultiselect").value("");

                var ipams = jsonPath(selectedVN, "$.network_ipam_refs[*].subnet.ipam");
                var ipBlocks = jsonPath(selectedVN, "$.network_ipam_refs[*].subnet.ipam_subnet");
                var gateways = jsonPath(selectedVN, "$.network_ipam_refs[*].subnet.default_gateway");
                //Need to do
                var alocPools = jsonPath(selectedVN, "$.network_ipam_refs[*].subnet.allocation_pools");
                var AlocPool="";
                if(typeof alocPools[0] != null && typeof alocPools[0] != undefined && typeof alocPools[0] != "")
                    AlocPool = formatAlcPoolObj(alocPools[0]); 
                var DHCPEnabled = jsonPath(selectedVN, "$.network_ipam_refs[*].subnet.enable_dhcp");;
                if (ipams && ipams.length > 0) {
                    var existing = [];
                    for (var i = 0; i < ipams.length; i++) {
                        var ipblock = ipBlocks[i];
                        var ipam = ipams[i];
                        var gateway = gateways[i];

                        existing.push({"IPBlock":ipblock, "IPAM":ipam.join(":"), "Gateway":gateway,"DHCPEnabled":DHCPEnabled,"AlocPool":AlocPool});
                    }
                    for(var k=0; k<existing.length; k++) {
                        dynamicID++;
                        var ipamEntry = createIPAMEntry(existing[k], $("#ipamTuples").children().length,dynamicID,"ipamTuples");
                        $("#ipamTuples").append($(ipamEntry));
                        textAreaAdjust($("#ipamTuples_"+dynamicID+"_txtAllocPool")[0]);
                    }
                }

                var ipamRefs = jsonPath(selectedVN, "$.network_ipam_refs[*]");
                //Host Routes
                var hostRoutPrifixArr = createUniqueHostRout(ipamRefs);
                for(var hrInc = 0;hrInc <hostRoutPrifixArr.length;hrInc++){
                    var srEntry = createSREntry(hostRoutPrifixArr[hrInc],$("#srTuples").children().length);
                    $("#srTuples").append($(srEntry));
                }

                /*for (var j = 0; j < ipamRefs.length; j++) {
                    var host_routes = jsonPath(ipamRefs[j], "$..host_routes.route[*]");
                    if(false !== host_routes) {
                        for(var k=0; k<host_routes.length; k++) {
                            var srEntry = createSREntry({"hostroute" : host_routes[k].prefix,"nextHop" : host_routes[k].next_hop}, 
                                     $("#srTuples").children().length);
                            $("#srTuples").append($(srEntry));
                        }
                    }
                }*/

                var poolNames = [];
                var floatingIPPools = jsonPath(selectedVN, "$.floating_ip_pools[*]");
                if (floatingIPPools && floatingIPPools.length > 0) {
                    var fipPools = [];
                    for (var i = 0; i < floatingIPPools.length; i++) {
                        var fipPool = floatingIPPools[i];
                        poolNames[i] = jsonPath(fipPool, "$.to[3]")[0];
                        var projects = jsonPath(fipPool, "$.projects[*].uuid");
                        if (null === projects || typeof projects === "undefined" 
                            || projects == false) {
                            projects = [];
                        }
                        fipPools.push({"FIPPoolName":poolNames[i], "FIPProjects":projects});
                    }
                }
                if(fipPools && fipPools.length > 0) {
                    for(var i=0; i<fipPools.length; i++) {
                        var fipPool = fipPools[i];
                        var fipEntry = createFipoolEntry(fipPool, i);
                        $("#fipTuples").append(fipEntry);
                    }
                }
                
                var routeTargets = jsonPath(selectedVN, "$.route_target_list.route_target[*]");
                if (routeTargets && routeTargets.length > 0) {
                    var rts = [];
                    for (var i = 0; i < routeTargets.length; i++) {
                        routeTargets[i] = routeTargets[i].split("target:")[1];
                        rts.push({"RouteTarget":routeTargets[i]});
                    }
                    if(rts && rts.length > 0) {
                        for(var i=0; i<rts.length; i++) {
                            var rt = rts[i];
                            var rtEntry = createRTEntry(rt, i);
                            $("#RTTuples").append(rtEntry);
                        }
                    }
                }
                var DNSServer = createUniqueDNSServer(ipamRefs);
                if (DNSServer && DNSServer.length > 0) {
                    for(var i=0; i<DNSServer.length; i++) {
                        var DNSEntry = createDNSServerEntry(DNSServer[i], i);
                        $("#DNSServerTuples").append(DNSEntry);
                    }
                }
                //place to add edid of AdminState, Extend/Shared,DNS Server                 
                var AdminState = selectedVN["id_perms"]["enable"];
                var isShared = selectedVN["is_shared"];
                var isExternal = selectedVN["router_external"];
                $("#ddAdminState").data("contrailDropdown").value(AdminState);
                $("#is_shared")[0].checked = isShared;
                $("#router_external")[0].checked = isExternal;
                
                if(null !== selectedVN["virtual_network_properties"] &&
                    typeof selectedVN["virtual_network_properties"] !== "undefined") {
                    var vnProps = selectedVN["virtual_network_properties"];
                    if(null !== vnProps["vxlan_network_identifier"] &&
                        typeof vnProps["vxlan_network_identifier"] && 
                        !isNaN(vnProps["vxlan_network_identifier"])) {
                        $(txtVxLanId).val(vnProps["vxlan_network_identifier"]); 
                    }
                    if(null !== vnProps["forwarding_mode"] &&
                        typeof vnProps["forwarding_mode"] && 
                        "" !== vnProps["forwarding_mode"].trim()) {
                        $("#ddFwdMode").data("contrailDropdown").value(vnProps["forwarding_mode"]);
                    }
                }
            }
        },
        function () {
            //If atleast one api fails
            var results = arguments;

        });
    windowCreateVN.modal("show");
    windowCreateVN.find('.modal-body').scrollTop(0);
}

function createVNSuccessCb() {
    gridVN.showGridMessage('loading');    
    fetchDataForGridVN();
}

function createVNFailureCb() {
    gridVN.showGridMessage('loading');
    fetchDataForGridVN();
}

function getAssignedProjectsForIpam(fips) {
    var aps = jsonPath(fips, "$.projects[*].to");
    var ap = [];
    if (isSet(aps) && aps !== false) {
        for (var i = 0; i < aps.length; i++) {
            ap[i] = aps[i][0] + ":" + aps[i][1];
        }
    }
    if(ap.length > 0) {
        return "( " + ap.toString() + " )";   
    }
    return "";
}

function validate() {
    var vnName = txtVNName.val().trim();
    if (typeof vnName === "undefined" || vnName === "") {
        showInfoWindow("Enter a valid network name", "Input required");
        return false;
    }
    if(validateRTEntry() === false || 
        validateFipEntry() === false ||
        validateSREntry() === false ||
        validateIPAMEntry() === false)
        return false;

    var vxlan = txtVxLanId.val().trim();
    var gvrConfig = configObj["global-vrouter-config"];
    if(null !== gvrConfig && typeof gvrConfig !== "undefined" &&
        null !== gvrConfig["vxlan_network_identifier_mode"] &&
        typeof gvrConfig["vxlan_network_identifier_mode"] !== "undefined" &&
        "configured" === gvrConfig["vxlan_network_identifier_mode"]) {
        if (null === vxlan || typeof vxlan === "undefined" ||
            vxlan === "" || isNaN(vxlan) || parseInt(vxlan) < 0 || 
            parseInt(vxlan) > 1048575) {
            showInfoWindow("Enter VxLAN identifier between 0 to 1048575 under Advanced Options.", "Input required");
            return false;
        }
    }
    return true;
}

function toggleDHCP(){
    var checkedval = $("#chk_headerDHCP")[0].checked;
    for(var i=0; i<$("#ipamTuples").children().length; i++) {
        var id = getID(String($("#ipamTuples").children()[i].id));
        $("#ipamTuples_"+id+"_chkDHCP")[0].checked = checkedval;        
    }
}
function setHeaderDHCP(me){
    if($(me)[0].checked == true){
        var setFlag = true;
        for(var i=0; i<$("#ipamTuples").children().length; i++) {
            var id = getID(String($("#ipamTuples").children()[i].id));
            if($("#ipamTuples_"+id+"_chkDHCP")[0].checked == false){
                setflag = false;
                break;
            }
        }
        if(setFlag == true){
            $("#chk_headerDHCP")[0].checked = true;
        }
    } else {
        $("#chk_headerDHCP")[0].checked = false;
    }
}
function formatAlcPoolObj(alocPools){
    var AllocationPool = "";
    if(alocPools != undefined && alocPools != null && alocPools != ""){
        for(var inc = 0 ; inc < alocPools.length ; inc++){
            if(AllocationPool != "") 
                AllocationPool += "\n";
            if(alocPools[inc]["start"] === alocPools[inc]["end"])
                AllocationPool += alocPools[inc]["start"];
            else
                AllocationPool += alocPools[inc]["start"]+"-"+alocPools[inc]["end"];
        }
    }
    if (AllocationPool == "") AllocationPool = " ";
    return AllocationPool;
}

function getID(divid){
    if(divid === undefined){
         return -1;
    }
    var split = divid.split("_");
    if(split.length > 1){
        return(split[1])
    } else {
        return -1;
    }
}

function destroy() {
    ddDomain = $("#ddDomainSwitcher").data("contrailDropdown");
    if(isSet(ddDomain)) {
        ddDomain.destroy();
        ddDomain = $();
    }

    ddProject = $("#ddProjectSwitcher").data("contrailDropdown");
    if(isSet(ddProject)) {
        ddProject.destroy();
        ddProject = $();
    }

    ddFwdMode = $("#ddFwdMode").data("contrailDropdown");
    if(isSet(ddFwdMode)) {
        ddFwdMode.destroy();
        ddFwdMode = $();
    }

    ddAdminState = $("#ddAdminState").data("contrailDropdown");
    if(isSet(ddAdminState)) {
        ddAdminState.destroy();
        ddAdminState = $();
    }
    
    msNetworkPolicies = $("#msNetworkPolicies").data("contrailMultiselect");
    if(isSet(msNetworkPolicies)) {
        msNetworkPolicies.destroy();
        msNetworkPolicies = $();
    }

    gridVN = $("#gridVN").data("contrailGrid");
    if(isSet(gridVN)) {
        gridVN.destroy();
        $("#gridVN").empty();
        gridVN = $();
    }

    var btnCommonAddIpam = $("#btnCommonAddIpam");
    if(isSet()) {
        btnCommonAddIpam.remove();
        btnCommonAddIpam = $();
    }

    btnCreateVN = $("#btnCreateVN");
    if(isSet(btnCreateVN)) {
        btnCreateVN.remove();
        btnCreateVN = $();
    }

    btnDeleteVN = $("#btnDeleteVN");
    if(isSet(btnDeleteVN)) {
        btnDeleteVN.remove();
        btnDeleteVN = $();
    }

    btnCreateVNCancel = $("#btnCreateVNCancel");
    if(isSet(btnCreateVNCancel)) {
        btnCreateVNCancel.remove();
        btnCreateVNCancel = $();
    }

    btnCreateVNOK = $("#btnCreateVNOK");
    if(isSet(btnCreateVNOK)) {
        btnCreateVNOK.remove();
        btnCreateVNOK = $();
    }

    btnRemovePopupOK = $("#btnRemovePopupOK");
    if(isSet(btnRemovePopupOK)) {
        btnRemovePopupOK.remove();
        btnRemovePopupOK = $();
    }

    btnRemovePopupCancel = $("#btnRemovePopupCancel");
    if(isSet(btnRemovePopupCancel)) {
        btnRemovePopupCancel.remove();
        btnRemovePopupCancel = $();
    }

    btnCnfRemoveMainPopupOK = $("#btnCnfRemoveMainPopupOK");
    if(isSet(btnCnfRemoveMainPopupOK)) {
        btnCnfRemoveMainPopupOK.remove();
        btnCnfRemoveMainPopupOK = $();
    }

    btnCnfRemoveMainPopupCancel = $("#btnCnfRemoveMainPopupCancel");
    if(isSet(btnCnfRemoveMainPopupCancel)) {
        btnCnfRemoveMainPopupCancel.remove();
        btnCnfRemoveMainPopupCancel = $();
    }


    txtVNName = $("#txtVNName");    
    if(isSet(txtVNName)) {
        txtVNName.remove();
        txtVNName = $();
    }

    txtVxLanId = $("#txtVxLanId");
    if(isSet(txtVxLanId)) {
        txtVxLanId.remove();
        txtVxLanId = $();
    }

    windowCreateVN = $("#windowCreateVN");
    if(isSet(windowCreateVN)) {
        windowCreateVN.remove();
        windowCreateVN = $();
    }

    confirmRemove = $("#confirmRemove");
    if(isSet(confirmRemove)) {
        confirmRemove.remove();
        confirmRemove = $();
    }

    confirmMainRemove = $("#confirmMainRemove");
    if(isSet(confirmMainRemove)) {
        confirmMainRemove.remove();
        confirmMainRemove = $();
    }

    gridVNDetailTemplate = $("#gridVNDetailTemplate");
    if(isSet(gridVNDetailTemplate)) {
        gridVNDetailTemplate.remove();
        gridVNDetailTemplate = $();
    }

    var vnConfigTemplate = $("#vn-config-template");
    if(isSet(vnConfigTemplate)) {
        vnConfigTemplate.remove();
        vnConfigTemplate = $();
    }
}

Handlebars.registerHelper("showSubnet",function(allSubnets,options) {
    var returnHtml = '';
    for(k=0;k<allSubnets.length;k++){
        if(k%2 == 1){    
            returnHtml += '<div class="row-fluid bgCol">';
        } else {
            returnHtml += '<div class="row-fluid">';
        }
        returnHtml += '<div class="span3"><div class="span6">' +allSubnets[k]["CIDR"] +'</div>';
        returnHtml += '<div class="span5">' +allSubnets[k]["default_gateway"] +'</div></div>';
        returnHtml += '<div class="span5">' +allSubnets[k]["ipam"] +' </div>';
        returnHtml += '<div class="span4"><div class="span5">' +allSubnets[k]["DHCPEnabled"] +'</div>';        
        returnHtml += '<div class="span7">' +allSubnets[k]["AllocationPool"] +'</div>';
        //returnHtml += '<div class="span3">' +allSubnets[k]["hostroute"] +'</div>';
        //returnHtml += '<div class="span3">' +allSubnets[k]["DNSServer"] +'</div></div>';
        returnHtml += '</div></div>';
    }
    return returnHtml;
});
