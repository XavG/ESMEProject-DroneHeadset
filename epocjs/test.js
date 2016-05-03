// hello.js
	const addon = require('./build/Release/addon');
	var myInterv;

	addon.connection();

	process.stdin.setRawMode(true);
	process.stdin.resume();
	process.stdin.on('data', ()=>{
			process.stdin.setRawMode(false);
			clearInterval(myInterv);
			addon.disconnection();
			console.log('Interval clear');
			process.exit();
		});

	myInterv = setInterval(function(){
		if (addon.checkNextEvent()){
			console.log('\nUser ID : ' + addon.eState);
			console.log('Time : ' + addon.getTime());
			console.log('Mental Action : ' + addon.getMentalCommandeCurrentAction());
			console.log('Action Power : ' + addon.getMentalCommandeCurrentActionPower());
			console.log('IsBlinking : ' + addon.isBlinking());
			addon.displayDatas();
		
		}
	},100);




