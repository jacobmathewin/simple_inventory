const fs = require('fs');

const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const app = remote.app;
const myPath = app.getPath('userData');
const appPath = app.getAppPath();

const commonModule = require(appPath+'/src/modules/commonModule.js');
const inventoryModule = require(appPath+'/src/modules/inventoryModule.js');

let dbName = require('electron').remote.getGlobal('sharedObject').db;
let username;
commonModule.checkLoggedIn((err, user)=>{
    if(err) {
        ipcRenderer.send('redirect-window', 'login.html', []);
    } else {
        username = user;
    }
})

$(document).ready(()=>{

    // Load side menu
    commonModule.loadSideMenu('index.html', (err, html)=>{
        $('#menuHolder').html(html);
    });

    // Load username & DB name & font-size
    $('#usernameButtonSpan').html(username);
    $('#dbButtonSpan').html(dbName);
    commonModule.setFontSize();

    inventoryModule.getCurrentInventory(function(err, result) {
        if(err) {
            console.log(err);
            $('#contentDiv').html('Error occured!');
        } else {
            let groups, subgroups, items, inventory, uoms;
            [groups, subgroups, items, inventory, uoms] = result;

            let uomArray = [];
            for(let i in uoms) {
                uomArray[uoms[i].id] = uoms[i];
            }

            let resultHTML = `<h4><i class="fa fa-university"></i> Current Inventory</h4>
                                <table class="table table-sm table-light table-hover">
                                <thead>
                                    <tr>
                                        <th>Group</th>
                                        <th>Subgroup</th>
                                        <th>Item</th>
                                        <th>Closing Stock</th>
                                    </tr>
                                </thead>
                                <tbody>`;
            for(let groupKey in groups) {
                resultHTML += `<tr>
                                    <td>${groups[groupKey].name}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>`;
                for(let subgroupKey in subgroups) {
                    if(subgroups[subgroupKey].groupID == groups[groupKey].id) {
                        resultHTML += `<tr>
                                            <td></td>
                                            <td>${subgroups[subgroupKey].name}</td>
                                            <td></td>
                                            <td></td>
                                        </tr>`;
                        for(let itemKey in items) {
                            if(items[itemKey].subgroupID == subgroups[subgroupKey].id) {
                                let currentInventory = 0;
                                if(inventory[items[itemKey].id])
                                    currentInventory = inventory[items[itemKey].id];
                                resultHTML += `<tr class="clickable itemRow" id="row_${items[itemKey].id}"> 
                                                    <td></td>
                                                    <td></td>
                                                    <td><b>${items[itemKey].name}</b></td>
                                                    <td style="text-align:right;"><b>`+commonModule.uomFormat(currentInventory, uomArray[items[itemKey].uomID])+`</b></td>
                                                </tr>`;
                            }
                        }
                    }
                }
            }
            resultHTML += `</tbody></table>`;
            $('#contentDiv').html(resultHTML);

            $(document).on("click","tr.itemRow", function(e){
                let itemID = commonModule.getRowID(e);
                ipcRenderer.send('redirect-window', 'inventoryTransactionDetails.html', [`${itemID}`]);
            });
        }
    });


    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
});

window.onerror = function(error, url, line) {
    console.log(error);
};