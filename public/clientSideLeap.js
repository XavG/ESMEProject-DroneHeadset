/**
**TO CALIBRATE :
** shakingMvt
** variable du filtre passe bas de décolage et atterissage
** nombre de frame et la valeur de la translation pour le up et down
**/
//@todo decollage atterisage

var lClient = {};

/**
**set attribute of the client class "lClient = leapClient".
**fayeClient : contains the context of faye package
**frame : contains the current frame sent by the leap motion
**controller : contains the controller of the leap motion
**takingOff, landing : used to perform a low-pass filter ( action performed each 10 mouvments ) 
**shakingMvt : delta that allow us to decide weather or not the mouvment detected was valid or not
**isFlying : boolean that allow us to know if the drone flys or not
**@TODO : remove the isFLying var and use the navdata instead 
**/

lClient.fayelClient;
lClient.frame;
lClient.controller;
lClient.turnClock = 1;
lClient.turnCounterClock = 1;
lClient.shakingMvt = 0;
lClient.isFlying = false;
lClient.altitude = new Array();
lClient.emergency;
lClient.freeze = false;

/**
**configure faye on client side timeout at 120ms
**set the shaking mouvment variable default at 0.20 
**/
lClient.configFaye = function( shake ) {
	this.fayelClient = new Faye.Client('/faye',{
		timeout : 120
	});

	shake ? this.shakingMvt = shake : this.shakingMvt = 0.20;	
};

/**
**get the leap context and configure it, enableGestures is enough there
**/
lClient.configLeap = function() {
	
	this.controller = new Leap.Controller({ enableGestures: true });
};

/**
**called on circle detection, if clockwise we send a takeoff signal
**set the isFlying var to true
**if counter-clockwise we send a land signal and set isFlying at false
**gesture : the gesture send by the leap
**/
lClient.onCircle = function( gesture ) {
	
	var clockwise = false;

 	if( gesture.normal[2]  <= 0 ){
    	clockwise = true;
  	}

	if( clockwise ){
		
		if( !this.isFlying ){
			var _this = this;
			setTimeout( function () {_this.isFlying = true;} , 1500); 

			return this.postOnFaye( { action : 'takeoff' }, '/UpDown' );

		}else if( this.isFlying && this.turnClock % 10 == 0  ){
			
			this.turnClock = 1;
			return this.flyThisWay( 'clockwise', 0.5 );

		}else{
			this.turnClock++;
			return;
		}
	
	}else{
		
		if( this.turnCounterClock % 10 == 0 && this.isFlying ){
	
			this.turnCounterClock = 1;

			return this.flyThisWay( 'counterClockwise', 0.5 );
		}
		else{
			this.turnCounterClock++;
			return;
		}
	}
};

/**
**handle the publish methode 
**action : an object that contains the name of the method and if needed the speed
**channel : channel we want to publish on
**/
lClient.postOnFaye = function( action, channel ) {

	return this.fayelClient.publish( channel+'' , action );
};

/**
**handle the mouvment on the left and right
**we want to return false so we can detect when to send a stop signal to the drone
**/
lClient.leftRight = function() {
	
	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];
		
		if( firstHand.palmNormal[0] > this.shakingMvt ){
			//going left
			document.getElementById('d_direction').innerHTML = 'GAUCHE';
			return this.flyThisWay( 'left', firstHand.palmNormal[0] );
			//add the shaking thing so we have a speed between 0 and 1 
			//because the drone api take a speed in this range.
		}else if( firstHand.palmNormal[0] < -this.shakingMvt ){
			//going right
			document.getElementById('d_direction').innerHTML = 'DROITE';
			return this.flyThisWay( 'right', -firstHand.palmNormal[0] );		
		}else{
			document.getElementById('d_direction').innerHTML = 'STABLE';
			return false;
		}
	}

	return false;
};

/**
**see leftRight
**/
lClient.forwardBackward = function() {

	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];

		if( firstHand.palmNormal[2] > this.shakingMvt ){
		 	//going forward
			document.getElementById('d_direction').innerHTML = 'AVANT';  			 	
			return this.flyThisWay( 'front', firstHand.palmNormal[2] );
			
		}else if( firstHand.palmNormal[2] < -this.shakingMvt ){
			//going backward
			document.getElementById('d_direction').innerHTML = 'ARRIERE';  			 	
			return this.flyThisWay( 'back', -firstHand.palmNormal[2] );
		}else{
			document.getElementById('d_direction').innerHTML = 'STABLE';  			 	
			return false;
		}
	}

	return false;
};

/**
**see leftRight
**/
lClient.upDown = function() {
	
	if( this.isFlying && this.frame.hands.length >= 1 ){
		
		var firstHand = this.frame.hands[0];
		var normalize = firstHand.palmPosition[1]/600; //normalize the position
		var speed = Math.abs( 0.5 - normalize ) + 0.5; //calculate the speed between 0 and 0.9
		var velocity = firstHand.palmVelocity[1];
		var topFlying = 0.6;
		var botFlying = 0.4;
		var stepVelocity = 200;

		speed = speed >= 1 ? 0.9 : speed;


		if( normalize >= topFlying || velocity >= stepVelocity ){
			//going up
			document.getElementById('d_direction').innerHTML = 'MONTE';
			return this.flyThisWay( 'up', speed );

		}else if( normalize <= botFlying || velocity <= -stepVelocity ){
			//going down
			document.getElementById('d_direction').innerHTML = 'DESCEND';

			if( this.getMeans() <= 0.15 ){
				this.isFlying = false;
				this.postOnFaye( { action : 'stop' }, '/UpDown' );
				return this.postOnFaye( { action : 'land' }, '/UpDown' );
			}
			return this.flyThisWay( 'down', speed );

		}else{
			//stable
			document.getElementById('d_direction').innerHTML = 'STABLE';
			return false;
		}
	}
	return false;

};

/**
**@TODO calibrate time for flip
**/
lClient.barrelRoll = function(){
	
	if( this.isFlying && this.frame.hands.length >= 1 ){
		var firstHand = this.frame.hands[0];

		if( firstHand.palmVelocity[1] > 1700 ){
			this.freeze = true;
			this.postOnFaye( { action : 'flipAhead', duration: 15 }, '/Animate' );
			return setTimeout( function(){ lClient.freeze = false; },3000);

		}else if( firstHand.palmVelocity[1] < -1600 ){
			this.freeze = true;
			this.postOnFaye( { action : 'flipBehind', duration: 15 }, '/Animate' );
			return setTimeout( function(){ lClient.freeze = false; },3000);

		}else if( firstHand.palmVelocity[0] < -1600 ){		
			this.freeze = true;
			this.postOnFaye( { action : 'flipLeft', duration: 15 }, '/Animate' );
			return setTimeout( function(){ lClient.freeze = false; },3000);

		}else if( firstHand.palmVelocity[0] > 1600 ){
			this.freeze = true;
			this.postOnFaye( { action : 'flipRight', duration: 15 }, '/Animate' );
			return setTimeout( function(){ lClient.freeze = false; },3000);
		}
		return false;
	}
	return false;
};

lClient.getMeans = function(){
	var sum = 0;
	for( var i = 0; i< this.altitude.length; i++){
		sum += this.altitude[i];
	}
	return sum/this.altitude.length;
};

/**
**the main routine each time we get a frame from the leap motion we analyze it
**if we detect a circle then we try to make the drone take off or land.
**if the drone is actually flying we're listening to the user mouvment,
**if no mouvment has been detected we send a stop signal to the drone.
**/
lClient.getFrame = function() {

	var _this = this;

	this.controller.on( 'frame', function( data ) {
		_this.frame = data;
		if( _this.frame.hands.length > 0 ){

			for (var i = 0; i < data.gestures.length ; i++) {
				var type = data.gestures[i].type;
				if( type == "circle" ){
					return _this.onCircle( data.gestures[i] );
				}
			}

			if( _this.isFlying && !_this.freeze){
				console.log(_this.freeze);
				if( _this.barrelRoll() != false){
					document.getElementById('d_direction').innerHTML = '<div class="alert alert-success">FIGURE</div>';
				}else if( _this.upDown() != false || _this.forwardBackward() != false || _this.leftRight() != false ){
					document.getElementById('d_direction').innerHTML = '<div class="alert alert-success">EN MOUVEMENT</div>';
				}else{
					document.getElementById('d_direction').innerHTML = '<div class="alert alert-info">STABLE</div>';	
					return _this.postOnFaye( { action : 'stop' }, '/UpDown' );
				}
			}

		} else if( _this.isFlying == true ) {
			return _this.postOnFaye( { action : 'stop' }, '/UpDown' );	
		}

	});
};

/**
**handle the construction of the object that'll be send to the server through faye
**/
lClient.flyThisWay = function(direction,speed) {

	if( direction ){
		var action = {};
		var channel = '/Fly';
		action.speed = speed;
		action.action = direction;
		return this.postOnFaye( action, channel );
	}
};

/**
**get the navdata sent by the server wich are themselves sent by the drone
**/
lClient.navdataRead = function() {
	
	this.fayelClient.subscribe( '/navdata' , this.showData );
};

/**
**will handle the task of informing the user about the state of the drone
**/
lClient.showData =  function( data ) {

	//console.log( data );
	var _this = this;
	document.getElementById('d_battery').innerHTML =  data.demo.batteryPercentage;
	
	if( data.droneState.emergencyLanding == 1 ){
		this.isFlying = false;     		
		document.getElementById('emergency').innerHTML = '<div class="alert alert-danger"> <strong> Drone choqué, appuillez sur entrée pour le retablir </strong></div>';
	}else{
		document.getElementById('emergency').innerHTML = ''; 
	}

	setTimeout( function () { 
		lClient.altitude.push(data.demo.altitude); 
		if (lClient.altitude.length >= 5){
			lClient.altitude.splice(0,1);
		}
		
	}, 200 );
	document.getElementById('d_height').innerHTML =  data.demo.altitude;


};

/**
**calls the function and launch the project 
**/
lClient.run = function() {
	this.configFaye();
	this.configLeap();
	new NodecopterStream( document.getElementById( "firstDroneStream" ) ); // connect the Drone video
	this.navdataRead();
	this.controller.connect();
	this.getFrame();
};

lClient.run();