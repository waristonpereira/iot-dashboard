var Client = require('azure-iothub').Client;
var Message = require('azure-iot-common').Message;

class Message2Device {
  constructor(iotHubConnectionString) {
    this.iotHubConnectionString = iotHubConnectionString;
  }
  
  printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString());
      if (res) console.log(op + ' status: ' + res.constructor.name);
    };
  }
  
  receiveFeedback(err, receiver){
    receiver.on('message', function (msg) {
      console.log('Feedback message:')
      console.log(msg.getData().toString('utf-8'));
    });
  }
  send_message(targetDevice, message) {
    try {
      var serviceClient = Client.fromConnectionString(this.iotHubConnectionString);
      serviceClient.open()
      serviceClient.getFeedbackReceiver(this.receiveFeedback);
      var message = new Message(message);
      message.ack = 'full';
      //message.messageId = "My Message ID";
      console.log('Sending message: ' + message.getData());
      serviceClient.send(targetDevice, message, this.printResultFor('send'));
      serviceClient.close()
    } catch (ex) {
       console.error(ex.message || ex);
    }
  }
}

module.exports = Message2Device;
