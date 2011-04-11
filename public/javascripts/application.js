//define a mustache template for the location
var search_location_template="<div class='name'>{{name}}</div><div class='actions'><a href='#' class='button center'>Center</a><a href='#' class='button add'>Add</a> </div>";
var itinerary_location_template="<div class='name'>{{name}}</div><div class='actions'><a href='#' class='button center'>Center</a><a href='#' class='button remove'>Remove</a> </div>";

//Model for search result
//var SearchResultModel = Backbone.Model.extend();

//create the location model class
 var LocationModel = Backbone.Model.extend({
    view:null
});

//create the location collection class
var LocationCollection = Backbone.Collection.extend({
  model: LocationModel
});

//collection for search results
var SearchResultCollection  = Backbone.Collection.extend({
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
        //make the element draggable
        //this.el.draggable();

        //when a event is triggered the render is called again
         //_.bindAll(this, "render");

        //associate this view object with the DOM element
        //$(this.el).data('view',this);
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
        app_controller.addLocationModelToItinerary(this.model);
        //app_controller.addLocationToItinerary(this.model.get("name"));
    }
});

//create the backbone controller
var AppController = Backbone.Controller.extend({
    routes:{

    },
    initialize:function(){
        //create a collection for handling locations in the itinerary
        this.location_collection = new LocationCollection();
        //create a collection for handling search results
        this.result_collection = new SearchResultCollection();
        //bind events on the collection
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
    onLocationsSortStop:function(event,ui){
        //todo find a better way to bind this so we know about the view used
        //todo scope this to the controller

        //get the new index of the element
        var index = $(this).children('div').index(ui.item[0]);

        //create a temp collection for handling the models
        //var temp_collection = new LocationCollection();

        //todo find the model by using collection.getByCid(cid)
        
        //find the model that corresponds to this object
        app_controller.location_collection.each(function(model){
            if(model.view.el==ui.item[0]){
                //this is the model moved
                //remove this model and reinsert it in the new position
                //refresh the index property of the model so the collection is resorted
                //model.index =
            }else{
                
            }
        });

        //todo reorder the models in the collection

        //re order the collection
        //trigger a route refresh
        app_controller.refreshRouteDo();
    },
    addLocationToSearch:function(ix,obj){
        //object received should be
        //{name:"location_name",lt:latitude,lg:longitude}
      //create a new model for this location
        var result_model = new LocationModel(obj);
        result_model.set({index:ix});
        
     //add the model to the collection
        this.result_collection.add(result_model);
      //create a view for this result
        var result_view = new SearchResultView({model:result_model,id:"result_"+result_model.cid});
      //add the view to the list
       $("#search_results").append(result_view.render().el);
    },
    addLocationToItinerary:function(ix,obj){
        //create a model for this location
        var location_model = new LocationModel(obj);
        location_model.set({index:ix});

        //add the model to the collection
        this.location_collection.add(location_model);

        this.addLocationModelToItinerary(location_model);
    },
    addLocationModelToItinerary:function(model){
        //create a view for this location
        var location_view = new ItineraryLocationView({model:model,id:"location_"+model.cid});
        
        //associate the view to the model
        model.view = location_view;
        
        //add the view to the list
        $("#itinerary_items").append(location_view.render().el);
    },
    centerOnLocation:function(view){
        //event.preventDefault();
        //b = event.target;
        log(view);
    },
    removeLocation:function(view){
        //view.remove();
        //remove the associated model from the collection
        this.location_collection.remove(view.model);
        view.remove();
        //console.log(this.location_collection.length);
    },
    refreshRoute:function(){
      //refreshes the route on the map
      //do not execute to soon
        //log("refreshRoute");
        clearTimeout(this.refreshRouteTimer)
       //generate a timeout object that will be triggered in 2 seconds
        this.refreshRouteTimer = setTimeout(this.refreshRouteDo, 1500);
    },
    refreshRouteDo:function(){
      //proceed with the refresh
        log("refreshRouteDo");

        app_controller.location_collection.each(function(model){
            log("name " + model.get("name"));
        });
    },
    onLocationCollectionAdd:function(model){
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

    loadMap();
    addBindings();

    //create the backbone collection
    //location_collection = new LocationCollection();


    //create the application controller
    app_controller = new AppController();

    //add some dummy locations to the search
    app_controller.addLocationToSearch(1,cities.wwag);
    app_controller.addLocationToSearch(2,cities.woll);
    app_controller.addLocationToSearch(3,cities.wanga);
    app_controller.addLocationToSearch(4,cities.albu);

    //add some dummy locations to the itinerary
    app_controller.addLocationToItinerary(1,cities.melb);
    app_controller.addLocationToItinerary(2,cities.bend);
    app_controller.addLocationToItinerary(3,cities.ball);
    app_controller.addLocationToItinerary(4,cities.trar);
    app_controller.addLocationToItinerary(5,cities.echu);
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
    console.log(msg);
}