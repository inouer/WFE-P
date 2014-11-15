function ShowResult(){    
    this.dataServerURL = "http://133.68.14.167:3333"; // inouerのiMac
    
    this.selectedID = "";
    
    this.chartWidth = 600;
    this.chartHeight = 400;
};

ShowResult.prototype.init = function(){
    this.getEvaluationList();
    
    $('#resultLayer')
        .on('click',function(){
            window.showresult.hideResultLayer();
        });
};

ShowResult.prototype.getEvaluationList = function(){
    var successHandler = "window.showresult.callbackForGetEvaluationList";
    var data = {};
    this.getData("/getevaluationlist", data, successHandler);
};

ShowResult.prototype.callbackForGetEvaluationList = function(res){
    console.log(res);
    
    $.each(res, function(index){
        var $evaluationList = $('#evaluationList');
        
        var $tr = $('<tr/>');
        var $indexTD = $('<td/>');
        var $tokenTD = $('<td/>');
        var $titleTD = $('<td/>');
        var $dateTD = $('<td/>');
        
        $indexTD
            .addClass('indexTD')
            .text(index)
            .appendTo($tr);
        $tokenTD
            .addClass('tokenTD')
            .text(this.evaluationtoken)
            .appendTo($tr);
        $titleTD
            .addClass('titleTD')
            .text(this.title)
            .appendTo($tr);
        $dateTD
            .addClass('dateTD')
            .text(this.date)
            .appendTo($tr);
        
        $tr
            .attr({
                'class':'evaluationIDs',
                'data-rowid':this.evaluationtoken
            })
            .on('click',function(){
                window.showresult.showResultLayer();
                
                window.showresult.selectedID = $(this).attr('data-rowid');
                window.showresult.getEvaluationData(window.showresult.selectedID);    
            })
            .appendTo($evaluationList);
    });
};

ShowResult.prototype.showResultLayer = function(){
    $('#resultLayer')
        .fadeIn('slow');    
};

ShowResult.prototype.hideResultLayer = function(){
    $('#resultLayer')
        .fadeOut('fast');    
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
    this.drawEachPageChart(res.pages);
    this.drawPagesData(res.pages);
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
          "width": window.showresult.chartWidth,
          "height": window.showresult.chartHeight,
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
          "width": window.showresult.chartWidth,
          "height": window.showresult.chartHeight,
        "title": "Users",
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

ShowResult.prototype.drawEachPageChart = function(pages){
    var data = [];
    var pageNumber = ['PageNumber'];
    var functionAll = ['all'];
    var functionCmt = ['cmt'];
    var functionAnnotation = ['annotation'];
    var functionPointer = ['pointer'];
    var functionHandwrite = ['handwrite'];
    $.each(pages, function(k, v) {
        if(k=="undefined") return;
        
        pageNumber.push(k);
        
        $.each(this.count, function(k, v) {
           switch(k){
               case 'all':
                   functionAll.push(v);
                   break;
               case 'cmt':
                   functionCmt.push(v);
                   break;
               case 'annotation':
                   functionAnnotation.push(v);
                   break;
               case 'pointer':
                   functionPointer.push(v);
                   break;
               case 'handwrite':
                   functionHandwrite.push(v);
                   break;
           } 
        });
    });
    data.push(pageNumber);
    data.push(functionCmt);
    data.push(functionAnnotation);
    data.push(functionPointer);
    data.push(functionHandwrite);
    data.push(functionAll);
    
    var chartdata = {
    
      "config": {
          "width": window.showresult.chartWidth,
          "height": window.showresult.chartHeight,
        "title": "Used Functions on Each Page",
        "type": "bezi2",
        "useVal": "yes",
        "xScaleXOffset": 4,
        "colNameFont": "100 18px 'Arial'",
        "textColor": "#888",
        "bg": "#fff"
      },
    
      "data": data
    };
    
    window.ccchart.init('chartForEachPage', chartdata);
};

ShowResult.prototype.drawPagesData = function(pages){
    console.log(pages);
    
    $('#slideComments').html('');
    
    $.each(pages, function(index) {   
        if(index == "undefined") return true;
        
        var $div = $('<div/>');
        $div
            .addClass('pageData')
            .appendTo($('#slideComments'));
            
        var $header = $('<div/>');
        $header
            .addClass('page-header myPageHeader')
            .text('Slide ' + index)
            .appendTo($div); 
             
        var $countHeader = $('<div>Functions</div>');
        $countHeader
            .addClass('myMiniHeader')
            .appendTo($div); 
        
        var $canvas = $('<canvas/>');
        $canvas
            .attr({
                id:'#countCanvas'+index
            })
            .appendTo($div); 
            
        var data = [];
        $.each(this.count, function(k, v) {
            if(k=="all") return;
            var eachData = [k, v];
            data.push(eachData);
        });
        data.unshift(["",""]);
        
        var chartdata = {
        
          "config": {
              "width": window.showresult.chartWidth,
              "height": window.showresult.chartHeight,
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
        window.ccchart.init('#countCanvas'+index, chartdata);
        
        var $annotationHeader = $('<div>Annotations</div>');
        $annotationHeader
            .addClass('myMiniHeader')
            .appendTo($div); 
        var $ulAnnotation = $('<ul/>');        
        $.each(this.annotations, function(index) {
            var $li = $('<li/>');
            $li
                .text(this)
                .appendTo($ulAnnotation);
        });
        $ulAnnotation
            .appendTo($div); 
        
        var $commentHeader = $('<div>Comments</div>');
        $commentHeader
            .addClass('myMiniHeader')
            .appendTo($div); 
        var $ulComment = $('<ul/>');        
        $.each(this.comments, function(index) {
            var $li = $('<li/>');
            $li
                .text(this)
                .appendTo($ulComment);
        });
        $ulComment
            .appendTo($div); 
        
        var $handwriteHeader = $('<div>Handwrite</div>');
        $handwriteHeader
            .addClass('myMiniHeader')
            .appendTo($div); 
        var $ulHandwrite = $('<ul/>');        
        $.each(this.handwrite, function(index) {
            var $li = $('<li/>');
            $li
                .text(this)
                .appendTo($ulHandwrite);
        });
        $ulHandwrite
            .appendTo($div); 
        
        var $pointerHeader = $('<div>Pointer</div>');
        $pointerHeader
            .addClass('myMiniHeader')
            .appendTo($div); 
        var $ulPointer = $('<ul/>');        
        $.each(this.pointer, function(index) {
            var $li = $('<li/>');
            $li
                .text(this)
                .appendTo($ulPointer);
        });
        $ulPointer
            .appendTo($div); 
    });
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