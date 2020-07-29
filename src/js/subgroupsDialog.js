const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const app = remote.app;
const myPath = app.getPath('userData');
const appPath = app.getAppPath();

const commonModule = require(appPath+'/src/modules/commonModule.js');
const inventoryModule = require(appPath+'/src/modules/inventoryModule.js');

var subgroupID;

$(document).ready(()=>{

    let additionalArgs = window.process.argv;
    for(let needle of additionalArgs) {
        if(needle.search('id=')===0) {
            let temp = needle.split('=');
            subgroupID = temp[1];
        }
    }

    inventoryModule.getSubgroup(subgroupID, function(err, result) {
        if(err) {
            console.log(err);
            $('#contentDiv').html('Error has occured!');    
        } else {
            let resultHTML = `<div class="form-group row text-center" style="width:100%;">
                                    <div class="text-center col-md-12 col-lg-12"><b>Group Details</b></div>
                                </div>
                                <div class="form-group row" style="width:100%;">
                                    <div class="col-md-6 col-lg-6 text-right">
                                        Subgroup Name
                                    </div>
                                    <div class="col-md-6 col-lg-6">
                                        <b>${result[0].name}</b>
                                    </div>
                                </div>
                                <div class="form-group row" style="width:100%;">
                                    <div class="col-md-6 col-lg-6 text-right">
                                        Group
                                    </div>
                                    <div class="col-md-6 col-lg-6">
                                        <b>${result[0].groupName}</b>
                                    </div>
                                </div>
                                <div class="container text-center" style="width:100%">
                                    <input type="hidden" name="groupID" id="groupID" value="${subgroupID}" />
                                    <button class="btn btn-secondary" id="editGroup" onclick="editSubgroup(${subgroupID})">Edit</button>
                                    <button class="btn btn-secondary" id="cancelButton" onclick="cancelDialog()">Cancel</button>
                                </div>`;
            $('#contentDiv').html(resultHTML);
        }
    });
});

function editSubgroup(subgroupID) {
    let tempWindow = remote.getCurrentWindow();
    ipcRenderer.send('open-new-window', 'subgroupsDialogEdit.html', [`id=${subgroupID}`], 800, 600);
}

window.onerror = function(error, url, line) {
    console.log(error);
};

function cancelDialog() {
    remote.getCurrentWindow()
        .close();
}