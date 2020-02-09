try{
    var _hinet = parent.document.getElementsByTagName("frameset");
    for(var i=0;i<_hinet.length;i++){
        _hinet[i].cols="*,0";
    }
}
catch(err){};
AdPageURL=null;
Reload_AD_Page=null;
clearInterval();

// close pop-up dialog.
try{
    ADPage.close( );
}
catch(err){};

// for donothing.
function activeReload(){}
function OpenADPage(){}
function para_type(){}
function myweb_popAD(){}
function CheckADPage(){}

var newleft = "";