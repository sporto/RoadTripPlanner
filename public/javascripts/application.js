// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

var location_template="<div id='location'>Location {{name}}</div>";
var locations = [
                   {name: "Japan"},
                   {name: "USA"}
                ];


$(function() {
    console.log("ini");
    jQuery.each(
            locations,
            function(ix,val){
                console.log(val.name);
            });
 });
