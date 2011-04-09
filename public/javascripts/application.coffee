location_template="<div id='location'>Location {{name}}</div>";

class Location extends Backbone.Model

class LocationCollection extends Backbone.Collection
    model: Location

loc1 = new Location({name:"USA"})
loc2 = new Location({name:"India"})
loc3 = new Location({name:"Melbourne"})
loc4 = new Location({name:"Sydney"})

locations = new LocationCollection([loc1, loc2, loc3]);

#class ItineraryLocation extends Backbone.View
#    model: Location
#    id: "location_"+

$ ->
    for loc in locations.models
        console.log(loc.get("name"))
        

