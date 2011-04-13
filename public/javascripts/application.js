//define a mustache template for the location
var search_location_template="<div class='actions'><a href='#' class='button center'>Center</a><a href='#' class='button add'>Add</a> </div><div class='name'>{{name}}</div>";
var itinerary_location_template="<div class='actions'><a href='#' class='button center'>Center</a><a href='#' class='button remove'>Remove</a> </div><div class='name'>{{name}}</div>";

//Model for search result
//var SearchResultModel = Backbone.Model.extend();

//create the location model class
 var LocationModel = Backbone.Model.extend({
    view:null,
     getGoogleLtLg:function(){
         return new google.maps.LatLng(this.get("lt"),this.get("lg"));
     }
});

//create the location collection class
var LocationCollection = Backbone.Collection.extend({
  model: LocationModel
});

//view for itinerary location
var ItineraryLocationView = Backbone.View.extend({
    tagName:"div",
    className:"location",
    events:{
        "click .button.center":"centerOnLocation",
        "click .button.remove":"removeLocation"
    },
    initialize:function(options){
        //when a event is triggered the render is called again
         //_.bindAll(this, "render");

        //associate this view object with the DOM element
        $(this.el).data("model_cid",this.model.cid);
    },
    render:function(){
        this.el.innerHTML = Mustache.to_html(itinerary_location_template, {name:this.model.get("name")});
        return this;
    },
    centerOnLocation:function(){
        //todo views should not be calling the controller directly, they should broadcast an event
        app_controller.centerOnLocation(this);
    },
    removeLocation:function(){
        app_controller.removeLocation(this);
    }
});

//view for search result
var SearchResultView = Backbone.View.extend({
    tagNav:"div",
    className:"search_result",
    events:{
        "click .button.center":"centerOnLocation",
        "click .button.add":"addLocation"
    },
    initialize:function(){
    },
    render:function(){
     this.el.innerHTML = Mustache.to_html(search_location_template,{name:this.model.get("name")});
     return this;
    },
    centerOnLocation:function(){
        app_controller.centerOnLocation(this);
    },
    addLocation:function(){
        app_controller.addLocationModelToItinerary(this.model.clone());
        //app_controller.addLocationToItinerary(this.model.get("name"));
    }
});

//create the backbone controller
var AppController = Backbone.Controller.extend({
    routes:{

    },

    initialize:function(){
        //load the map
        this.loadMap();

        //set up the google services
        this.directionsService = new google.maps.DirectionsService();
        this.directionsDisplay = new google.maps.DirectionsRenderer();
        this.directionsDisplay.setMap(this.map);
        //service for geocoding (finding cities)
        this.geocoder = new google.maps.Geocoder();

        //create a collection for handling locations in the itinerary
        this.location_collection = new LocationCollection();

        //create a collection for handling search results
        this.result_collection = new LocationCollection();

        //bind events on the search results collection
        this.result_collection.bind("refresh", this.onResultCollectionRefresh);

        //bind events on the itinerary collection
        this.location_collection.bind("add",this.onLocationCollectionAdd);
        this.location_collection.bind("remove",this.onLocationCollectionRemove);
        this.location_collection.bind("change",this.onLocationCollectionChange);

        //add a comparator function to the collection to it stays sorted by index
        this.location_collection.comparator=function(location_model){
            return location_model.get('index');
        };

        //make the list sortable
        $("#itinerary_items").sortable({
            axis:'y',
            stop:this.onLocationsSortStop
        });
        
    },

    showMapLoader:function(){
      $("#map_loader").show();
    },

    hideMapLoader:function(){
        $("#map_loader").hide();  
    },

    onLocationsSortStop:function(event,ui){
        //todo find a better way to bind this so we know about the view used
        //todo scope this to the controller

        //loop through all the collection of items in the itinerary and get the new indexes
        $("#itinerary_items").children().each(function(index, ele){
            var cid = $(ele).data('model_cid');
            //find the model in the collection
            var model = app_controller.location_collection.getByCid(cid);
            //refresh the index on the model
            model.set({index:index});
        });

        //re order the collection
        //trigger a route refresh
        app_controller.refreshRouteDo();
    },

    addLocationToSearch:function(obj){
        //object received should be
        //{name:"location_name",lt:latitude,lg:longitude}

      //create a new model for this location
        var model = new LocationModel(obj);

        this.addLocationModelToSearch(model);
    },

    addLocationModelToSearch:function(model){

        //get the new index for the model
        var ix = this.result_collection.length;

        model.set({index:ix});

     //add the model to the collection
        this.result_collection.add(model);

     //add a listener for this model
        model.bind("remove",this.onModelRemove);

      this.addResultView(model);
    },

    addResultView:function(model){
        //this adds a result view to the collection view

        //create a view for this result
        var result_view = new SearchResultView({model:model,id:"result_"+model.cid});

      //add the view to the list
       $("#search_results").append(result_view.render().el);
    },

    addLocationToItinerary:function(obj){
        //this functions add a location model from an options object
        //create a model for this location
        var location_model = new LocationModel(obj);
        //location_model.set({index:ix});

        this.addLocationModelToItinerary(location_model);
    },

    addLocationModelToItinerary:function(model){

        //models are added at the end of the collection
        //get the last in the collection and use that index +1
        var new_ix = 1;
        if(!this.location_collection.isEmpty()){
            var last = this.location_collection.last();
            var new_ix = last.get("index")+1;
        }

        //var new_ix = this.location_collection.length;

        log("New index is "+ new_ix);
        model.set({index:new_ix});

        //add a listener for this model
        model.bind("remove",this.onModelRemove);

        //add the model to the collection
        this.location_collection.add(model);

        //create a view for this location
        var location_view = new ItineraryLocationView({model:model,id:"location_"+model.cid});
        
        //associate the view to the model
        model.view = location_view;
        
        //add the view to the list
        $("#itinerary_items").append(location_view.render().el);
    },

    centerOnLocation:function(view){
        //log(view);
        //get the model
        model = view.model;
        var ll = model.getGoogleLtLg();
        ///this.map.setCenter(ll);
        //log("ll = " + ll);
        
        this.map.panTo(ll);
    },

    removeLocation:function(view){
        //remove the associated model from the collection
        //the view is removed via an event listener added to the model when created
        this.location_collection.remove(view.model);
    },

    refreshRoute:function(){
      //refreshes the route on the map
      //do not execute to soon because the user might do two actions in a row
        clearTimeout(this.refreshRouteTimer);
       //generate a timeout object that will be triggered in 2 seconds
        this.refreshRouteTimer = setTimeout(this.refreshRouteDo, 1500);
    },

    refreshRouteDo:function(){
      //proceed with the refresh
        log("refreshRouteDo");

        app_controller.showMapLoader();

        //force a resort on the collection as the indexes may have changed
        app_controller.location_collection.sort();

        var locs = new Array();

        app_controller.location_collection.each(function(model){
            log(model.get("name"));
            var ll = model.getGoogleLtLg();
            locs.push(ll);
        });

        if(locs.length<2){
            //no route to draw
            //empty the previous route

            return;
        }

        var origin = locs.shift();
        var destination = locs.pop();

        //create a directions request object
        var request = {
            origin:origin,
            destination:destination,
             travelMode: google.maps.DirectionsTravelMode.DRIVING
        };

        //add waypoints if any
        if(locs.length>0){
            waypoints = [];
            _.each(locs,function(loc){
              waypoints.push({location:loc});
            });
            request.waypoints = waypoints;
            //waypoints += "&waypoints="+locs.join("|");
        }

        app_controller.directionsService.route(request, function(result,status){
            log(status);
            if(status==google.maps.DirectionsStatus.OK){
                app_controller.directionsDisplay.setDirections(result);
            }
            app_controller.hideMapLoader();
        });
    },

    onRouteRetrieved:function(data){
        log("done"+data);
    },

    onLocationCollectionAdd:function(model){
        log("onLocationCollectionAdd");
        //this is scoped to the collection because the event was bound to it
        //todo find a way to scope the event to the controller
        //log("onLocationCollectionAdd");
        //log(this);
        app_controller.refreshRoute();
    },

    onLocationCollectionRemove:function(model){
        //log("onLocationCollectionRemove");
        app_controller.refreshRoute();
    },

    onLocationCollectionChange:function(){
        //log("onLocationCollectionChange");
    },

    onResultCollectionRefresh:function(){
        //called when the whole collection is replaced
        log("onResultCollectionRefresh");
        //this event doesn't seem to trigger a remove event on the models
        //the entire collection of views need to be refreshed
        app_controller.refreshResultCollectionView();
    },

    onModelRemove:function(model){
        //log("onModelRemove");
        //remove the view
        model.view.remove();
    },

    refreshResultCollectionView:function(){
        //remove all current results
        $("#search_results").children().remove();

        //add the current models back in
        app_controller.result_collection.each(function(model){
            //add view
            app_controller.addResultView(model);
        });
    },

    loadMap:function(){
        //load the google map
        //todo get the location of the user to pass it as the center
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
        this.map = new google.maps.Map(document.getElementById("map_canvas"),
            myOptions);
    },

    search:function(term){
        //delete all the results
        this.result_collection.refresh();

        //log(this.result_collection.length);

        //return;
        //if the term is less than 4 chars then ignore
        if(term.length<4) return;
        //log("search");
        //get the current center
        var center = this.map.getCenter();
        this.geocoder.geocode( { 'address': term}, function(results, status) { app_controller.searchDone(results, status); });
    },
    searchDone:function(results, status){

     if (status == google.maps.GeocoderStatus.OK) {

        this.map.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
            map: this.map,
            position: results[0].geometry.location
        });

         _.each(results, function(res){
             //log("lat = " + res.geometry.location.lat());
             var model = new LocationModel({name:res.formatted_address,lt:res.geometry.location.lat() , lg:res.geometry.location.lng() });
            app_controller.addLocationModelToSearch(model);
         });
         //show the results in the results collection view


      } else {
        log("Geocode was not successful for the following reason: " + status);
      }
    }

});

//create an array of mock-up cities
cities = {
    melb:{name:"Melbourne",lt:-37.817,lg:144.967},
    sydn:{name:"Sydney",lt:-33.883,lg:151.217},
    bend:{name:"Bendigo",lt:-36.767,lg:144.283},
    ball:{name:"Ballarat",lt:-37.567,lg:143.85},
    trar:{name:"Traralgon",lt:-38.183,lg:146.533},
    echu:{name:"Echuca",lt:-36.133,lg:144.75},
    albu:{name:"Albury",lt:-36.083,lg:146.917},
    wanga:{name:"Wangaratta",lt:-36.367,lg:146.333},
    woll:{name:"Wollongong",lt:-34.433,lg:150.883},
    wwag:{name:"Wagga Wagga",lt:-35.117,lg:147.367}
    
};


$(function() {

    //loadMap();
    addBindings();

    //create the backbone collection
    //location_collection = new LocationCollection();


    //create the application controller
    app_controller = new AppController();

    //add some dummy locations to the search
//    app_controller.addLocationToSearch(cities.wwag);
//    app_controller.addLocationToSearch(cities.woll);
//    app_controller.addLocationToSearch(cities.wanga);
//    app_controller.addLocationToSearch(cities.albu);

    //add some dummy locations to the itinerary
    app_controller.addLocationToItinerary(cities.echu);
    app_controller.addLocationToItinerary(cities.bend);
    app_controller.addLocationToItinerary(cities.ball);
    app_controller.addLocationToItinerary(cities.melb);
    //app_controller.addLocationToItinerary(5,cities.echu);
 });



function addBindings(){
    //add bindings
    //search field binding
    $('#search_field').keyup(onSearchFieldChange);
}

function onSearchFieldChange(event){
    //trigger a search here
    term = $(event.target).val();
    //send the seach to the appcontroller
    app_controller.search(term);
}

//function addLocationToIti(name){
//    //create a model for this location
//    var location_model = new Location({name:name});
//
//    //add the model to the collection
//    location_collection.add(location_model);
//
//    //create a view for this location
//    var location_view = new LocationView({model:location_model,id:"location_"+location_model.cid});
//
//    //add the view to the list
//    $("#itinerary_items").append(location_view.render().el);
//
//}


function log(msg){
    if (window.console && console.log) console.log(msg);
}