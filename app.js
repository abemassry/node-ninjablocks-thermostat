var _ = require('underscore');
var ninjaBlocks = require('ninja-blocks');
var vars = require('./vars.js');
var moment = require('moment');
var exec = require('child_process').exec;
var nodemailer = require('nodemailer');

var USER_ACCESS_TOKEN = vars.userAccessToken;
var PYNEST_COMMAND = vars.pynest_command;
var EMAIL_TRANSPORT = vars.email_transport;
var EMAIL_SERVICE = vars.email_service;
var EMAIL_USER = vars.email_user;
var EMAIL_PASS = vars.email_pass;

var transport = nodemailer.createTransport(EMAIL_TRANSPORT, {
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

var ninja = ninjaBlocks.app({user_access_token:USER_ACCESS_TOKEN});

// temps get converted to Fahrenheit to compare

var MAX_TIME_DELTA = 180;
var GUID_1 = '0101';
var START_TIME = 22; // 2200 (greater than 10PM), 11PM or later
var END_TIME = 6; // less than 6AM, 5AM or earlier
var LOW_LIMIT_HEAT = 68; // 68
var HIGH_LIMIT_HEAT = 72; // 72
var HIGH_LIMIT_AC = 73; // 76

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
                console.log('set mode to heat');
                // curtarget is the temperature the nest is currently set to
                var child = exec(PYNEST_COMMAND+'curtarget', function(error, stdout, stderr){
                  if (error !== null) {
                    console.log('exec error: '+error);
                  }
                  var current_temp_nest = Math.round(stdout);
                  var new_temp_nest = current_temp_nest + 1;
                  console.log('current temp nest: '+current_temp_nest);
                  console.log('new temp nest: '+new_temp_nest);
                  var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }
                    var mailOptions = {
                      from: EMAIL_USER,
                      to: EMAIL_USER,
                      subject: "Node ninjablocks temp update",
                      text: 'Ninjablocks temp: '+temp_f+'\nSet Mode to Heat\ncurrent temp nest: '+current_temp_nest+'\nnew temp nest: '+new_temp_nest
                    };
                    transport.sendMail(mailOptions, function(error, response){
                      if(error) {
                        console.log(error);
                      } else {
                        console.log('email sent');
                      }
                    }); //end of transport mail

                  });
                });
              });
            // this block of code never gets called, need to investigate
            } else if(temp_f > HIGH_LIMIT_HEAT && temp_f <= HIGH_LIMIT_AC) {
              // check mode, if heat lower by 1 degree
              var child = exec(PYNEST_COMMAND+'curmode', function(error, stdout, stderr){
                if (error !== null) {
                  console.log('exec error: '+error);
                }
                if (stdout == 'heat'){
                  console.log('current mode is heat');
                  var child = exec(PYNEST_COMMAND+'curtarget', function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }
                    var current_temp_nest = Math.round(stdout);
                    var new_temp_nest = current_temp_nest - 1;
                    console.log('current temp nest: '+current_temp_nest);
                    console.log('new temp nest: '+new_temp_nest);
                    var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                      if (error !== null) {
                        console.log('exec error: '+error);
                      }
                      var mailOptions = {
                        from: EMAIL_USER,
                        to: EMAIL_USER,
                        subject: "Node ninjablocks temp update",
                        text: 'Ninjablocks temp: '+temp_f+'\nCurrent mode is heat\ncurrent temp nest: '+current_temp_nest+'\nnew temp nest: '+new_temp_nest
                      };
                      transport.sendMail(mailOptions, function(error, response){
                        if(error) {
                          console.log(error);
                        } else {
                          console.log('email sent');
                        }
                      }); //end of transport mail
                    });
                  });
                }
              });

            } else if (temp_f > HIGH_LIMIT_AC) {
              // switch to air conditioning
              //var child = exec(PYNEST_COMMAND+'mode cool', function(error, stdout, stderr){
              //  if (error !== null) {
              //    console.log('exec error: '+error);
              //  }
                console.log('switched to air conditioning');
                console.log('disabled');
                var child = exec(PYNEST_COMMAND+'curtarget', function(error, stdout, stderr){
                  if (error !== null) {
                    console.log('exec error: '+error);
                  }
                  var current_temp_nest = Math.round(stdout);
                  var new_temp_nest = current_temp_nest - 1;
                  console.log('current temp nest: '+current_temp_nest);
                  console.log('new temp nest: '+new_temp_nest);
                  var child = exec(PYNEST_COMMAND+'temp '+new_temp_nest, function(error, stdout, stderr){
                    if (error !== null) {
                      console.log('exec error: '+error);
                    }
                    var mailOptions = {
                      from: EMAIL_USER,
                      to: EMAIL_USER,
                      subject: "Node ninjablocks temp update",
                      text: 'Ninjablocks temp: '+temp_f+'\nSet Mode to AC\ndisabled\ncurrent temp nest: '+current_temp_nest+'\nnew temp nest: '+new_temp_nest+'\n'
                    };
                    transport.sendMail(mailOptions, function(error, response){
                      if(error) {
                        console.log(error);
                      } else {
                        console.log('email sent');
                      }
                    }); //end of transport mail
                  });
                });
              //});

            } 
            // here
          } 
        } else {
          console.log("hasn't checked in in over "+MAX_TIME_DELTA+" seconds");
        }
      }
    })
  })
});
