import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { WebSocketServer } from 'ws';

import fetch from "node-fetch";

const wss = new WebSocketServer({ port: 9091 });

const clients = [];

let names = [];

var potential = [];

var answers = null;
var pointsOut = null;

var response = await fetch('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt');
var openedText = await response.text(); // <-- changed
var words = openedText.split(/\r\n|\n/);


let roundWords = new Array(3);
let numWords = [10, 20, 20];
let timings = [20, 40, 40];
let userWords = [];
let possibleWords = [];

for (let i = 0; i < roundWords.length; i++) {
    roundWords[i] = new Array(numWords[i]);
}

wss.on('connection', (ws) => {
    // ws.uid = clients.length
    clients.push(ws);
    userWords.push([]);

  ws.on('message', (message) => {
    
    const incPacket = JSON.parse(message);

    switch (incPacket.type) {
        case 'name':
            if (names.length == 0) {
                names.push(incPacket.data)
                for (let i = 0; i < clients.length; i++) {
                    const namePacketReturn = { type: 'name', data: incPacket.data}
                    clients[i].send(JSON.stringify(namePacketReturn));
                }
            } else {
                let nameUsed = false;
                for(let i = 0; i < names.length; i++) {
                    if (names[i] == incPacket.data) {
                        nameUsed = true;
                        break;
                    }
                }
                if (!nameUsed) {
                    names.push(incPacket.data);
                    clients[names.length-1].uid = incPacket.data;
                    for (let i = 0; i < clients.length; i++) {
                        const namePacketReturn = { type: 'name', data: incPacket.data}
                        clients[i].send(JSON.stringify(namePacketReturn));
                    }
                } else {
                    const errorPacket = { type : 'error', data: "Can't do that! (name already in use)" }
                    if(clients.length !== names.length) {
                        clients[names.length].send(JSON.stringify(errorPacket));
                    } 
                }
            }
            console.log("name: " + incPacket.data);
            break;
        case 'playerWord':
            //handle player's word
            let processedData = processData(message.toString());
            // console.log("message: " + message);
            // console.log("debug: " + processedData);
            // console.log("clients: " + clients.length);
            // console.log("dataClients: " + clients)
        
         
            // send the processed data back to all clients
            let pointIndex = -1;
            for(let i = 0; i < clients.length; i++) {
                if(clients.uid == ws.uid) {
                    pointIndex = i;
                    break;
               
                } 
            }
            if(pointIndex > -1) {
                let namesPacketResponse = { type : "points", data : processedData };
                clients[pointIndex].send(JSON.stringify(namesPacketResponse));
        
                for(let i = 0; i < clients.length; i++) {
                    if(i != pointIndex) {
                        let namesPacketResponse = { type : "other", data : processedData, data2: pointIndex };
                        clients[i].send(JSON.stringify(namesPacketResponse));
                    }
                }
            }
        
            console.log("playerWord: " + incPacket.data);
            break;
        
        case 'retrieve':
            let namesPacketResponse = { type : "response", data : JSON.stringify(names) };
            clients[clients.length-1].send(JSON.stringify(namesPacketResponse));
            break;
    }

  });

  ws.on('close', () => {
    // clients.delete(ws);
    if (clients.length > 0) {
        for(let i = clients.length - 1; i >= 0; i--) {
            if (clients[i] == ws) {
                const removeLeaderBoardName = JSON.stringify({ type : 'rmLeaderName', data : clients[i].uid});
                console.log(i);
                console.log("clientuid: " + clients[i].uid);
                for (let j = 0; j < clients.length; j++) {
                    if (i != j) {
                        clients[j].send((removeLeaderBoardName));
                    }
                }
                for (let j = 0; j < names.length; j++) {
                    console.log(clients[i].uid + " " + names[j]);
                    if (clients[i].uid == names[j]) {
                        // console.log(true);
                        names.splice(j, 1);
                        break;
                    }
                }
                clients.splice(i, 1);
                userWords.splice(i, 1);
            }
        }
    }
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
    // console.log(potential.length);
    // console.log('w: ' + w);
    // console.log('answers: ' + answers);
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