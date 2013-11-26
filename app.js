var _ = require('underscore');
var ninjaBlocks = require('ninja-blocks');
var vars = require('vars.js');

var USER_ACCESS_TOKEN = vars.userAccessToken;

var ninja = ninjaBlocks.app({user_access_token:USER_ACCESS_TOKEN});

// Get the most recent temperature reading from all temperature sensors
ninja.devices({ device_type: 'temperature' }, function(err, devices) {
  _.each(devices, function(device,guid){
    ninja.device(guid).last_heartbeat(function(err, data) { 
      console.log(device.shortName+' is '+data.DA+'C');
    })
  })
});
