var _ = require('underscore');
var ninjaBlocks = require('ninja-blocks');
var vars = require('./vars.js');
var moment = require('moment');
var exec = require('child_process').exec;


var USER_ACCESS_TOKEN = vars.userAccessToken;
var PYNEST_COMMAND = vars.pynest_command;

var ninja = ninjaBlocks.app({user_access_token:USER_ACCESS_TOKEN});

// temps get converted to farenheit to compare

var MAX_TIME_DELTA = 180;
var GUID_1 = '0101';
var START_TIME = 22; // 11PM or later
var END_TIME = 7; // 6AM or earlyer
var LOW_LIMIT_HEAT = 68;
var HIGH_LIMIT_HEAT = 72;
var HIGH_LIMIT_AC = 74;

// Get the most recent temperature reading from all temperature sensors
// then analyze and get a single one
ninja.devices({ device_type: 'temperature' }, function(err, devices) {
  _.each(devices, function(device,guid){
    ninja.device(guid).last_heartbeat(function(err, data) {
      if ( data.G === GUID_1) {
        var timestamp = new Date().getTime();
        var timeDelta = (timestamp - data.timestamp) / 1000;
        if (timeDelta < MAX_TIME_DELTA) {
          console.log(device.shortName+' is '+data.DA+'C');
          var temp_f = (data.DA * (9/5)) + 32;
          console.log('');
          console.log('temp in F is: '+temp_f+'F');
          // 
          // 68F min 72F max
          //
          // 11PM start 6AM end
          //
          var now = moment();
          var hour = now.hours();
          console.log(hour);
          if (hour > START_TIME || hour < END_TIME) {
            if (temp_f < LOW_LIMIT_HEAT) {
              // switch to heat
              // check temp and raise by 1 degree
              var child = exec(PYNEST_COMMAND+'mode heat', function(error, stdout, stderr){
                if (error !== null) {
                  console.log('exec error: '+error);
                }
                var child = exec(PYNEST_COMMAND+'curtemp', function(error, stdout, stderr){
                  if (error !== null) {
                    console.log('exec error: '+error);
                  }
                  var current_temp_nest = stdout;
                  var new_temp_nest = current_temp_nest + 1;
                  var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }

                  });
                });
              });
            } else if(temp > HIGH_LIMIT_HEAT) {
              // check mode, if heat lower by 1 degree
              var child = exec(PYNEST_COMMAND+'curmode', function(error, stdout, stderr){
                if (error !== null) {
                  console.log('exec error: '+error);
                }
                if (stdout === 'heat'){
                  var child = exec(PYNEST_COMMAND+'curtemp', function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }
                    var current_temp_nest = stdout;
                    var new_temp_nest = current_temp_nest - 1;
                    var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                      if (error !== null) {
                        console.log('exec error: '+error);
                      }
                    });
                  });
                }
              });

              if (temp > HIGH_LIMIT_AC) {
                // switch to air conditioning
                var child = exec(PYNEST_COMMAND+'mode cool', function(error, stdout, stderr){
                  if (error !== null) {
                    console.log('exec error: '+error);
                  }
                  var child = exec(PYNEST_COMMAND+'curtemp', function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }
                    var current_temp_nest = stdout;
                    var new_temp_nest = current_temp_nest - 1;
                    var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                      if (error !== null) {
                        console.log('exec error: '+error);
                      }

                    });
                  });
                });

              }
            }
          }
        } else {
          console.log("hasn't checked in in over "+MAX_TIME_DELTA+" seconds");
        }
      }
    })
  })
});
