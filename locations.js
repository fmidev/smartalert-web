var locations = [
    {
      minZoom: 1, //Number from 1 to 18.
      maxZoom: 18, //Number from 1 to 18.
      fillColor: '#ff0000', //Any color string. To disable markers, remove this line or use empty string / null.
      locations: [
        { name: "example", lon: null, lat: null }, //replace name with display name and add coordinates
        { name: 'example', lon: null, lat: null },
      ]
    },
    {
      minZoom: 9,
      maxZoom: 15,
      fillColor: 'red',
      locations: [
        { name: "Kitee", lon: 30.1, lat: 62.5 },
        { name: "mantsala", lon: 25.2, lat: 60.2 },
        { name: "Juupajoki", lon: 25.3, lat: 60.3 },
        { name: "salla", lon: 25.6, lat: 65.4 }
      ]
    },
    {
      minZoom: 1,
      maxZoom: 15,
      fillColor: 'green',
      locations: [
        { name: "Paijanne", lon: 25.2, lat: 60.3 },
        { name: "Nasijarvi", lon: 25.1, lat: 60.4 }
      ]
    }
]