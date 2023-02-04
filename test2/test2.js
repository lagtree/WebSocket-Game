//This snippit allows for both Import and Const-Require to be used in the same doucment. Saves some hassle for future development
import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { WebSocketServer } from 'ws';

import fetch from "node-fetch";

//Creates a WebSocketServer that can be accessed by any client that is ready with the same address and port. While the connection is open, it is secured over the network to prevent clients from sending too much data.
const wss = new WebSocketServer({ port: 9091 });

//Array of all of the clients. Uses built in Uid's from WebSocketServer to manage the naming conventions server side.
const clients = [];

//Yet another Array of the clients. This is the list that is send to the client for Leaderboard functionality.
let names = [];

//Array for all potential words that could be used by the server to distinguish the points that the player can get.
var potential = [];

var answers = null;
var pointsOut = null;
//Handles a list of words (Gets filtered out later so no small words like "a" or "I" and be used).
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
    //Adds the connection between the player and the server to a list of Client Connections named "clients" .push() refrences adding an object to the end of an Array or Set.
    clients.push(ws);
    userWords.push([]);

  ws.on('message', (message) => {
    //incPacket is the preProcessed variable set for any packet sent by the client to the server. JSON.parse() is used to turn strings back into JSON readable text. This makes formatting much easier over a network.
    const incPacket = JSON.parse(message);

    switch (incPacket.type) {
        //Refrences when a packet is of type "name" and runs specific actions only when its true.
        //Client asks the server if its chosen name has been used before. If not, the server responds with the name and adds the name to the server's array. If it has been used before, it drops the response and sends an error to the client.
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
        //Refrences when a packet is of type "playerWord" and runs specific actions only when its true.
        //Client sends a word to the Server. The server will check if the word correlates with the predetermined word specified by the server. Will "throw" a number (points) or an error back to the client, and send the same plus the name of the client to all other clients to be used for client side processing.
        case 'playerWord':
            //handle player's word
            let processedData = processData(message.toString());
        
         
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
        //Refrences when a packet is of type "retrieve" and runs specific actions only when its true.
        //Client will ask for the full list of player names. This fixes an issue where new clients would not have the full list of players if the other players pushed their names before the new client joined. Now, every client is ensured that they have the right names list before a game can begin.
        case 'retrieve':
            let namesPacketResponse = { type : "response", data : JSON.stringify(names) };
            clients[clients.length-1].send(JSON.stringify(namesPacketResponse));
            break;
    }

  });

  ws.on('close', () => {
    //Will disconnect a clients websocket connection if the client force closes the page or browser.
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

//Generates the first word of the random process. The Server will send a scrabled version of this word to the client, which will be used as the letters present on their screen.
function firstWord() {
    let rand = Math.floor(Math.random()*potential.length);
    let w = potential[rand];
    answers = allAnagrams(w);
}

//When the client sends a word back to the server, the server will pass the word through this function to check how many points the word is worth.
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


//Initializes the firstWord() function as soon as the server is started.
firstWord();