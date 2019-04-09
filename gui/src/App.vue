<template>
  <div id="app">
    <img src="./assets/logo.png">
    <h1>{{ title }}</h1>
    <h2>{{ subtitle }}</h2>
    <v-layout class="pa-2">
      <v-flex xs12 sm4 md3 v-for="card in cards" :key="card.title" class="ma-3">
        <v-card>
          <v-card-title primary-title>
            <div>
              <h3 class="headline mb-0">{{card.title}}</h3>
              <div>{{ card.text }}</div>
            </div>
          </v-card-title>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn flat color="orange" @click="callUpdate(card.url)">Execute</v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
import axios from "axios";
export default {
  name: "app",
  data() {
    return {
      title: "LCMS adapter",
      subtitle: "Connects LCMS to the DRIVER+ test-bed",
      cards: [
        {
          title: "Send 'Situation overview' update",
          url: "/update",
          text:
            "Sends the information visible in the LCMS 'Situational overview' to the DRIVER+ test-bed as a CAP-message (Common Alerting Protocol)."
        },
        {
          title: "Send 'Stedin' test message",
          url: "/test/stedin",
          text:
            "Sends a test CAP-message on the test-bed, appearing to be send from Stedin"
        },
        {
          title: "Send 'HTM' test message",
          url: "/test/htm",
          text:
            "Sends a test CAP-message on the test-bed, appearing to be send from HTM"
        },
        {
          title: "Send GeoJSON test message",
          url: "/test/geojson",
          text:
            "Sends a test GeoJSON-message on the test-bed, appearing to be send from LCMS"
        },
        {
          title: "Send action test message",
          url: "/test/action",
          text:
            "Sends a test Action-message on the test-bed, which is supposed to appear in the LCMS actielijst"
        }
      ]
    };
  },
  methods: {
    callUpdate: function(url) {
      axios
        .get(url)
        .then(val =>
          console.log("Result: " + val.status + ", " + val.statusText)
        )
        .catch(err => console.error(err));
    }
  }
};
</script>

<style>
html {
  background-color: #8facca;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

#app div {
  text-align: left;
}

.v-card {
  height: 100%;
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
