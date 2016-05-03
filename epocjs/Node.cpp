/*
** ESME Project 2016 - by GUERIN Xavier
** XavG <xav.guerin@hotmail.fr>
** 
*/

/* Includes */
#include <iostream>
#include <fstream>
#include <sstream>
#include <map>
#include <cstdlib>
#include <stdexcept>

#ifdef _WIN32
    #include <conio.h>
    #include <windows.h>
#endif
#if __linux__ || __APPLE__
    #include <unistd.h>
#endif

#include "IEmoStateDLL.h"
#include "Iedk.h"
#include "IedkErrorCode.h"

#if __linux__ || __APPLE__
int _kbhit(void);
#endif

#include <node.h>			// include to transfert c++ code into js code

using namespace std;

namespace Epoc {

	using v8::FunctionCallbackInfo;
	using v8::Isolate;
	using v8::Local;
	using v8::Object;
	using v8::String;
	using v8::Value;
	using v8::Boolean;
	using v8::Number;

	/* INITIALIZATION */
	EmoEngineEventHandle eEvent = IEE_EmoEngineEventCreate();
	EmoStateHandle eState = IEE_EmoStateCreate();
	unsigned int userID = 0;
	const unsigned short composerPort = 1726;
	int batteryLevel, maxBatteryLevel = 0;
	int option = 0;
	int state = 0;
	std::string input;

	/* CONNECTION function*/
	void connection(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		Local<Boolean> ret;

		/***********************************  C++ CODE : BEGIN ***********************************/
		/* Connection choices : EmoEngine(1) or EmoRemote (Composer)(2) */
		try {
			cout << "==================================================================="<< endl;
			cout << "Example to show how to log the EmoState from EmoEngine/EmoComposer."<< endl;
			cout << "==================================================================="<< endl;
			cout << "Press '1' to start and connect to the EmoEngine                    "<< endl;
			cout << "Press '2' to connect to the EmoComposer                            "<< endl;
			cout << ">> ";

			getline(cin, input, '\n');
			option = atoi(input.c_str());

			switch (option) {
			case 1:
			{
				if (IEE_EngineConnect() != EDK_OK) {
					throw std::runtime_error("Emotiv Driver start up failed.");
				}
				break;
			}
			case 2:
			{
				if (IEE_EngineRemoteConnect("127.0.0.1", composerPort) != EDK_OK) {
					string errMsg = "Cannot connect to EmoComposer on [" + input + "]";
					throw std::runtime_error(errMsg.c_str());
				}
				break;
			}
			default:
				throw std::runtime_error("Invalid option...");
				break;
			}
			ret = Boolean::New(isolate, true);
		}
		catch (const std::runtime_error& e) {
			cerr << e.what() << std::endl;
			ret = Boolean::New(isolate, false);
		}
		/***********************************  C++ CODE : END ***********************************/
		args.GetReturnValue().Set(ret);
	}

	void checkNextEvent(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		Local<Boolean> ret;
		/***********************************  C++ CODE : BEGIN ***********************************/
		state = IEE_EngineGetNextEvent(eEvent);
		
		if (state == EDK_OK) {
			IEE_Event_t eventType = IEE_EmoEngineEventGetType(eEvent);
			IEE_EmoEngineEventGetUserId(eEvent, &userID);

			// Log the EmoState if it has been updated
			if (eventType == IEE_EmoStateUpdated) {
				IEE_EmoEngineEventGetEmoState(eEvent, eState);
				ret = Boolean::New(isolate, true);
			}
			else{
				ret = Boolean::New(isolate, false);
			}
		}
		else{
			ret = Boolean::New(isolate, false);
		}
		/***********************************  C++ CODE : END ***********************************/
		args.GetReturnValue().Set(ret);
	}

	/* DATAS Functions : To get back informations */
	void getWirelessSignal(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		/***********************************  C++ CODE : BEGIN ***********************************/
		int signal = static_cast<int>(IS_GetWirelessSignalStatus(eState));
		/***********************************  C++ CODE : END ***********************************/
		Local<Number> num = Number::New(isolate, signal);
		args.GetReturnValue().Set(num);
	}
	
	void getBatteryLevel(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		/***********************************  C++ CODE : BEGIN ***********************************/
		IS_GetBatteryChargeLevel(eState, &batteryLevel, &maxBatteryLevel);
		/***********************************  C++ CODE : END ***********************************/
		Local<Number> num = Number::New(isolate, batteryLevel);
		args.GetReturnValue().Set(num);	
	}

	void getTime(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		/***********************************  C++ CODE : BEGIN ***********************************/
		float time = IS_GetTimeFromStart(eState);
		/***********************************  C++ CODE : END ***********************************/
		Local<Number> num = Number::New(isolate, time);
		args.GetReturnValue().Set(num);
	}

	void getMentalCommandeCurrentAction(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();
		/***********************************  C++ CODE : BEGIN ***********************************/
		int currentAction = static_cast<int>(IS_MentalCommandGetCurrentAction(eState));
		/***********************************  C++ CODE : END ***********************************/
		Local<Number> num = Number::New(isolate, currentAction);
		args.GetReturnValue().Set(num);
	}

	void getMentalCommandeCurrentActionPower(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		/***********************************  C++ CODE : BEGIN ***********************************/
		float actionPower = IS_MentalCommandGetCurrentActionPower(eState);
		/***********************************  C++ CODE : END ***********************************/
		Local<Number> num = Number::New(isolate, actionPower);
		args.GetReturnValue().Set(num);
	}


	/* DISCONNECTION Function*/
	void disconnection(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		/***********************************  C++ CODE : BEGIN ***********************************/
		IEE_EngineDisconnect();			//disconnect : engine
		IEE_EmoStateFree(eState);		// free eState and eEvent
		IEE_EmoEngineEventFree(eEvent);
		cout << "Engine disconnect and eState,eEvent free !" << endl;
		/***********************************  C++ CODE : END ***********************************/
	}

	/* EXAMPLE FUNCTION */
	void Model(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		/***********************************  C++ CODE : BEGIN ***********************************/
		
		/***********************************  C++ CODE : END ***********************************/

		//args.GetReturnValue().Set();
	}

	void init(Local<Object> exports) {
		NODE_SET_METHOD(exports, "connection", connection);
		NODE_SET_METHOD(exports, "disconnection", disconnection);
		NODE_SET_METHOD(exports, "checkNextEvent", checkNextEvent);
		NODE_SET_METHOD(exports, "getWirelessSignal", getWirelessSignal);
		NODE_SET_METHOD(exports, "getTime", getTime);
		NODE_SET_METHOD(exports, "getMentalCommandeCurrentAction", getMentalCommandeCurrentAction);
		NODE_SET_METHOD(exports, "getMentalCommandeCurrentActionPower", getMentalCommandeCurrentActionPower);
		NODE_SET_METHOD(exports, "getBatteryLevel", getBatteryLevel);

	}

	NODE_MODULE(addon, init)

}