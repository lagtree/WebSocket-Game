import { createRequire } from "module";
const require = createRequire(import.meta.url);

const express = require('express')();
const http = require('http');
const WebSocket = require('ws');
const { PassThrough } = require("stream");

import fetch from "node-fetch";

const port = 9090;
const server = http.createServer(express);
const wss = new WebSocket.Server({ server })

//read from file a list of words, save it in a list and and shuffle it (twice for good measure)
async function getWords() {
    var response = await fetch('https://www.mit.edu/~ecprice/wordlist.10000');
    var openedText = await response.text(); // <-- changed
    var words = openedText.split(/\r\n|\n/);
    return words;
}

var words = getWords();
console.log(words)

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

//Server Connection And init
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
        wss.clients.forEach(function each(client) {
            const result = JSON.parse(data);
            if (client != ws && client.readyState === WebSocket.OPEN) {
                if (result.data1 === "hello") {
                    console.log('yes!')
                }
            }
        })
    })
})

server.listen(port, function() {
    console.log('Server Listening on Port: ', port)
})
