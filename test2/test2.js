import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { WebSocketServer } from 'ws';

import fetch from "node-fetch";

const wss = new WebSocketServer({ port: 9091 });

const clients = new Set();

var potential = [];

var answers = null;
var pointsOut = null;

var response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt');
var openedText = await response.text(); // <-- changed
var words = openedText.split(/\r\n|\n/);

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', (message) => {
   // process the data received from the client
    const paresedData = message.toString().split(" ");
    console.log(paresedData);
    // message = JSON.parse(message)
    let processedData = processData(message.toString());
    console.log("message: " + message);
    console.log("debug: " + processedData);
    console.log("clients: " + clients.size)

 
    // send the processed data back to all clients
    for (const client of clients) {
      client.send(processedData);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

//read from file a list of words, save it in a list and and shuffle it (twice for good measure)

for(var j = 0; j < words.length; j++) {
    if (words[j].length === 6) {
        potential.push(words[j]);
    }
}


function allAnagrams(word) {
    
    var anaWord = word;
    
    var all = [];
    for(var i = 0; i < words.length; i++) {

        var currentWord = words[i];
        anaWord = word;
        
        if(currentWord.length <= anaWord.length) {
            var isAnagram = true;
            for(var k = 0; k < currentWord.length; k++) {
                var current = currentWord.substring(k, k+1);
                var indOf = anaWord.indexOf(current);
                
                
                if(indOf > -1) {
                    anaWord = anaWord.split("");
                    anaWord.splice(indOf, 1);
                    anaWord = anaWord.join('');
                } else {
                    isAnagram = false;
                }
            }
                
            if (isAnagram) {
                all.push(currentWord);
            }
        }
    }
    return all;
}

function firstWord() {
    let rand = Math.floor(Math.random()*potential.length);
    let w = potential[rand];
    answers = allAnagrams(w);
    console.log(potential.length);
    console.log('w: ' + w);
    console.log('answers: ' + answers);
}

function processData(word) {
    if(answers != null){
        var pointsOut = 0
        for(let k = 0; k < answers.length; k++) {
            if (word == answers[k]) {
                pointsOut = word.length * 100;
            }
        }
    }
    return pointsOut;
}

firstWord();