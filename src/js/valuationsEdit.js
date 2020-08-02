const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const app = remote.app;
const myPath = app.getPath('userData');
const appPath = app.getAppPath();
const moment = require('moment');

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
    commonModule.loadSideMenu('valuations.html', (err, html)=>{
        $('#menuHolder').html(html);
    });

    ipcRenderer.send('variable-request');

    ipcRenderer.on('variable-reply', function (event, args) {
        valuationID = args[0];
        inventoryModule.getValuation(valuationID, (err, result)=>{
            let valuationDetails, valuationItems, items, uoms;
            [valuationDetails, valuationitems, items, uoms] = result;

            // uomArray
            let uomArray = [];
            for(let i in uoms) {
                uomArray[uoms[i].id] = uoms[i];
            }

            let resultHTML = `<h4><i class="fa fa-usd"></i> Edit Valuation</h4>
                            <div class="form-group row" style="width:100%;">
                                <div class="col-md-4 col-lg-4 text-right">
                                    <label class="col-form-label">Date</label>
                                </div>
                                <div class="col-md-8 col-lg-8">
                                    <label class="col-form-label"><b>${moment.unix(valuationDetails[0].date).format('DD MMM, YYYY')}</b></label>
                                </div>
                            </div>
                            <div class="form-group row" style="width:100%;">
                                <div class="col-md-4 col-lg-4 text-right">
                                    <label class="col-form-label">Comment/Description</label>
                                </div>
                                <div class="col-md-8 col-lg-8">
                                    <input type="text" id="comments" value="${valuationDetails[0].comments}" class="form-control" />
                                </div>
                            </div>
                            <div class="form-group row" style="width:100%;">
                                <div class="col-md-4 col-lg-4 text-right">
                                    <label class="col-form-label">Last Valuation</label>
                                </div>
                                <div class="col-md-8 col-lg-8">
                                <label class="col-form-label"><span id="lastValuationDate" style="font-weight:bold;"></span></label>
                                </div>
                            </div>
                            <div class="text-center" style="width:100%;">
                                <button class="btn btn-outline-secondary" onclick="saveValuation(${valuationID})"><i class="fa fa-save"></i> Save Changes</button>
                                <button class="btn btn-outline-secondary" onclick="cancelEditValuation()"><i class="fa fa-close"></i> Cancel</button>
                                <button class="btn btn-outline-secondary" onclick="deleteValuation(${valuationID})"><i class="fa fa-trash"></i> Delete</button>
                            </div>
                            <div class="row" id="itemWiseValuation" style="padding:10px"></div>`;

            $('#contentDiv').html(resultHTML);
            
            // Get openingDate
            let lastValuationID = valuationDetails[0].lastValuationID;
            // Hook for first valuation which will not have lastValuationID
            if(lastValuationID=='null')
                lastValuationID=0;

            inventoryModule.getValuationDetails(lastValuationID, (err, result)=>{
                if(err) {
                    $('#itemWiseValuation').html('Error loading data!');
                    console.log(err);
                } else {
                    let openingDate;
                    if(Object.keys(result).length!=0) {
                        openingDate = moment.unix(result[0].date).add(1, 'day').unix();
                    } else {
                        openingDate = 0;
                    }
                    let closingDate = moment.unix(valuationDetails[0].date).endOf('day').unix();

                    $('#lastValuationDate').html('Closing of: '+moment.unix(result[0].date).format('DD MMM, YYYY')+'<br />Opening of: '+moment.unix(openingDate).format('DD MMM, YYYY'));
                    inventoryModule.getValuationItemWise(openingDate, moment.unix(closingDate).endOf('date').unix(), (err, result)=>{
                        let openingStock, closingStock, receipts, issues;
                        console.log(result);
                        [openingStock, closingStock, receipts, issues] = result;
                        let tempHTML = `<table class="table table-sm table-bordered">
                                        <thead>
                                            <tr class="text-center">
                                                <th>Date</th>
                                                <th></th>
                                                <th>Qty</th>
                                                <th>Unit Value</th>
                                                <th>Total Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>`;
                        for(let i in items) {
                            let totalCost=0, totalUnits=0;

                            tempHTML += `<tr>
                                            <th colspan="5">${items[i].name}</th>
                                        </tr>`;

                            // Opening - Iterate through openingStock to get entry corresponding to itemID
                            let openingDetails;
                            for(let j in openingStock) {
                                if(openingStock[j].itemID == items[i].id)
                                    openingDetails = openingStock[j];
                            }
                            if(openingDetails) {
                                totalUnits += openingDetails.openingStock;
                                totalCost += openingDetails.openingStock * openingDetails.unitValue;
                                tempHTML += `<tr>
                                                <td class="text-right">${moment.unix(openingDate).format('DD MMM, YYYY')}</td>
                                                <td>Opening</td>
                                                <td class="text-right">${commonModule.uomFormat(openingDetails.openingStock, uomArray[items[i].uomID])}</td>
                                                <td class="text-right">${commonModule.currency(openingDetails.unitValue)}</td>
                                                <td class="text-right">${commonModule.currency(openingDetails.openingStock * openingDetails.unitValue)}</td>
                                            </tr>`;
                            } else {
                                tempHTML += `<tr>
                                                <td class="text-right">${moment.unix(openingDate).format('DD MMM, YYYY')}</td>
                                                <td>Opening</td>
                                                <td class="text-right">0</td>
                                                <td class="text-right"></td>
                                                <td class="text-right"></td>
                                            </tr>`;
                            }

                            // Receipts
                            for(let j in receipts) {
                                if(receipts[j].itemID==items[i].id) {
                                    totalUnits += receipts[j].receipts;
                                    totalCost += receipts[j].receipts * receipts[j].unitValue;
                                    tempHTML += `<tr>
                                                    <td class="text-right">${moment.unix(receipts[j].datetime).format('DD MMM, YYYY')}</td>
                                                    <td>Receipt</td>
                                                    <td class="text-right">${commonModule.uomFormat(receipts[j].receipts, uomArray[items[i].uomID])}</td>
                                                    <td class="text-right">${commonModule.currency(receipts[j].unitValue)}</td>
                                                    <td class="text-right">${commonModule.currency(receipts[j].receipts * receipts[j].unitValue)}</td>
                                                </tr>`;
                                }
                            }

                            // Issues 
                            for(let j in issues) {
                                if(issues[j].itemID==items[i].id) {
                                    tempHTML += `<tr>
                                                    <td></td>
                                                    <td>Total Issues</td>
                                                    <td class="text-right">${commonModule.uomFormat(issues[j].totalIssues, uomArray[items[i].uomID])}</td>
                                                    <td class="text-right"></td>
                                                    <td class="text-right"></td>
                                                </tr>`;
                                }
                            }

                            // Closing Stock
                            let closingDetails;
                            for(let j in closingStock) {
                                if(closingStock[j].itemID==items[i].id)
                                    closingDetails = closingStock[j];
                            }
                            if(closingDetails) {
                                let stockValuation = totalCost/totalUnits;
                                if(!stockValuation)
                                    stockValuation = 0;
                                tempHTML += `<tr>
                                                <td class="text-right">${moment.unix(closingDate).format('DD MMM, YYYY')}</td>
                                                <td>Closing</td>
                                                <td class="text-right"><b>${commonModule.uomFormat(closingDetails.closingStock, uomArray[items[i].uomID])}</b></td>
                                                <td class="text-right"><b>${commonModule.round(stockValuation)}</b></td>
                                                <td class="text-right">
                                                    <b>${commonModule.currency(totalCost)}<br />/${commonModule.uomFormat(totalUnits, uomArray[items[i].uomID])}</b>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td></td>
                                                <td></td>
                                                <td><input type="text" class="form-control input-sm text-center saveValue" id="closingStock_${items[i].id}" value="${closingDetails.closingStock}" style="width:100px; margin:0 auto;" /></td>
                                                <td><input type="text" class="form-control input-sm text-center saveValue" id="unitValue_${items[i].id}" value="${commonModule.round(stockValuation)}" style="width:100px; margin:0 auto;" /></td>
                                                <td></td>
                                            </tr>`;
                            } else {
                                    tempHTML += `<tr>
                                                    <td class="text-right">${moment.unix(closingDate).format('DD MMM, YYYY')}</td>
                                                    <td>Closing</td>
                                                    <td class="text-right">0</td>
                                                    <td class="text-right"></td>
                                                    <td class="text-right"></td>
                                                </tr>`;
                            }
                        }
                        tempHTML += `</tbody>
                                    </table>`;
                        $('#itemWiseValuation').html(tempHTML);
                    })
                }
            })

            
        })
    })


    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
    });
});

window.onerror = function(error, url, line) {
    console.log(error);
};

function saveValuation(valuationID) {
    // calculate total value
    let inputs = document.querySelectorAll('.saveValue');
    let closingStock={}, unitValue={};
    for(let i in inputs) {
        let tempID = inputs[i].id;
        if(tempID) {
            let arr = tempID.split('_');
            console.log(arr);
            if(arr[0]=='closingStock')
                closingStock[arr[1]] = inputs[i].value;
            if(arr[0]=='unitValue')
                unitValue[arr[1]] = inputs[i].value;
        }
    }

    for(let itemID in closingStock) {
        console.log(`Item ${itemID} - ${closingStock[itemID]} @ ${unitValue[itemID]}`);
        let data = {
            itemID,
            closingStock: closingStock[itemID],
            unitValue: unitValue[itemID]
        }
        inventoryModule.saveValuationItem(valuationID, data, (err, result)=>{
            if(err) {
                console.log(err);
            } else {
                ipcRenderer.send('redirect-window', 'valuations.html');
            }
        })
    }
}

function cancelEditValuation() {
    ipcRenderer.send('redirect-window', 'valuations.html');
}

function deleteValuation(valuationID) {
    if(confirm('Delete this valuation?')) {
        inventoryModule.deleteValuation(valuationID, (err, result)=>{
            if(err) {
                alert('Could not delete!');
            } else {
                ipcRenderer.send('redirect-window', 'valuations.html');
            }
        })
    }
}