function VoteConfig(){};

VoteConfig.prototype.init = function(){
    $('#submitButton')
        .on('click',function(){
            var token = $('#token').val();
            
            if(token==""){
                return;
            }
            
            $('#snippet')
                .text('<iframe src=\"http://winter.ics.nitech.ac.jp/~toralab/demo/vote.html#'+token+'\" style=\"width:1000px;height:500px;\"></iframe>');

            var bookmarkletText = "javascript:(function(){var WFEP_body = document.getElementsByTagName('body').item(0);var WFEP_iframe = document.createElement('iframe');WFEP_iframe.setAttribute('src','http://winter.ics.nitech.ac.jp/~toralab/demo/vote.html"+token+"');WFEP_iframe.setAttribute('style','position:absolute;top:100px;height:100px;width:1000px;height:500px;z-index:9999;');WFEP_iframe.setAttribute('frameborder','0');WFEP_body.appendChild(WFEP_iframe);})();";                
            $('#bookmarklet')
                .html(bookmarkletText);
            
        });
};


$(function() {
    window.voteconfig = new VoteConfig;
    window.voteconfig.init();
});
