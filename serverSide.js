/*
**package definition 
**Express, path, http : build the server.
**ar-drone, dronestream : interact with the drone.
**faye, socket.io : dialog faster with client.
**addon : C++ library for headset Emotiv EPOC+
*/

const addon = require('./public/App/build/Release/addon');

var express = require('express');
var faye = require ('faye');
var path = require('path');
var arDrone = require('ar-drone');
var http = require ('http');
var stream = require( 'dronestream' );


/* GLOBAL VARIABLE */
var _PORT = 8080;
var headInterv;			// interval for checking new event (100ms)
var animate = false;

/* List : {key - mentalCommand} */
var mentalCommand = {
	1 : "STABLE",
	2: "FRONT",
	4 : "BACK",
	8 : "UP",
	16 : "DOWN",
	32 : "LEFT",
	64 : "RIGHT",
	128: "ROTATE LEFT",
	256 : "ROTATE RIGHT",
	2048 : "TAKEOFF",
	4096 : "LAND"
};
/* List : {key - droneOrder} */
var droneOrders = {
	1 : "stop",
	2 : "front",
	4 : "back",
	8 : "up",
	16 : "down",
	32 : "left",
	64 : "right",
	128: "counterClockwise",
	256 : "clockwise",
	2048 : "takeoff",
	4096 : "land"
};

var app = express();
var drone;
var client;

/* Config Server */
app.set( 'port', _PORT);
app.use( express.static( path.join( __dirname, 'public' ) ) );
app.use( "/components", express.static( path.join( __dirname, 'components' ) ) );
	
/* Run Server */
var server = http.createServer( app );
new faye.NodeAdapter( {
				mount: '/faye',
				timeout : 45
			} ).attach( server );

client = new faye.Client("http://localhost:" + (app.get("port")) + "/faye", {});

if (drone = arDrone.createClient()){
	client.publish('/droneConnected', "");
}

stream.listen(server);

drone.on('navdata', function( data ) {
	return client.publish( "/navdata", data );
});	


client.subscribe( '/Fly', function( data ) {
	if( typeof drone[ data.action ] == 'function'){
		console.log('flying : ' + data.action + " speed :" + data.speed);
		return drone[ data.action ]( data.speed );
	}else{ 
		return drone.stop();
	}
});
	
client.subscribe( '/UpDown', function( data ) {

	if( typeof drone[ data.action ] == 'function' ){
		console.log(data.action);
		return drone[ data.action ]();
	}						
});	

client.subscribe( '/Animate', function( data ){
	if (!animate){
		animate = true;
		console.log('figue : ' + data.action + 'for : '+ data.duration);
		setTimeout(function (){animate=false;},1000);
		return drone.animate( data.action, data.duration );
		
	}
	
});

client.subscribe('/headConnect', function(){
	if (addon.connection()){
			console.log('Headest EPOC+ connected ! Start receiving... ');
			headInterv = setInterval(headsetEventCheck, 100);
			client.publish('/headsetConnection', "");
	}
});




/*
** UPDATE Interval Headset
**check and handle new event from the Emotiv Insight/EPOC+ headset
*/
var headsetEventCheck = function(){
	if (addon.checkNextEvent()){
		if (addon.getWirelessSignal() > 0){ // check if the headset is still connected
			var nwirelessSignal = addon.getWirelessSignal(),
			nmentalCommand = addon.getMentalCommandeCurrentAction(),
			nmentalCommandPower = addon.getMentalCommandeCurrentActionPower(),
			nbatteryLevel = addon.getBatteryLevel();
			
			client.publish('/updateControlData', {signal : nwirelessSignal, battery : nbatteryLevel, connected : 'CONNECTED'});
			
			if(nmentalCommand == 1){
				client.publish('/newOrder', mentalCommand[nmentalCommand]);
				client.publish ('/UpDown', {action : 'stop'});
			}
			else{
				if (nmentalCommandPower > 0.4){
					client.publish('/newOrder', mentalCommand[nmentalCommand]);
					if (nmentalCommand == 2048 || nmentalCommand == 4096){
						client.publish('/UpDown',{action : droneOrders[nmentalCommand]});
					}
					else{
						var data = {};
						data.action = droneOrders[nmentalCommand];
						data.speed = 0.5;
						client.publish('/Fly', data);
					}
				}
			}
		}
	}
};
//launch the serv.
server.listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get("port"));
})