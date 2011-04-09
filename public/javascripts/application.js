//define a mustache template for the location
var location_template="Location {{name}}";

//create the backbone controller
var AppController = Backbone.Controller.extend({
    routes:{
        
    }
});

var appController = new AppController;

//create the location model class
 var Location = Backbone.Model.extend({

});

//create the location collection class
var LocationCollection = Backbone.Collection.extend({
  model: Location
});

//create the backbone models
var loc1 = new Location({name:"USA"})
var loc2 = new Location({name:"India"})
var loc3 = new Location({name:"Melbourne"})
var loc4 = new Location({name:"Sydney"})

//create the backbone collection
var locations = new LocationCollection([loc1, loc2, loc3]);
//
//locations.each(function(location) {
//    console.log(location.get("name"));
//});

var LocationView = Backbone.View.extend({
    tagName:"div",
    className:"location",
    events:{
        "click":"onClick"
    },
    initialize:function(){
        
    },
    render:function(){
        this.el.innerHTML = Mustache.to_html(location_template, {name:this.model.get("name")});
        return this;
    }
});

var locv1 = new LocationView({model:loc1,id:"location_"+loc1.cid});
var locv2 = new LocationView({model:loc2,id:"location_"+loc2.cid});
var locv3 = new LocationView({model:loc3,id:"location_"+loc3.cid});

$(function() {

   // loadMap();
    addBindings();

    //initialiseModels();
    $("#itinerary_items").append(locv1.render().el);
    $("#itinerary_items").append(locv2.render().el);
    $("#itinerary_items").append(locv3.render().el);
    
 });


function loadMap(){
    //load the google map
    var latlng = new google.maps.LatLng(-34.397, 150.644);
    var myOptions = {
      zoom: 8,
      center: latlng,
      panControl: true,
      zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        overviewMapControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        myOptions);
}

function addBindings(){
    //add bindings
    //search field binding
    $('#search_field').keyup(onSearchFieldChange);
}

function onSearchFieldChange(event){
    //trigger a search here
    term = $(event.target).val();
    
}