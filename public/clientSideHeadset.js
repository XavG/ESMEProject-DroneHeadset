
/**
**set attribute of the hClient class.
**fayehClient : contains the context of faye package
**frame : contains the current frame sent by the leap motion
**controller : contains the controller of the leap motion
**takingOff, landing : used to perform a low-pass filter ( action performed each 10 mouvments ) 
**shakingMvt : delta that allow us to decide weather or not the mouvment detected was valid or not
**isFlying : boolean that allow us to know if the drone flys or not
**@TODO : remove the isFLying var and use the navdata instead 
**/
 
/*GLOBAL Variables */
var secondVideo = false;


/**
**configure faye on hClient side timeout at 120ms
**/
var fayehClient = new Faye.Client('/faye',{
	timeout : 120
});	
	
/* ALL the subscribes */
// receive new order from the headset
fayehClient.subscribe('/newOrder', function (mentalCommand){
	$('#d_direction').empty();
	$('#d_direction').prepend('<strong class=\"datainput\">' + mentalCommand + '</strong>');
});

// Write Control Datas in Header 'HEADSET'
fayehClient.subscribe('/updateControlData', function(data){
	$('#h_signal').empty();
	$('#h_battery').empty();
	$('#h_isConnected').empty();
	$('#h_signal').prepend(data.signal);
	$('#h_battery').prepend(data.battery);
	$('#h_isConnected').prepend(data.connected);
});

// if Connection to the drone succeed
fayehClient.subscribe('/droneConnected', function(){
	$('#d_isConnected').empty();
	$('#d_isConnected').prepend('CONNECTED');
});

fayehClient.subscribe('/headsetConnection', function(){
	$('#h_isConnected').empty();
	$('#h_isConnected').prepend('CONNECTED');
});

fayehClient.subscribe('headsetDisconnect', function(){
	$('#h_isConnected').empty();
	$('#h_isConnected').prepend('DISCONNECTED');
});


/* ALL click & interaction with the HTML page */
$('#emergencyButton').click(function(){
	$('#emergency').empty();
	$('#emergency').prepend('<strong> WARNING Emergency activated, please press "Enter" to recover the drone</strong>');
	console.log("Landing triggered by keyboard");
	fayehClient.publish('/UpDown',{ action : 'stop' });
	fayehClient.publish('/UpDown',{ action : 'land' });
});

$('#animateArea').delegate('.animate','click', function(){
	var index = $(this).data('index');
	switch(index){
		case 1:
		fayehClient.publish('/Animate', { action : 'flipAhead', duration: 15 });
		break;
		
		case 2:
		fayehClient.publish('/Animate', { action : 'flipBehind', duration: 15 });
		break;
		
		case 3:
		fayehClient.publish('/Animate', { action : 'flipRight', duration: 15 });
		break;
		
		case 4:
		fayehClient.publish('/Animate', { action : 'flipLeft', duration: 15 });
		break;
	}
});

$('#h_connexionButton').click(function (){
	console.log('Clique connection drone');
	fayehClient.publish( '/headConnect', "");
});

$('#s_addStream').click(function(){
	if (secondStream){
		$('#secondStream').prepend('<strong>Video 2:</strong><div id=\"secondDroneStream\"></div>')
		$('#navdataInformation2').prepend('<br/><br/><strong>Vitesse:</strong><span id=\"d_speed\" class=\"datainput\"></span><br /><strong>Altitude du drone:</strong><span id=\"d_height\" class=\"datainput\"></span><br /><strong>Direction: </strong><span id=\"d_direction\" class=\"datainput\"></span><br />')
		secondStream = false;
		$(document).focus();
	}
	else{
		$('#secondStream').empty();
		$('#navdataInformation2').empty();
		secondStream = true;
	}
});

/* ALL key event with the HTML page */
$(document).keydown( function( ev ) {
	console.log(ev.keyCode);
	var data = {};
	data.speed = 0.5;
	var channel = '';
	
	switch(ev.keyCode){
		case 32: //Space
		$('#emergency').empty();
		$('#emergency').prepend('<strong> WARNING Emergency activated, please press "Enter" to recover the drone</strong>');
		console.log("Landing triggered by keyboard");
		data.action = 'stop';
		fayehClient.publish('/UpDown', data);
		data.action = 'land';
		channel = '/UpDown';
		break;
		
		case 13: // Enter
		console.log( "Recovering" );
		$('#emergency').empty();
		data.action = 'disableEmergency';
		channel = '/UpDown';
		break;

		case 37: //left
		$('#kleft').attr('src','Img/aleft.png');
		data.action = 'left';
		channel = '/Fly';
		break;
		
		case 38: // up
		$('#kup').attr('src','Img/aup.png');
		data.action = 'front';
		channel = '/Fly';
		break;
		
		case 39: // right
		$('#kright').attr('src','Img/aright.png');
		data.action = 'right';
		channel = '/Fly';
		break;
		
		case 40: // down
		$('#kdown').attr('src','Img/adown.png');
		data.action = 'back';
		channel = '/Fly';
		break;
		
		case 97: // Pad 1
		$('#kcounterClockwise').attr('src','Img/acounterClockwise.png');
		data.action = 'counterClockwise'
		channel = '/Fly';
		break;
		
		case 98: // Pad 2
		$('#kclockwise').attr('src','Img/aclockwise.png');
		data.action = 'clockwise'
		channel = '/Fly';
		break;
		
		case 100: // Pad 4
		$('#ktakeoff').attr('src','Img/atakeoff.png');
		data.action = 'takeoff'
		channel = '/UpDown';
		break;
		
		case 101: // Pad 5
		$('#kland').attr('src','Img/aland.png');
		data.action = 'land'
		channel = '/UpDown';
		break;
	}
	fayehClient.publish(channel, data);
	$('#d_direction').empty();
	$('#d_direction').prepend('<strong class=\"datainput\">' + data.action + '</strong>');
	
});

$(document).keyup(function(ev){
	if (ev.keyCode != 32 && ev.keyCode != 13){ // != SPACE and ENTER
		var data = {action: 'stop'};
		var notAnOtherKey = false;
		switch(ev.keyCode){
			case 37: //left
			$('#kleft').attr('src','Img/left.png');
			var notAnOtherKey = true;
			break;
			
			case 38: // up
			$('#kup').attr('src','Img/up.png');
			var notAnOtherKey = true;
			break;
			
			case 39: // right
			$('#kright').attr('src','Img/right.png');
			var notAnOtherKey = true;
			break;
			
			case 40: // down
			$('#kdown').attr('src','Img/down.png');
			var notAnOtherKey = true;
			break;
			
			case 97: // Pad 1
			$('#kcounterClockwise').attr('src','Img/counterClockwise.png');
			var notAnOtherKey = true;
			break;
			
			case 98: // Pad 2
			$('#kclockwise').attr('src','Img/clockwise.png');
			var notAnOtherKey = true;
			break;
			
			case 100: // Pad 4
			$('#ktakeoff').attr('src','Img/takeoff.png');
			var notAnOtherKey = true;
			break;
			
			case 101: // Pad 5
			$('#kland').attr('src','Img/land.png');
			var notAnOtherKey = true;
			break;
		}
		if (notAnOtherKey){
			fayehClient.publish('/UpDown', data);
			$('#d_direction').empty();
			$('#d_direction').prepend('<strong class=\"datainput\"> STABLE </strong>');
		}
	}
});
