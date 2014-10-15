function ShowResult(){    
    this.dataServerURL = "http://133.68.14.167:3333"; // inouerのiMac
    
    this.selectedID = "";
};

ShowResult.prototype.init = function(){
    this.getEvaluationList();
    
    // Load the Visualization API and the piechart package.
    //google.load('visualization', '1.0', {'packages':['corechart']});
    
    // Set a callback to run when the Google Visualization API is loaded.
    //google.setOnLoadCallback(this.showCharts);
};

ShowResult.prototype.getEvaluationList = function(){
    var successHandler = "window.showresult.callbackForGetEvaluationList";
    var data = {};
    this.getData("/getevaluationlist", data, successHandler);
};

ShowResult.prototype.callbackForGetEvaluationList = function(res){
    console.log("Evaluations: "+res);
    
    $.each(res, function(index){
        var $evaluationList = $('#evaluationList');
        
        var $tr = $('<tr/>');
        var $indexTD = $('<td/>');
        var $tokenTD = $('<td/>');
        var $dateTD = $('<td/>');
        
        $indexTD
            .addClass('indexTD')
            .text(index)
            .appendTo($tr);
        $tokenTD
            .addClass('tokenTD')
            .text(this)
            .appendTo($tr);
        $dateTD
            .addClass('dateTD')
            .text("")
            .appendTo($tr);
        
        $tr
            .attr({
                'class':'evaluationIDs',
                'data-rowid':this
            })
            .on('click',function(){
                window.showresult.selectedID = $(this).attr('data-rowid');
                window.showresult.getEvaluationData(window.showresult.selectedID);    
            })
            .appendTo($evaluationList);
    });
};

ShowResult.prototype.getEvaluationData = function(selectedID){
    var successHandler = "window.showresult.callbackForGetEvaluationData";
    var data = {
        evaluationtoken:selectedID
    };
    this.getData("/getdatafunctions", data, successHandler);
};

ShowResult.prototype.callbackForGetEvaluationData = function(res){
    this.drawFunctionsChart(res.functioncount);
    this.drawUsersChart(res.usercount);
};

ShowResult.prototype.drawFunctionsChart = function(functionCount){
    var data = [];
    $.each(functionCount, function(k, v) {
        var eachData = [k, v];
        data.push(eachData);
    });
    
    data.sort(function(a, b){
        var x = a[1];
        var y = b[1];
        if (x > y) return -1;
        if (x < y) return 1;
        return 0;
    });
    data.unshift(["",""]);
    
    var chartdata = {
    
      "config": {
        "title": "Functions",
        //"subTitle": "",
        "type": "pie",
        "useVal": "yes",
        "pieDataIndex": 2,
        "colNameFont": "100 18px 'Arial'",
        "pieRingWidth": 80,
        "pieHoleRadius": 40,
        "textColor": "#888",
        "bg": "#fff"
      },
    
      "data": data
    };
    
    window.ccchart.init('chartForFunctions', chartdata);
};

ShowResult.prototype.drawUsersChart = function(userCount){
    var data = [];
    $.each(userCount, function(k, v) {
        var eachData = [k, v];
        data.push(eachData);
    });
    
    data.sort(function(a, b){
        var x = a[1];
        var y = b[1];
        if (x > y) return -1;
        if (x < y) return 1;
        return 0;
    });
    data.unshift(["",""]);
    
    var chartdata = {
    
      "config": {
        "title": "Users",
        //"subTitle": "",
        "type": "pie",
        "useVal": "yes",
        "pieDataIndex": 2,
        "colNameFont": "100 18px 'Arial'",
        "pieRingWidth": 80,
        "pieHoleRadius": 40,
        "textColor": "#888",
        "bg": "#fff"
      },
    
      "data": data
    };
    
    window.ccchart.init('chartForUsers', chartdata);
};

ShowResult.prototype.getData = function(mode, data, successHandler){
    var jsonData = JSON.stringify(data);
    
    $.ajax({
        type    : 'GET',
        url     : window.showresult.dataServerURL+mode,
        data    : {jsondata: jsonData},
        dataType: 'jsonp',
        jsonp   : 'jsoncallback',
        jsonpCallback: successHandler,    
        success : function(json)
        {
            if ( json.stat == 'ok' ) {
                // success
            } else {
                // fail
            }
        }
    });
};

$(function() {    
    window.showresult = new ShowResult;
    window.showresult.init();
});