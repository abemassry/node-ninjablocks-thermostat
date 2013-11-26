var _ = require('underscore');
var ninjaBlocks = require('ninja-blocks');
var vars = require('./vars.js');

var USER_ACCESS_TOKEN = vars.userAccessToken;

var ninja = ninjaBlocks.app({user_access_token:USER_ACCESS_TOKEN});

// Get the most recent temperature reading from all temperature sensors
// then analyze and get a single one
ninja.devices({ device_type: 'temperature' }, function(err, devices) {
  _.each(devices, function(device,guid){
    ninja.device(guid).last_heartbeat(function(err, data) {
      console.log('the guid is: '+guid);
      console.log('');
      console.log(device.shortName+' is '+data.DA+'C');
      console.log('');
      console.log('the data is: ');
      console.log(data);
      console.log('');
      timestamp = new Date().getTime();
      console.log('the time now is: ');
      console.log(timestamp);
      console.log('');
      console.log('the difference is: ');
      console.log(timestamp - data.timestamp);
      console.log('');
      console.log('and in seconds: ');
      console.log((timestamp - data.timestamp) / 1000);
      console.log('and in min: ');
      console.log(((timestamp - data.timestamp) / 1000) / 60);
    })
  })
});
