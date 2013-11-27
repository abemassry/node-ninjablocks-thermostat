var _ = require('underscore');
var ninjaBlocks = require('ninja-blocks');
var vars = require('./vars.js');

var USER_ACCESS_TOKEN = vars.userAccessToken;

var ninja = ninjaBlocks.app({user_access_token:USER_ACCESS_TOKEN});

var MAX_TIME_DELTA = 180;
var GUID_1 = '0101';

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
        } else {
          console.log("hasn't checked in in over "+MAX_TIME_DELTA+" seconds");
        }
      }
    })
  })
});
