/**
 * Created by inoueryouta on 14/11/14.
 */

function TopPageController(){};

TopPageController.prototype.init = function(){

};

function Connection(){
    this.slidestackServerURL = "";
};

Connection.prototype.init = function(){};

Connection.prototype.sendToSlideStackServer = function(mode, data, successHandler){
    $.ajax({
        url: window.connection.slidestackServerURL+mode,
        type: "GET",
        crossDomain: true,
        data: data
    })
    .then(
        successHandler,
        function(xhr, status, error) {
            console.log(xhr);
        }
    );
};

$(function() {
    window.connection = new Connection;
    window.connection.init();

    window.toppagecontroller = new TopPageController;
    window.toppagecontroller.init();
});
