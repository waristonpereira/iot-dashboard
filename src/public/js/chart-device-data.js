/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith("https")
    ? "wss://"
    : "ws://";
  const webSocket = new WebSocket(protocol + location.host);

  // A class for holding the last N points of telemetry for a device
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.maxLen = 50;
      this.timeData = new Array(this.maxLen);
      this.temperatureData = new Array(this.maxLen);
      this.humidityData = new Array(this.maxLen);
      this.traficData = new Array(this.maxLen);
      this.actualLight = null;
      this.location = "";
    }

    addData(time, temperature, humidity, traffic, light, location) {
      this.timeData.push(time);
      this.temperatureData.push(temperature || null);
      this.humidityData.push(humidity || null);
      this.traficData.push(traffic || null);
      this.actualLight = light || null;
      this.location = location || "";

      if (this.timeData.length > this.maxLen) {
        this.timeData.shift();
        this.temperatureData.shift();
        this.humidityData.shift();
        this.traficData.shift();
      }
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  const chartData = {
    datasets: [
      {
        fill: false,
        label: "Temperature",
        yAxisID: "Temperature",
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        spanGaps: true,
      },
      {
        fill: false,
        label: "Humidity",
        yAxisID: "Humidity",
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        spanGaps: true,
      },
    ],
  };

  const chartData2 = {
    datasets: [
      {
        fill: false,
        label: "Traffic",
        yAxisID: "Traffic",
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    scales: {
      yAxes: [
        {
          id: "Temperature",
          type: "linear",
          scaleLabel: {
            labelString: "Temperature (ºC)",
            display: true,
          },
          position: "left",
        },
        {
          id: "Humidity",
          type: "linear",
          scaleLabel: {
            labelString: "Humidity (%)",
            display: true,
          },
          position: "right",
        },
      ],
    },
  };

  const chartOptions2 = {
    scales: {
      yAxes: [
        {
          id: "Traffic",
          type: "linear",
          scaleLabel: {
            labelString: "Traffic",
            display: true,
          },
          position: "left",
        },
      ],
    },
  };

  // Get the context of the canvas element we want to select
  const ctx = document.getElementById("iotChart").getContext("2d");
  const myLineChart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: chartOptions,
  });

  const ctx2 = document.getElementById("iotChart2").getContext("2d");
  const myLineChart2 = new Chart(ctx2, {
    type: "line",
    data: chartData2,
    options: chartOptions2,
  });
  // Traffic lights
  const ctx3 = document.getElementById("iotLights").getContext("2d");
  ctx3.rect(0, 0, 200, 400);
  ctx3.fillStyle = "grey";
  ctx3.fill();
  
  offlight(50);
  offlight(150);
  offlight(250);

  function offlight(a1) {
    ctx3.beginPath();
    ctx3.arc(75, a1, 40, 10, 12 * Math.PI);
    ctx3.fillStyle = "black";
    ctx3.fill();
    ctx3.stroke();
  }

  function drawLight(a1, fillParam) {
    ctx3.beginPath();
    ctx3.arc(75, a1, 40, 10, 12 * Math.PI);
    ctx3.fillStyle = fillParam;
    ctx3.fill();
    ctx3.stroke();
  }

  function changeLight(to) {
    offlight(50);
    offlight(150);
    offlight(250);
    if ("red" === to) drawLight(50, "red");
    if ("yellow" === to) drawLight(150, "yellow");
    if ("green" === to) drawLight(250, "green");
    console.log("Light change to " + to);
  }

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  let needsAutoSelect = true;
  const deviceCount = document.getElementById("deviceCount");
  const listOfDevices = document.getElementById("listOfDevices");
  function OnSelectionChange() {
    const device = trackedDevices.findDevice(
      listOfDevices[listOfDevices.selectedIndex].text
    );
    chartData.labels = device.timeData;
    chartData.datasets[0].data = device.temperatureData;
    chartData.datasets[1].data = device.humidityData;
    myLineChart.update();

    chartData2.labels = device.timeData;
    chartData2.datasets[0].data = device.traficData;
    myLineChart2.update();

    const deviceLocation = document.getElementById("deviceLocation");
    deviceLocation.innerText = device.location || "";
  }
  listOfDevices.addEventListener("change", OnSelectionChange, false);

  // Handle Data do Device
  const applyButton = document.getElementById("apply");
  function OnClick() {
    const numDevices = trackedDevices.getDevicesCount();
    if (numDevices > 0)
    {
      const deviceMode = document.getElementById("mode");
      const data = {
        device: listOfDevices[listOfDevices.selectedIndex].text,
        payload: {
          'mode': deviceMode[deviceMode.selectedIndex].value,
          'interval_green': parseInt(document.getElementById("red_interval").value),
          'interval_yellow': parseInt(document.getElementById("red_interval").value),
          'interval_red': parseInt(document.getElementById("red_interval").value),
          'location': document.getElementById("location").value,
        },
      }
      webSocket.send(JSON.stringify(data));
      alert('New Config Sent!')
    }
    else
    {
      alert('No devices found!')
    }
  }
  applyButton.addEventListener("click", OnClick, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(
        messageData.DeviceId
      );

      if (existingDeviceData) {
        existingDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.temperature,
          messageData.IotData.humidity,
          messageData.IotData.traffic,
          messageData.IotData.light
        );
        changeLight(messageData.IotData.light);
        const deviceLocation = document.getElementById("deviceLocation");
        deviceLocation.innerText = messageData.IotData.location;
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText =
          numDevices === 1
            ? `${numDevices} device`
            : `${numDevices} devices`;
        newDeviceData.addData(
          messageData.MessageDate,
          messageData.IotData.temperature,
          messageData.IotData.humidity,
          messageData.IotData.traffic,
          messageData.IotData.light
        );

        // add device to the UI list
        const node = document.createElement("option");
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }

      myLineChart.update();
      myLineChart2.update();

      changeLight(messageData.IotData.light);
      const deviceLocation = document.getElementById("deviceLocation");
      deviceLocation.innerText = messageData.IotData.location || "";
    } catch (err) {
      console.error(err);
    }
  };
});
